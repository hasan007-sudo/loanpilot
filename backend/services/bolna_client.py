import logging
import os
import uuid
from typing import Any

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

BOLNA_API_KEY = os.getenv("BOLNA_API_KEY")
BOLNA_BASE_URL = os.getenv("BOLNA_BASE_URL", "https://api.bolna.dev")


async def create_batch(
    campaign_name: str,
    leads: list[dict[str, Any]] | None = None,
    agent_id: str | None = None,
) -> dict[str, Any]:
    """Mock Bolna batch-campaign creation.

    In production this would POST to Bolna's batch endpoint. For the demo
    we just log and return a synthetic batch_id.
    """
    batch_id = f"mock_batch_{uuid.uuid4().hex[:12]}"
    logger.info(
        "Stubbed Bolna create_batch: campaign=%s leads=%d agent_id=%s batch_id=%s",
        campaign_name,
        len(leads or []),
        agent_id,
        batch_id,
    )
    return {
        "batch_id": batch_id,
        "status": "queued",
        "campaign": campaign_name,
    }
