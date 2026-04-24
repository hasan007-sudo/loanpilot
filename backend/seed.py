"""Seed the LoanPilot SQLite database with realistic demo data.

Usage:
    python seed.py
"""
import asyncio
import logging
import random
from datetime import datetime, timedelta

from sqlalchemy import delete

from database import AsyncSessionLocal, init_db
from models.campaign import Campaign
from models.lead import Lead
from services import eligibility

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed")

random.seed(42)

FIRST_NAMES = [
    "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rohan", "Neha",
    "Arjun", "Pooja", "Karthik", "Divya", "Suresh", "Meera", "Rajesh", "Kavya",
    "Manish", "Aarti", "Sanjay", "Ritu", "Deepak", "Swati", "Nikhil", "Shreya",
    "Ashok", "Lakshmi", "Varun", "Ananya", "Harsh", "Ishita",
]
LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Reddy", "Kumar", "Singh", "Gupta", "Iyer",
    "Nair", "Joshi", "Mehta", "Kapoor", "Das", "Chowdhury", "Bose", "Rao",
    "Menon", "Pillai", "Desai", "Shah",
]

LOAN_TYPES = ["home", "personal", "business", "auto"]
EMPLOYMENT_TYPES = ["salaried", "self_employed", "business_owner"]
STATUSES = ["called", "not_interested", "interested", "pre_qualified", "passed_to_rm"]

TRANSCRIPT_TEMPLATE = (
    "Agent: Good afternoon, I'm calling from {bank} regarding a special "
    "{loan_type} loan offer. Do you have 2 minutes?\n"
    "Customer: Yes, tell me more.\n"
    "Agent: Are you currently exploring a {loan_type} loan?\n"
    "Customer: Actually yes, I was thinking of around {amount} rupees.\n"
    "Agent: Great. May I know your monthly income and employment type?\n"
    "Customer: I earn about {income} per month, I'm {employment}.\n"
    "Agent: Thank you. Let me check your eligibility...\n"
    "Agent: Based on your profile, you {outcome}. Our Relationship Manager "
    "will reach out shortly with exact rates and next steps.\n"
    "Customer: Sounds good, thank you.\n"
    "Agent: Thank you for your time, have a great day."
)

MOCK_SUMMARY_TEMPLATE = (
    "Customer {name} expressed interest in a ₹{amount:,.0f} {loan_type} loan. "
    "They reported monthly income of ₹{income:,.0f} and are {employment}. "
    "Outcome: {outcome_line} — {next_step}."
)


def _phone() -> str:
    return "+91" + "".join(str(random.randint(0, 9)) for _ in range(10))


def _name() -> str:
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def _loan_amount(loan_type: str) -> float:
    if loan_type == "home":
        return float(random.choice([2500000, 4000000, 5000000, 7500000, 10000000]))
    if loan_type == "business":
        return float(random.choice([1000000, 2000000, 3500000, 5000000]))
    if loan_type == "auto":
        return float(random.choice([400000, 600000, 900000, 1200000]))
    return float(random.choice([100000, 250000, 500000, 800000]))


def _income() -> float:
    return float(random.choice([18000, 25000, 35000, 50000, 75000, 100000, 150000, 250000]))


