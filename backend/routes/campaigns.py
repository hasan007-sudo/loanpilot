import logging
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.campaign import Campaign
from models.lead import Lead
from schemas.campaign import CampaignCreate, CampaignResponse, DashboardStats
from services import bolna_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["campaigns"])


def _ok(data: Any) -> dict[str, Any]:
    return {"data": data, "error": None}


def _err(message: str) -> dict[str, Any]:
    return {"data": None, "error": message}


@router.get("/campaigns")
async def list_campaigns(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    try:
        result = await db.execute(select(Campaign).order_by(Campaign.created_at.desc()))
        campaigns = result.scalars().all()
        return _ok(
            [CampaignResponse.model_validate(c).model_dump(mode="json") for c in campaigns]
        )
    except Exception as exc:
        logger.exception("Failed to list campaigns: %s", exc)
        return _err("Failed to list campaigns")


@router.post("/campaigns")
async def create_campaign(
    payload: CampaignCreate,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    try:
        campaign = Campaign(
            name=payload.name,
            bank_name=payload.bank_name,
            total_leads=payload.total_leads,
            status="draft",
        )
        db.add(campaign)
        await db.commit()
        await db.refresh(campaign)

        # Fire off a (mock) Bolna batch
        batch = await bolna_client.create_batch(
            campaign_name=campaign.name,
            leads=[],
        )
        campaign.bolna_batch_id = batch.get("batch_id")
        campaign.status = "running"
        await db.commit()
        await db.refresh(campaign)

        return _ok(CampaignResponse.model_validate(campaign).model_dump(mode="json"))
    except Exception as exc:
        logger.exception("Failed to create campaign: %s", exc)
        await db.rollback()
        return _err("Failed to create campaign")


@router.get("/dashboard/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    try:
        total_called = (
            await db.execute(select(func.count()).select_from(Lead))
        ).scalar_one() or 0

        interested = (
            await db.execute(
                select(func.count())
                .select_from(Lead)
                .where(Lead.status.in_(["interested", "pre_qualified", "passed_to_rm"]))
            )
        ).scalar_one() or 0

        qualified = (
            await db.execute(
                select(func.count())
                .select_from(Lead)
                .where(Lead.status.in_(["pre_qualified", "passed_to_rm"]))
            )
        ).scalar_one() or 0

        not_interested = (
            await db.execute(
                select(func.count())
                .select_from(Lead)
                .where(Lead.status == "not_interested")
            )
        ).scalar_one() or 0

        conversion_rate = (
            round((qualified / total_called) * 100, 2) if total_called else 0.0
        )

        stats = DashboardStats(
            total_called=total_called,
            interested=interested,
            qualified=qualified,
            not_interested=not_interested,
            conversion_rate=conversion_rate,
        )
        return _ok(stats.model_dump(mode="json"))
    except Exception as exc:
        logger.exception("Failed to compute dashboard stats: %s", exc)
        return _err("Failed to compute dashboard stats")
