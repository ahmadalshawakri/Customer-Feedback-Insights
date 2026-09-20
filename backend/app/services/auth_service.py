"""
app/services/auth_service.py

Provides a lightweight JWT-based auth layer for demonstration purposes.
"""

from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from app.core.config import get_settings
from app.models.user import UserRole

class UserContext(BaseModel):
    sub: str
    role: UserRole
    exp: Optional[datetime] = None

    @property
    def username(self) -> str:
        return self.sub

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
password_context = PasswordHash((Argon2Hasher(),))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return password_context.hash(password)

def create_access_token(subject: str, role: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> UserContext:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return UserContext(
            sub=payload["sub"],
            role=UserRole(payload["role"]),
            exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc) if "exp" in payload else None,
        )
    except (JWTError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

async def require_auth(token: str = Depends(oauth2_scheme)) -> UserContext:
    user = decode_token(token)
    if user.role not in (UserRole.SUPPORT_AGENT, UserRole.SUPPORT_MANAGER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return user

async def require_support_manager(
    user: UserContext = Depends(require_auth),
) -> UserContext:
    if user.role != UserRole.SUPPORT_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Support manager access required",
        )
    return user
