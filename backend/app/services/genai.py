"""
services/genai.py — GenAI / LLM Integration Service

Architecture Decision:
  It returns a structured AnalysisResult that the frontend presents to the 
  support manager for review. The manager must explicitly accept (and optionally 
  override) the suggestions before they are persisted.

Provider strategy:
  - "mock"    : returns deterministic responses
  - "openai"  : calls the OpenAI Chat API
"""

from __future__ import annotations
import json
import random
from typing import Protocol
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.ticket import (
    AnalysisBase,
    TicketCategory,
    TicketSentiment,
)

logger = get_logger(__name__)

class AnalysisResult(AnalysisBase):
    """Transient GenAI output returned to the client for review."""
    pass

class LLMProvider(Protocol):
    async def analyse(self, title: str, body: str) -> AnalysisResult: ...

_MOCK_CATEGORIES = list(TicketCategory)
_MOCK_SENTIMENTS = list(TicketSentiment)
_MOCK_SUMMARIES = [
    "Customer reports difficulty accessing their account after a recent password reset.",
    "User is experiencing repeated billing discrepancies and requests a refund for overcharges.",
    "Shipment delayed by over two weeks; customer requests immediate status update.",
    "Technical issue with the mobile app crashing on login for Android 14 devices.",
    "General inquiry about upgrading to a premium plan and associated feature differences.",
]

class MockLLMProvider:
    """Returns deterministic-ish responses without hitting any external API."""

    async def analyse(self, title: str, body: str) -> AnalysisResult:
        # randomness on the title
        rng = random.Random(hash(title))
        logger.info("Mock GenAI analysis requested", title=title[:60])

        return AnalysisResult(
            suggested_category=rng.choice(_MOCK_CATEGORIES),
            suggested_sentiment=rng.choice(_MOCK_SENTIMENTS),
            summary=rng.choice(_MOCK_SUMMARIES),
            confidence_score=round(rng.uniform(0.65, 0.98), 3),
            raw_llm_response=json.dumps(
                {"mock": True, "title_hash": hash(title)}
            ),
        )

ANALYSIS_SYSTEM_PROMPT = """
You are a customer support categorisation assistant.
Given a support ticket title and body, return a JSON object with exactly these keys:
  - suggested_category: one of [billing, technical, shipping, account, general, other]
  - suggested_sentiment: one of [positive, neutral, negative, mixed]
  - summary: a one- or two-sentence neutral summary of the issue (max 200 chars)
  - confidence_score: a float between 0.0 and 1.0 representing your confidence

Respond ONLY with valid JSON. Do not include any prose.
""".strip()

class OpenAIProvider:
    def __init__(self) -> None:
        try:
            import httpx
        except ImportError as exc:
            raise RuntimeError("httpx is required for the OpenAI provider") from exc

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def analyse(self, title: str, body: str) -> AnalysisResult:
        import httpx

        settings = get_settings()
        user_content = f"Title: {title}\n\nBody: {body}"

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": settings.OPENAI_MODEL,
                    "messages": [
                        {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                        {"role": "user", "content": user_content},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2,
                },
            )
            response.raise_for_status()

        raw = response.json()["choices"][0]["message"]["content"]
        data = json.loads(raw)
        logger.info("OpenAI analysis complete", confidence=data.get("confidence_score"))

        return AnalysisResult(
            **data,
            raw_llm_response=raw,
        )

def get_llm_provider() -> LLMProvider:
    """FastAPI dependency: return the configured LLM provider."""
    settings = get_settings()
    provider_name = settings.GENAI_PROVIDER

    if provider_name == "openai":
        return OpenAIProvider()
    return MockLLMProvider()
