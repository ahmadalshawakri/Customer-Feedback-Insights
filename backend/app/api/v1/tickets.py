"""
api/v1/tickets.py — Ticket REST Endpoints

Routes:
  GET    /api/v1/tickets          — paginated list with optional filters
  POST   /api/v1/tickets          — create a new ticket
  GET    /api/v1/tickets/{id}     — retrieve a single ticket
  PATCH  /api/v1/tickets/{id}     — partial update
  POST   /api/v1/tickets/{id}/analyze   — trigger GenAI analysis (non-blocking)
  POST   /api/v1/tickets/{id}/accept    — manager accepts & persists the analysis
"""

from __future__ import annotations
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_session
from app.services.auth_service import (
    UserContext,
    require_auth,
    require_support_manager,
)
from app.models.ticket import (
    AnalysisAccept,
    PaginatedTickets,
    TicketCreate,
    TicketRead,
    TicketStatus,
    TicketUpdate,
)
from app.services import genai as genai_service
from app.services import ticket_service
from app.services.genai import AnalysisResult, get_llm_provider

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.get("", response_model=PaginatedTickets, summary="List tickets (paginated)")
async def list_tickets(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    status: Optional[TicketStatus] = Query(default=None, description="Filter by status"),
    is_complex: Optional[bool] = Query(default=None, description="Filter by complexity flag"),
    session: AsyncSession = Depends(get_session),
    _user: UserContext = Depends(require_auth),
):
    return await ticket_service.list_tickets(
        session=session,
        page=page,
        page_size=page_size,
        status_filter=status,
        is_complex=is_complex,
    )

@router.post(
    "",
    response_model=TicketRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new ticket",
)
async def create_ticket(
    payload: TicketCreate,
    session: AsyncSession = Depends(get_session),
    _user: UserContext = Depends(require_support_manager),
):
    return await ticket_service.create_ticket(payload, session)

@router.get("/{ticket_id}", response_model=TicketRead, summary="Get ticket by ID")
async def get_ticket(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_session),
    _user: UserContext = Depends(require_auth),
):
    return await ticket_service.get_ticket_or_404(ticket_id, session)

@router.patch("/{ticket_id}", response_model=TicketRead, summary="Partially update a ticket")
async def update_ticket(
    ticket_id: UUID,
    payload: TicketUpdate,
    session: AsyncSession = Depends(get_session),
    _user: UserContext = Depends(require_support_manager),
):
    return await ticket_service.update_ticket(ticket_id, payload, session)

@router.post(
    "/{ticket_id}/analyze",
    response_model=AnalysisResult,
    summary="Trigger GenAI analysis on a ticket",
    description=(
        "Sends the ticket content to the configured LLM provider and returns a "
        "structured analysis suggestion. **This does NOT persist anything.** "
        "The manager must review and call `/accept` to save."
    ),
)
async def analyze_ticket(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_session),
    llm: genai_service.LLMProvider = Depends(get_llm_provider),
    _user: UserContext = Depends(require_support_manager),
):
    ticket = await ticket_service.get_ticket_or_404(ticket_id, session)
    return await llm.analyse(title=ticket.title, body=ticket.body)

@router.post(
    "/{ticket_id}/accept",
    response_model=TicketRead,
    summary="Manager accepts (and optionally overrides) the GenAI analysis",
    description=(
        "Deterministic save step. Accepts the analysis result payload produced "
        "by `/analyze`, allows field-level overrides, and persists to the database."
    ),
)
async def accept_analysis(
    ticket_id: UUID,
    analysis_result: AnalysisResult,
    accept_payload: AnalysisAccept,
    session: AsyncSession = Depends(get_session),
    user: UserContext = Depends(require_support_manager),
):
    return await ticket_service.save_analysis(
        ticket_id=ticket_id,
        analysis_result=analysis_result,
        accept_payload=accept_payload,
        session=session,
        reviewed_by=user.username,
    )
