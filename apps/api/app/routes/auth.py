from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import create_access_token, get_current_user, verify_password, TokenData
from app.core.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        text("SELECT id, email, password_hash, display_name, role, is_active FROM users WHERE email = :email"),
        {"email": body.email},
    )
    user = result.mappings().first()

    if not user or not user["is_active"] or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user["id"]), "email": user["email"], "role": user["role"]})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[TokenData, Depends(get_current_user)]):
    return UserResponse(
        id=current_user.user_id,
        email=current_user.email,
        display_name=current_user.email,
        role=current_user.role,
    )
