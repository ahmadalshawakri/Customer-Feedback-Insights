"""
api/v1/__init__.py
"""

from fastapi import APIRouter
from app.api.v1 import auth, tickets

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(tickets.router)
