import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.lead import Lead
from schemas.lead import LeadDetail, LeadResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/leads", tags=["leads"])


def _ok(data: Any) -> dict[str, Any]:
    return {"data": data, "error": None}


def _err(message: str) -> dict[str, Any]:
    return {"data": None, "error": message}


@router.get("")
async def list_leads(
    status: Optional[str] = Query(None),
    loan_type: Optional[str] = Query(None),
    campaign_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    try:
        stmt = select(Lead).order_by(Lead.created_at.desc())
        if status:
            stmt = stmt.where(Lead.status == status)
        if loan_type:
            stmt = stmt.where(Lead.loan_type == loan_type)
        if campaign_id is not None:
            stmt = stmt.where(Lead.campaign_id == campaign_id)

        result = await db.execute(stmt)
        leads = result.scalars().all()
        return _ok([LeadResponse.model_validate(lead).model_dump(mode="json") for lead in leads])
    except Exception as exc:
        logger.exception("Failed to list leads: %s", exc)
        return _err("Failed to list leads")


@router.get("/{lead_id}")
async def get_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    try:
        result = await db.execute(select(Lead).where(Lead.id == lead_id))
        lead = result.scalar_one_or_none()
        if lead is None:
            return _err(f"Lead {lead_id} not found")
        return _ok(LeadDetail.model_validate(lead).model_dump(mode="json"))
    except Exception as exc:
        logger.exception("Failed to fetch lead %s: %s", lead_id, exc)
        return _err("Failed to fetch lead")
