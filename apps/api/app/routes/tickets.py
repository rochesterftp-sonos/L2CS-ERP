from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import TokenData, require_internal_user
from app.core.database import get_db
from app.schemas.tickets import (
    TicketCreate,
    TicketMessageCreate,
    TicketMessageResponse,
    TicketResponse,
    TicketUpdate,
)
from app.services import tickets as svc

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("", response_model=list[TicketResponse])
async def list_tickets_route(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
    status: str | None = None,
    assigned_to: UUID | None = None,
    customer_id: UUID | None = None,
    unassigned: bool = False,
):
    return await svc.list_tickets(db, status=status, assigned_to=assigned_to, customer_id=customer_id, unassigned=unassigned)


@router.post("", response_model=TicketResponse, status_code=201)
async def create_ticket_route(
    body: TicketCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    return await svc.create_ticket(db, body, created_by=UUID(user.user_id))


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket_route(
    ticket_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    ticket = await svc.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket_route(
    ticket_id: UUID,
    body: TicketUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    ticket = await svc.update_ticket(db, ticket_id, body, updated_by=UUID(user.user_id))
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.get("/{ticket_id}/messages", response_model=list[TicketMessageResponse])
async def list_messages_route(
    ticket_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    return await svc.list_ticket_messages(db, ticket_id)


@router.post("/{ticket_id}/messages", response_model=TicketMessageResponse, status_code=201)
async def create_message_route(
    ticket_id: UUID,
    body: TicketMessageCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    if body.direction not in ("outbound", "internal_note"):
        raise HTTPException(status_code=400, detail="Direction must be 'outbound' or 'internal_note'")
    return await svc.create_ticket_message(db, ticket_id, body, created_by=UUID(user.user_id))
