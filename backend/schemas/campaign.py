from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CampaignBase(BaseModel):
    name: str
    bank_name: Optional[str] = None
    total_leads: int = 0


class CampaignCreate(CampaignBase):
    pass


class CampaignResponse(CampaignBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    called_count: int
    interested_count: int
    qualified_count: int
    bolna_batch_id: Optional[str] = None
    status: str
    created_at: datetime


class DashboardStats(BaseModel):
    total_called: int
    interested: int
    qualified: int
    not_interested: int
    conversion_rate: float
