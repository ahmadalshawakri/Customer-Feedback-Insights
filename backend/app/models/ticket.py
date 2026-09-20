"""
Defines the canonical data shapes for the Ticket domain:
  - TicketBase       : shared fields
  - Ticket           : the SQLModel ORM table
  - TicketCreate     : inbound write payload
  - TicketRead       : API read response
  - TicketUpdate     : partial update payload (PATCH)
  - TicketStatus     : allowed status transitions
  - AnalysisResult   : structured output from the GenAI service
  - TicketAnalysis   : persisted analysis joined to a ticket
"""

from datetime import datetime, timezone
from enum import StrEnum
from typing import ClassVar, List, Optional
from uuid import UUID, uuid4
from pydantic import ConfigDict
from sqlmodel import Field, Relationship, SQLModel

class TicketStatus(StrEnum):
    OPEN = "open"
    PENDING_ANALYSIS = "pending_analysis"
    ANALYZED = "analyzed"
    RESOLVED = "resolved"
    CLOSED = "closed"

class TicketSentiment(StrEnum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    MIXED = "mixed"

class TicketCategory(StrEnum):
    BILLING = "billing"
    TECHNICAL = "technical"
    SHIPPING = "shipping"
    ACCOUNT = "account"
    GENERAL = "general"
    OTHER = "other"

class TicketBase(SQLModel):
    title: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=10, max_length=5000)
    customer_email: str = Field(max_length=254, index=True)
    status: TicketStatus = Field(default=TicketStatus.OPEN)
    is_complex: bool = Field(default=False)

class Ticket(TicketBase, table=True):
    __tablename__: ClassVar[str] = "tickets"  # pyrefly: ignore[bad-override]

    id: Optional[UUID] = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    created_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    analysis: Optional["TicketAnalysis"] = Relationship(back_populates="ticket")

class TicketCreate(TicketBase):
    pass

class TicketRead(TicketBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    analysis: Optional["AnalysisRead"] = None

class TicketUpdate(SQLModel):
    """Partial update — all fields optional (PATCH semantics)."""
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    body: Optional[str] = Field(default=None, min_length=10, max_length=5000)
    status: Optional[TicketStatus] = None
    is_complex: Optional[bool] = None

class AnalysisBase(SQLModel):
    suggested_category: TicketCategory
    suggested_sentiment: TicketSentiment
    summary: str = Field(max_length=1000)
    confidence_score: float = Field(ge=0.0, le=1.0)
    raw_llm_response: Optional[str] = Field(default=None)

class TicketAnalysis(AnalysisBase, table=True):
    __tablename__: ClassVar[str] = "ticket_analyses"  # pyrefly: ignore[bad-override]

    id: Optional[UUID] = Field(
        default_factory=uuid4, primary_key=True, nullable=False
    )
    ticket_id: UUID = Field(foreign_key="tickets.id", unique=True, index=True)
    created_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    reviewed_by: Optional[str] = Field(default=None, max_length=254)
    is_accepted: bool = Field(default=False)

    ticket: Optional["Ticket"] = Relationship(back_populates="analysis")

class AnalysisRead(AnalysisBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ticket_id: UUID
    created_at: datetime
    reviewed_by: Optional[str]
    is_accepted: bool

class AnalysisAccept(SQLModel):
    """Payload for a manager accepting (or overriding) the AI suggestion."""
    suggested_category: Optional[TicketCategory] = None
    suggested_sentiment: Optional[TicketSentiment] = None
    summary: Optional[str] = Field(default=None, max_length=1000)

class PaginatedTickets(SQLModel):
    items: List[TicketRead]
    total: int
    page: int
    page_size: int
    pages: int
