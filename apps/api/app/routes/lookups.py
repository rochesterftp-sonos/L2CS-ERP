from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import TokenData, require_internal_user
from app.core.database import get_db

router = APIRouter(prefix="/lookups", tags=["lookups"])


@router.get("/{type_key}")
async def get_lookup_values(
    type_key: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    result = await db.execute(
        text("SELECT * FROM lookup_values WHERE type_key = :tk AND is_active = true ORDER BY sort_order"),
        {"tk": type_key},
    )
    return [dict(row._mapping) for row in result.fetchall()]


@router.get("")
async def list_lookup_types(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    result = await db.execute(text("SELECT * FROM lookup_types ORDER BY type_key"))
    return [dict(row._mapping) for row in result.fetchall()]
