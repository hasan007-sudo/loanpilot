import logging
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.lead import Lead
from services import eligibility, summary

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["webhook"])


class BolnaWebhookRequest(BaseModel):
    tool_name: str
    call_id: str | None = None
    parameters: dict[str, Any] = Field(default_factory=dict)


def _ok(data: Any) -> dict[str, Any]:
    return {"data": data, "error": None}


def _err(message: str) -> dict[str, Any]:
    return {"data": None, "error": message}


_STATUS_FROM_ELIGIBILITY = {
    "eligible": "pre_qualified",
    "ineligible": "not_interested",
    "review_needed": "interested",
    "pending": "called",
}


@router.post("/bolna")
async def bolna_webhook(
    payload: BolnaWebhookRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    tool = payload.tool_name
    params = payload.parameters or {}
    call_id = payload.call_id

    logger.info("Bolna webhook tool=%s call_id=%s", tool, call_id)

    try:
        if tool == "fetch_customer_profile":
            phone = params.get("phone")
            if not phone:
                return _err("phone is required")

            result = await db.execute(select(Lead).where(Lead.phone == phone))
            lead = result.scalar_one_or_none()
            name = lead.name if lead and lead.name else "Valued Customer"
            existing_loans = 1 if lead and lead.loan_type else 0
            relationship = "existing_customer" if lead else "prospect"

            return _ok(
                {
                    "name": name,
                    "existing_loans": existing_loans,
                    "relationship": relationship,
                }
            )

        if tool == "check_eligibility":
            result = eligibility.check(
                loan_type=params.get("loan_type"),
                loan_amount=params.get("loan_amount"),
                monthly_income=params.get("monthly_income"),
                employment_type=params.get("employment_type"),
            )
            return _ok(
                {
                    "eligible": result["eligible"],
                    "reason": result["reason"],
                    "max_amount": result["max_amount"],
                }
            )

        if tool == "log_lead":
            phone = params.get("phone")
            if not phone:
                return _err("phone is required")

            transcript = params.get("call_transcript")
            summary_text: str | None = None
            if transcript:
                summary_text = await summary.generate(transcript)

            elig_result = eligibility.check(
                loan_type=params.get("loan_type"),
                loan_amount=params.get("loan_amount"),
                monthly_income=params.get("monthly_income"),
                employment_type=params.get("employment_type"),
            )
            eligibility_status = elig_result["status"]

            # Prefer explicit status from Bolna; otherwise derive
            supplied_status = params.get("status")
            final_status = supplied_status or _STATUS_FROM_ELIGIBILITY.get(
                eligibility_status, "called"
            )

            # Upsert by phone
            existing = await db.execute(select(Lead).where(Lead.phone == phone))
            lead = existing.scalar_one_or_none()

            if lead is None:
                lead = Lead(phone=phone)
                db.add(lead)

            for field in (
                "name",
                "campaign_id",
                "loan_type",
                "loan_amount",
                "monthly_income",
                "employment_type",
            ):
                if field in params and params[field] is not None:
                    setattr(lead, field, params[field])

            lead.status = final_status
            lead.eligibility = eligibility_status
            if transcript:
                lead.call_transcript = transcript
            if summary_text:
                lead.summary = summary_text
            if call_id:
                lead.bolna_call_id = call_id

            await db.commit()
            await db.refresh(lead)

            return _ok(
                {
                    "lead_id": lead.id,
                    "summary": lead.summary
                    or "Lead logged without transcript summary.",
                }
            )

        return _err(f"Unknown tool_name: {tool}")

    except Exception as exc:
        logger.exception("Webhook handler failed for tool=%s: %s", tool, exc)
        await db.rollback()
        return _err(f"Internal error handling {tool}")
