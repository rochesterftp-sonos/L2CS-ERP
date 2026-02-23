from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TicketCreate(BaseModel):
    customer_id: UUID | None = None
    subject: str
    priority: str = "medium"
    category: str | None = None
    assigned_to: UUID | None = None


class TicketUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    category: str | None = None
    assigned_to: UUID | None = None


class TicketResponse(BaseModel):
    id: UUID
    customer_id: UUID | None
    subject: str
    status: str
    priority: str
    category: str | None
    assigned_to: UUID | None
    sla_first_response_due: datetime | None
    sla_resolution_due: datetime | None
    sla_first_response_met: bool | None
    sla_resolution_met: bool | None
    created_by: UUID | None
    created_at: datetime
    updated_at: datetime
    customer_name: str | None = None
    assigned_to_name: str | None = None


class TicketMessageCreate(BaseModel):
    direction: str  # 'outbound' or 'internal_note'
    body: str


class TicketMessageResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    direction: str
    sender_email: str | None
    body: str
    created_by: UUID | None
    created_at: datetime
    created_by_name: str | None = None


class SupportEmailIngest(BaseModel):
    mailbox: str
    o365_message_id: str
    o365_conversation_id: str | None = None
    from_email: str
    subject: str
    received_at: datetime
    body: str
