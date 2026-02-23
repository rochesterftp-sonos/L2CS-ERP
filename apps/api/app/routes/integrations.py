from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import TokenData, require_internal_user
from app.services.o365.provider import get_email_provider

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/o365/mailboxes")
async def list_mailboxes(user: Annotated[TokenData, Depends(require_internal_user)]):
    provider = get_email_provider()
    return await provider.list_mailboxes()


@router.get("/o365/folders")
async def list_folders(
    mailbox: str,
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    provider = get_email_provider()
    return await provider.list_folders(mailbox)
