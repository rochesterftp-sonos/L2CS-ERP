from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.tickets import SupportEmailIngest
from app.services.ingestion import ingest_support_email

router = APIRouter(prefix="/ingest", tags=["ingestion"])


@router.post("/support-email")
async def ingest_support_email_route(
    body: SupportEmailIngest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await ingest_support_email(db, body)
