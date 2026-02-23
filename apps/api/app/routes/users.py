from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import TokenData, require_internal_user
from app.core.database import get_db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    result = await db.execute(
        text("SELECT id, email, display_name, role, is_active FROM users WHERE is_active = true ORDER BY display_name")
    )
    return [dict(row._mapping) for row in result.fetchall()]
