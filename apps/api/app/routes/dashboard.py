from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import TokenData, require_internal_user
from app.core.database import get_db
from app.schemas.dashboard import GlobalDashboardResponse
from app.services.dashboard import get_global_kpis

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=GlobalDashboardResponse)
async def dashboard_kpis(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    return await get_global_kpis(db)
