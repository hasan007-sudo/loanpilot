import logging
import os

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"

PROMPT_TEMPLATE = (
    "You are a bank loan officer assistant. Summarize this loan pre-qualification "
    "call in 3 sentences:\n"
    "1) Customer interest and loan type\n"
    "2) Financial profile (income, employment)\n"
    "3) Eligibility outcome and next step.\n\n"
    "Transcript:\n{transcript}"
)


def _mock_summary(transcript: str) -> str:
    snippet = (transcript or "").strip().replace("\n", " ")[:140]
    return (
        "Customer expressed interest in a loan product and shared basic financial "
        "details during the call. Their profile was assessed against standard "
        "pre-qualification rules. A Relationship Manager will follow up with next "
        f"steps. [Mock summary — snippet: {snippet}]"
    )


async def generate(transcript: str | None) -> str:
    if not transcript or not transcript.strip():
        return "No transcript available for this call."

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY not set — returning mock summary")
        return _mock_summary(transcript)

    try:
        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=api_key)
        message = await client.messages.create(
            model=MODEL,
            max_tokens=400,
            messages=[
                {
                    "role": "user",
                    "content": PROMPT_TEMPLATE.format(transcript=transcript),
                }
            ],
        )
        parts = [
            block.text for block in message.content if getattr(block, "type", "") == "text"
        ]
        return "\n".join(parts).strip() or _mock_summary(transcript)
    except Exception as exc:
        logger.exception("Claude summary generation failed: %s", exc)
        return _mock_summary(transcript)
