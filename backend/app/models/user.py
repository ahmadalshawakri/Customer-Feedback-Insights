"""
Defines the canonical data shapes for the User domain:
  - UserBase       : shared fields
  - User           : the SQLModel ORM table
  - UserCreate     : inbound write payload
  - UserLogin      : payload for user login
  - UserRole       : allowed roles
"""

from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr
from typing import ClassVar, Optional
from sqlmodel import Field, SQLModel
from enum import StrEnum
from uuid import UUID, uuid4

class UserRole(StrEnum):
    SUPPORT_MANAGER = "support_manager"
    SUPPORT_AGENT = "support_agent"

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.SUPPORT_AGENT

class UserLogin(BaseModel):
    username: str
    password: str

class UserBase(SQLModel):
    username: str = Field(unique=True, index=True, nullable=False)
    email: str = Field(unique=True, index=True, nullable=False)
    role: UserRole = Field(default=UserRole.SUPPORT_AGENT)

class User(UserBase, table=True):
    __tablename__: ClassVar[str] = "users"  # pyrefly: ignore[bad-override]

    id: Optional[UUID] = Field(
        default_factory=uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    password_hash: str = Field(nullable=False)
    created_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
