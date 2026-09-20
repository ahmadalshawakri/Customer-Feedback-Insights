"""
main.py — Application Entry Point

Responsibilities:
  - Application factory with lifespan context (DB init on startup)
  - CORS middleware configuration
  - Request ID injection for tracing
  - /health and /ready endpoints
  - Versioned API router mounting
  - Global exception handlers with structured logging
"""

from __future__ import annotations
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1 import router as v1_router
from app.core.config import get_settings
from app.core.database import init_db
from app.core.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    logger.info(
        "Starting up API",
        env=settings.APP_ENV,
    )
    await init_db()
    yield
    logger.info("Shutting down API")

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Customer Feedback Insights API",
        description=(
            "REST API for the Customer Feedback Insights application. "
            "Supports GenAI-assisted analysis."
        ),
        docs_url="/docs",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(
            "Request processed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            request_id=request_id,
        )
        return response

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(
            "Unhandled exception",
            path=request.url.path,
            error=str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred. Please try again later."},
        )

    @app.get("/health", tags=["observability"], summary="Liveness probe")
    async def health():
        """Returns 200 OK when the process is alive"""
        return {"status": "ok"}

    @app.get("/ready", tags=["observability"], summary="Readiness probe")
    async def ready():
        """Returns 200 OK when the app is ready to serve traffic"""
        return {
            "status": "ready",
            "version": "0.1.0",
            "env": settings.APP_ENV,
        }

    app.include_router(v1_router)

    return app

app = create_app()
