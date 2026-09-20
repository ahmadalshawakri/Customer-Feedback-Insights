"""
api/v1/auth.py — Authentication Endpoints

POST /api/v1/auth/signup - registers a new user
POST /api/v1/auth/login  - returns a JWT for valid credentials
"""

from __future__ import annotations
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, or_
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.user import User, UserCreate, UserLogin
from app.core.database import get_session
from app.services.auth_service import (
    UserContext,
    create_access_token,
    get_password_hash,
    require_support_manager,
    verify_password,
)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user (Support Manager only)",
)
async def signup(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_session),
    _current_user: UserContext = Depends(require_support_manager),
):
    statement = select(User).where(
        or_(
            User.username == user_in.username,
            User.email == user_in.email
        )
    )
    result = await db.exec(statement)
    existing_user = result.first()
    
    if existing_user:
        conflicts = []
        if existing_user.username == user_in.username:
            conflicts.append("Username")
        if existing_user.email == user_in.email:
            conflicts.append("Email")
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{' and '.join(conflicts)} already registered"
        )

    hashed_password = get_password_hash(user_in.password)
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_password,
        role=user_in.role
    )
    
    db.add(new_user)
    await db.commit()
    
    return {"message": "User created successfully"}

@router.post("/login", response_model=LoginResponse, summary="Login and generate JWT token")
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_session)
):
    statement = select(User).where(
        or_(
            User.username == credentials.username,
            User.email == credentials.username
        )
    )
    result = await db.exec(statement)
    user = result.first()

    if user is None or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username, email, or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token = create_access_token(subject=str(user.id), role=user.role)    
    return LoginResponse(access_token=token, token_type="bearer")
