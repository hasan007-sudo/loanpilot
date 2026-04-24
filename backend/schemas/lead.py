from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LeadBase(BaseModel):
    phone: str
    name: Optional[str] = None
    campaign_id: Optional[int] = None
    loan_type: Optional[str] = None
    loan_amount: Optional[float] = None
    monthly_income: Optional[float] = None
    employment_type: Optional[str] = None


class LeadCreate(LeadBase):
    status: str = "called"
    eligibility: str = "pending"
    call_transcript: Optional[str] = None
    summary: Optional[str] = None
    bolna_call_id: Optional[str] = None


class LeadResponse(LeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    eligibility: str
    bolna_call_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LeadDetail(LeadResponse):
    call_transcript: Optional[str] = None
    summary: Optional[str] = None
