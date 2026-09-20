"""
services/ticket_service.py
"""

from __future__ import annotations
import math
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import col, func, select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.logging import get_logger
from app.models.ticket import (
    AnalysisAccept,
    PaginatedTickets,
    Ticket,
    TicketAnalysis,
    TicketCreate,
    TicketRead,
    TicketStatus,
    TicketUpdate,
)
from app.services.genai import AnalysisResult

logger = get_logger(__name__)

async def get_ticket_or_404(ticket_id: UUID, session: AsyncSession) -> Ticket:
    ticket = await session.get(
        Ticket, ticket_id, options=[selectinload(getattr(Ticket, "analysis"))]
    )
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_id} not found",
        )
    return ticket

async def list_tickets(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[TicketStatus] = None,
    is_complex: Optional[bool] = None,
) -> PaginatedTickets:
    """Return a paginated, optionally filtered list of tickets."""
    query = select(Ticket)

    if status_filter is not None:
        query = query.where(Ticket.status == status_filter)
    if is_complex is not None:
        query = query.where(Ticket.is_complex == is_complex)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.exec(count_query)
    total: int = total_result.one()

    offset = (page - 1) * page_size
    paged_query = (
        query.options(selectinload(getattr(Ticket, "analysis")))
        .order_by(col(Ticket.created_at).desc())
        .offset(offset)
        .limit(page_size)
    )
    results = await session.exec(paged_query)
    tickets = results.all()

    return PaginatedTickets(
        items=[TicketRead.model_validate(t) for t in tickets],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )

async def create_ticket(payload: TicketCreate, session: AsyncSession) -> TicketRead:
    ticket = Ticket.model_validate(payload)
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)
    ticket.analysis = None
    logger.info("Ticket created", ticket_id=str(ticket.id))
    return TicketRead.model_validate(ticket)

async def update_ticket(
    ticket_id: UUID, payload: TicketUpdate, session: AsyncSession
) -> TicketRead:
    ticket = await get_ticket_or_404(ticket_id, session)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ticket, key, value)
    ticket.updated_at = datetime.now(timezone.utc)
    session.add(ticket)
    await session.commit()
    logger.info("Ticket updated", ticket_id=str(ticket_id), fields=list(update_data))
    return TicketRead.model_validate(ticket)

async def save_analysis(
    ticket_id: UUID,
    analysis_result: AnalysisResult,
    accept_payload: AnalysisAccept,
    session: AsyncSession,
    reviewed_by: str,
) -> TicketRead:
    """
    Persist the manager-reviewed analysis and advance the ticket status.

    This is the deterministic save step — the GenAI result is only stored
    after a human has reviewed it via the accept endpoint.
    """
    ticket = await get_ticket_or_404(ticket_id, session)
    analysis = TicketAnalysis(
        ticket_id=ticket_id,
        suggested_category=accept_payload.suggested_category or analysis_result.suggested_category,
        suggested_sentiment=accept_payload.suggested_sentiment or analysis_result.suggested_sentiment,
        summary=accept_payload.summary or analysis_result.summary,
        confidence_score=analysis_result.confidence_score,
        raw_llm_response=analysis_result.raw_llm_response,
        reviewed_by=reviewed_by,
        is_accepted=True,
    )
    session.add(analysis)

    ticket.status = TicketStatus.ANALYZED
    ticket.updated_at = datetime.now(timezone.utc)
    session.add(ticket)

    await session.commit()
    ticket.analysis = analysis
    logger.info(
        "Analysis saved",
        ticket_id=str(ticket_id),
        reviewed_by=reviewed_by,
        category=analysis.suggested_category,
    )
    return TicketRead.model_validate(ticket)
