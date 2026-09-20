"""
core/database.py

Provides the SQLModel engine, session factory, and the FastAPI dependency
`get_session` for injecting an async DB session into route handlers.
"""

from __future__ import annotations
import os
from collections.abc import AsyncGenerator
from sqlmodel import SQLModel, select, or_
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import StaticPool
from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.user import User, UserRole
from app.services.auth_service import get_password_hash
import app.models

logger = get_logger(__name__)

def _build_engine() -> AsyncEngine:
    settings = get_settings()
    db_url = settings.DATABASE_URL

    # Ensure the data directory exists (SQLite only)
    if db_url.startswith("sqlite"):
        db_path = db_url.split("///")[-1]
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

    connect_args: dict = {}
    pool_kwargs: dict = {}

    if db_url.startswith("sqlite"):
        # Required for SQLite to work across threads/tasks
        connect_args["check_same_thread"] = False
        if ":memory:" in db_url:
            pool_kwargs["poolclass"] = StaticPool

    engine = create_async_engine(
        db_url,
        echo=get_settings().APP_ENV == "development",
        connect_args=connect_args,
        **pool_kwargs,
    )
    return engine

# Module-level singleton engine
engine: AsyncEngine = _build_engine()

async def seed_default_manager() -> None:
    """Seed initial SUPPORT_MANAGER once if no support manager exists."""
    settings = get_settings()
    async with AsyncSession(engine, expire_on_commit=False) as session:
        statement = select(User).where(
            or_(
                User.username == settings.DEFAULT_MANAGER_USERNAME,
                User.email == settings.DEFAULT_MANAGER_EMAIL,
                User.role == UserRole.SUPPORT_MANAGER,
            )
        )
        result = await session.exec(statement)
        existing_manager = result.first()
        if existing_manager:
            logger.info("Support manager already exists, skipping initial seed")
            return

        default_manager = User(
            username=settings.DEFAULT_MANAGER_USERNAME,
            email=settings.DEFAULT_MANAGER_EMAIL,
            password_hash=get_password_hash(settings.DEFAULT_MANAGER_PASSWORD),
            role=UserRole.SUPPORT_MANAGER,
        )
        session.add(default_manager)
        await session.commit()
        logger.info(
            "Default support manager initialized",
            username=settings.DEFAULT_MANAGER_USERNAME,
            email=settings.DEFAULT_MANAGER_EMAIL,
        )

async def init_db() -> None:
    """Create all SQLModel tables that have been imported and seed default manager."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("Database tables initialised")
    await seed_default_manager()

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yield an async SQLModel session per request."""
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session
