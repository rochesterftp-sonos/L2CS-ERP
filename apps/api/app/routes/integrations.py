from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import TokenData, require_internal_user
from app.core.config import settings
from app.core.database import get_db
from app.services.o365.provider import get_email_provider
from app.services.qbo.provider import get_qbo_provider
from app.services.qbo.oauth import get_authorize_url, exchange_code, revoke_token
from app.services import billing as billing_svc

router = APIRouter(prefix="/integrations", tags=["integrations"])


# --- O365 ---

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


# --- QBO OAuth ---

@router.get("/qbo/connect")
async def qbo_connect(user: Annotated[TokenData, Depends(require_internal_user)]):
    if not settings.qbo_enabled:
        raise HTTPException(status_code=400, detail="QBO integration is not enabled")
    state = str(uuid4())
    url = get_authorize_url(state)
    return RedirectResponse(url=url)


@router.get("/qbo/callback")
async def qbo_callback(
    code: str,
    state: str,
    realmId: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    tokens = await exchange_code(code)
    await billing_svc.save_qbo_connection(
        db,
        realm_id=realmId,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_expires_at=tokens["token_expires_at"],
        company_name=None,
        connected_by=user.user_id,
    )
    return {"status": "connected", "realm_id": realmId}


@router.get("/qbo/status")
async def qbo_status(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    conn = await billing_svc.get_qbo_connection(db)
    if not conn:
        return {"connected": False}
    return {
        "connected": True,
        "company_name": conn["company_name"],
        "realm_id": conn["realm_id"],
        "connected_at": conn["connected_at"],
    }


@router.post("/qbo/disconnect", status_code=204)
async def qbo_disconnect(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    conn = await billing_svc.get_qbo_connection(db)
    if conn:
        try:
            await revoke_token(conn["refresh_token"])
        except Exception:
            pass
        await billing_svc.delete_qbo_connection(db)


# --- QBO Customer Search ---

@router.get("/qbo/customers")
async def search_qbo_customers(
    user: Annotated[TokenData, Depends(require_internal_user)],
    search: str = Query(..., min_length=1),
):
    provider = get_qbo_provider()
    return await provider.search_customers(search)
