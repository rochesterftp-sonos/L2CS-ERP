from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import TokenData, require_internal_user
from app.core.database import get_db
from app.schemas.customers import (
    ContactCreate,
    ContactResponse,
    ContactUpdate,
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
    DomainCreate,
    DomainResponse,
    MailboxMappingCreate,
    MailboxMappingResponse,
    MailboxMappingUpdate,
)
from app.schemas.dashboard import CustomerHealthResponse
from app.services import contacts as contacts_svc
from app.services import customers as svc
from app.services.activities import list_activities
from app.services.dashboard import get_customer_health
from app.services.tickets import list_tickets
from app.services.o365.provider import get_email_provider

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[CustomerResponse])
async def list_customers_route(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
    search: str | None = None,
    engagement_manager_id: UUID | None = None,
    risk_status: str | None = None,
    cmmc_status: str | None = None,
):
    return await svc.list_customers(db, search, engagement_manager_id, risk_status, cmmc_status)


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer_route(
    body: CustomerCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    return await svc.create_customer(db, body)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer_route(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    customer = await svc.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer_route(
    customer_id: UUID,
    body: CustomerUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    customer = await svc.update_customer(db, customer_id, body)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


# --- Domains ---

@router.get("/{customer_id}/domains", response_model=list[DomainResponse])
async def list_domains_route(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    return await svc.list_domains(db, customer_id)


@router.post("/{customer_id}/domains", response_model=DomainResponse, status_code=201)
async def add_domain_route(
    customer_id: UUID,
    body: DomainCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    return await svc.add_domain(db, customer_id, body)


@router.delete("/{customer_id}/domains/{domain_id}", status_code=204)
async def delete_domain_route(
    customer_id: UUID,
    domain_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    deleted = await svc.delete_domain(db, customer_id, domain_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Domain not found")


# --- Mailbox Mappings ---

@router.get("/{customer_id}/mailbox-mappings", response_model=list[MailboxMappingResponse])
async def list_mappings_route(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    return await svc.list_mailbox_mappings(db, customer_id)


@router.post("/{customer_id}/mailbox-mappings", response_model=MailboxMappingResponse, status_code=201)
async def create_mapping_route(
    customer_id: UUID,
    body: MailboxMappingCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    return await svc.create_mailbox_mapping(db, customer_id, body)


@router.patch("/{customer_id}/mailbox-mappings/{mapping_id}", response_model=MailboxMappingResponse)
async def update_mapping_route(
    customer_id: UUID,
    mapping_id: UUID,
    body: MailboxMappingUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    mapping = await svc.update_mailbox_mapping(db, customer_id, mapping_id, body)
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    return mapping


@router.delete("/{customer_id}/mailbox-mappings/{mapping_id}", status_code=204)
async def delete_mapping_route(
    customer_id: UUID,
    mapping_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    deleted = await svc.delete_mailbox_mapping(db, customer_id, mapping_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Mapping not found")


# --- Customer 360 endpoints ---

@router.get("/{customer_id}/activities")
async def list_customer_activities(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
    type: str | None = None,
):
    return await list_activities(db, customer_id, activity_type=type)


@router.get("/{customer_id}/tickets")
async def list_customer_tickets(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    return await list_tickets(db, customer_id=customer_id)


@router.get("/{customer_id}/emails")
async def list_customer_emails(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    mappings = await svc.list_mailbox_mappings(db, customer_id)
    provider = get_email_provider()
    all_emails = []
    seen_ids = set()

    for mapping in mappings:
        messages = await provider.list_messages(mapping["mailbox_email"], mapping["folder_id"])
        for msg in messages:
            if msg.message_id not in seen_ids:
                seen_ids.add(msg.message_id)
                all_emails.append(msg.to_dict())

    all_emails.sort(key=lambda e: e["received_at"], reverse=True)
    return all_emails[:50]


# --- Customer Health ---

@router.get("/{customer_id}/health", response_model=CustomerHealthResponse)
async def customer_health_route(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    customer = await svc.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return await get_customer_health(db, customer_id)


# --- Contacts ---

@router.get("/{customer_id}/contacts", response_model=list[ContactResponse])
async def list_contacts_route(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    return await contacts_svc.list_contacts(db, customer_id)


@router.post("/{customer_id}/contacts", response_model=ContactResponse, status_code=201)
async def create_contact_route(
    customer_id: UUID,
    body: ContactCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    customer = await svc.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return await contacts_svc.create_contact(db, customer_id, body)


@router.patch("/{customer_id}/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact_route(
    customer_id: UUID,
    contact_id: UUID,
    body: ContactUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    contact = await contacts_svc.update_contact(db, customer_id, contact_id, body)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.delete("/{customer_id}/contacts/{contact_id}", status_code=204)
async def delete_contact_route(
    customer_id: UUID,
    contact_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    deleted = await contacts_svc.delete_contact(db, customer_id, contact_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Contact not found")