async def seed() -> None:
    await init_db()

    async with AsyncSessionLocal() as db:
        # Wipe existing data for a clean seed
        await db.execute(delete(Lead))
        await db.execute(delete(Campaign))
        await db.commit()

        campaigns_data = [
            {"name": "Q1 Home Loan Drive", "bank_name": "HDFC Bank"},
            {"name": "Personal Loan Campaign", "bank_name": "ICICI Bank"},
            {"name": "Auto Loan March", "bank_name": "Axis Bank"},
        ]
        campaign_objs: list[Campaign] = []
        for idx, data in enumerate(campaigns_data):
            created_at = datetime.utcnow() - timedelta(days=7 - idx)
            c = Campaign(
                name=data["name"],
                bank_name=data["bank_name"],
                total_leads=0,
                status="running",
                bolna_batch_id=f"mock_batch_{idx+1:04d}",
                created_at=created_at,
            )
            db.add(c)
            campaign_objs.append(c)

        await db.commit()
        for c in campaign_objs:
            await db.refresh(c)

        # 50 leads
        total_leads = 50
        transcripts_to_fill = set(random.sample(range(total_leads), 20))

        counts: dict[int, dict[str, int]] = {
            c.id: {"called": 0, "interested": 0, "qualified": 0} for c in campaign_objs
        }

        for i in range(total_leads):
            campaign = random.choice(campaign_objs)
            # Bias loan type by campaign name
            if "Home" in campaign.name:
                loan_type = random.choices(
                    LOAN_TYPES, weights=[6, 2, 1, 1], k=1
                )[0]
            elif "Personal" in campaign.name:
                loan_type = random.choices(
                    LOAN_TYPES, weights=[1, 6, 1, 2], k=1
                )[0]
            else:
                loan_type = random.choices(
                    LOAN_TYPES, weights=[1, 2, 2, 6], k=1
                )[0]

            employment = random.choice(EMPLOYMENT_TYPES)
            loan_amount = _loan_amount(loan_type)
            monthly_income = _income()

            elig = eligibility.check(
                loan_type=loan_type,
                loan_amount=loan_amount,
                monthly_income=monthly_income,
                employment_type=employment,
            )
            eligibility_status = elig["status"]

            # Map eligibility → status but sprinkle variety
            roll = random.random()
            if roll < 0.12:
                status = "not_interested"
            elif roll < 0.22:
                status = "called"
            elif eligibility_status == "eligible":
                status = random.choice(["pre_qualified", "passed_to_rm"])
            elif eligibility_status == "review_needed":
                status = "interested"
            else:
                status = random.choice(["not_interested", "called"])

            name = _name()
            phone = _phone()

            transcript = None
            summary_text = None
            if i in transcripts_to_fill:
                outcome = (
                    "pre-qualify for this loan" if eligibility_status == "eligible"
                    else "will need additional review"
                    if eligibility_status == "review_needed"
                    else "may not qualify under current criteria"
                )
                transcript = TRANSCRIPT_TEMPLATE.format(
                    bank=campaign.bank_name or "the bank",
                    loan_type=loan_type,
                    amount=f"{loan_amount:,.0f}",
                    income=f"{monthly_income:,.0f}",
                    employment=employment.replace("_", " "),
                    outcome=outcome,
                )
                outcome_line = {
                    "eligible": "pre-qualified",
                    "review_needed": "flagged for manual review",
                    "ineligible": "did not meet criteria",
                    "pending": "pending review",
                }[eligibility_status]
                next_step = (
                    "Relationship Manager callback scheduled"
                    if eligibility_status in ("eligible", "review_needed")
                    else "lead archived"
                )
                summary_text = MOCK_SUMMARY_TEMPLATE.format(
                    name=name,
                    amount=loan_amount,
                    loan_type=loan_type,
                    income=monthly_income,
                    employment=employment.replace("_", " "),
                    outcome_line=outcome_line,
                    next_step=next_step,
                )

            created_at = datetime.utcnow() - timedelta(
                days=random.randint(0, 6),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
            )

            lead = Lead(
                phone=phone,
                name=name,
                campaign_id=campaign.id,
                loan_type=loan_type,
                loan_amount=loan_amount,
                monthly_income=monthly_income,
                employment_type=employment,
                status=status,
                eligibility=eligibility_status,
                call_transcript=transcript,
                summary=summary_text,
                bolna_call_id=f"bolna_call_{i+1:05d}",
                created_at=created_at,
                updated_at=created_at,
            )
            db.add(lead)

            counts[campaign.id]["called"] += 1
            if status in ("interested", "pre_qualified", "passed_to_rm"):
                counts[campaign.id]["interested"] += 1
            if status in ("pre_qualified", "passed_to_rm"):
                counts[campaign.id]["qualified"] += 1

        # Update campaign counters
        for c in campaign_objs:
            c.total_leads = counts[c.id]["called"]
            c.called_count = counts[c.id]["called"]
            c.interested_count = counts[c.id]["interested"]
            c.qualified_count = counts[c.id]["qualified"]

        await db.commit()
        logger.info(
            "Seed complete: %d campaigns, %d leads (%d with transcripts)",
            len(campaign_objs),
            total_leads,
            len(transcripts_to_fill),
        )


if __name__ == "__main__":
    asyncio.run(seed())
