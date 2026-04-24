import logging
from typing import Any

logger = logging.getLogger(__name__)

RULES: dict[str, dict[str, Any]] = {
    "home": {
        "min_income": 40000,
        "max_ratio": 80,
        "employment": ["salaried", "self_employed"],
    },
    "personal": {
        "min_income": 25000,
        "max_ratio": 20,
        "employment": ["salaried", "self_employed", "business_owner"],
    },
    "business": {
        "min_income": 50000,
        "max_ratio": 30,
        "employment": ["business_owner", "self_employed"],
    },
    "auto": {
        "min_income": 20000,
        "max_ratio": 15,
        "employment": ["salaried", "self_employed", "business_owner"],
    },
}


def check(
    loan_type: str | None,
    loan_amount: float | None,
    monthly_income: float | None,
    employment_type: str | None,
) -> dict[str, Any]:
    """Run the loan pre-qualification rule engine.

    Returns dict with keys: eligible, reason, max_amount, status.
    status is one of "eligible" | "ineligible" | "review_needed".
    """
    if not loan_type or loan_type not in RULES:
        return {
            "eligible": False,
            "reason": f"Unknown or missing loan_type: {loan_type}",
            "max_amount": 0.0,
            "status": "ineligible",
        }

    if monthly_income is None or loan_amount is None:
        return {
            "eligible": False,
            "reason": "Missing income or loan amount",
            "max_amount": 0.0,
            "status": "review_needed",
        }

    rule = RULES[loan_type]
    min_income = rule["min_income"]
    max_ratio = rule["max_ratio"]
    allowed_employment = rule["employment"]

    max_amount = float(monthly_income) * max_ratio

    # Employment check
    if employment_type and employment_type not in allowed_employment:
        return {
            "eligible": False,
            "reason": (
                f"Employment type '{employment_type}' not eligible for "
                f"{loan_type} loan (requires: {', '.join(allowed_employment)})"
            ),
            "max_amount": max_amount,
            "status": "ineligible",
        }

    # Income check
    if monthly_income < min_income:
        # Borderline: within 20% of threshold
        if monthly_income >= min_income * 0.8:
            return {
                "eligible": False,
                "reason": (
                    f"Income ₹{monthly_income:,.0f} is close to but below "
                    f"₹{min_income:,.0f} threshold for {loan_type} loan — manual review"
                ),
                "max_amount": max_amount,
                "status": "review_needed",
            }
        return {
            "eligible": False,
            "reason": (
                f"Monthly income ₹{monthly_income:,.0f} below "
                f"₹{min_income:,.0f} minimum for {loan_type} loan"
            ),
            "max_amount": max_amount,
            "status": "ineligible",
        }

    # Loan-to-income ratio check
    if loan_amount > max_amount:
        # Borderline: within 20% above the cap
        if loan_amount <= max_amount * 1.2:
            return {
                "eligible": False,
                "reason": (
                    f"Requested ₹{loan_amount:,.0f} exceeds {max_ratio}x income cap "
                    f"(₹{max_amount:,.0f}) but within 20% — manual review"
                ),
                "max_amount": max_amount,
                "status": "review_needed",
            }
        return {
            "eligible": False,
            "reason": (
                f"Requested ₹{loan_amount:,.0f} exceeds maximum ₹{max_amount:,.0f} "
                f"({max_ratio}x monthly income)"
            ),
            "max_amount": max_amount,
            "status": "ineligible",
        }

    return {
        "eligible": True,
        "reason": (
            f"Income meets {max_ratio}x loan amount criteria for {loan_type} loan"
        ),
        "max_amount": max_amount,
        "status": "eligible",
    }
