from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class CustomerCreate(BaseModel):
    name: str
    primary_domain: str | None = None
    engagement_manager_id: UUID | None = None
    risk_status: str = "green"
    cmmc_status: str = "not_started"
    contract_start: date | None = None
    contract_end: date | None = None
    sharepoint_url: str | None = None
    grc_url: str | None = None
    vault_url: str | None = None
    notes: str | None = None
    # Phase 3 expansion
    industry: str | None = None
    employee_count: int | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    founded_year: int | None = None
    linkedin_url: str | None = None
    short_description: str | None = None
    annual_revenue: float | None = None
    contract_value: float | None = None
    service_tier: str = "bronze"
    engagement_phase: str = "onboarding"
    onboarding_date: date | None = None


class CustomerUpdate(BaseModel):
    name: str | None = None
    primary_domain: str | None = None
    engagement_manager_id: UUID | None = None
    risk_status: str | None = None
    cmmc_status: str | None = None
    contract_start: date | None = None
    contract_end: date | None = None
    sharepoint_url: str | None = None
    grc_url: str | None = None
    vault_url: str | None = None
    notes: str | None = None
    # Phase 3 expansion
    industry: str | None = None
    employee_count: int | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    founded_year: int | None = None
    linkedin_url: str | None = None
    short_description: str | None = None
    annual_revenue: float | None = None
    contract_value: float | None = None
    service_tier: str | None = None
    engagement_phase: str | None = None
    onboarding_date: date | None = None


class CustomerResponse(BaseModel):
    id: UUID
    name: str
    primary_domain: str | None
    engagement_manager_id: UUID | None
    risk_status: str
    cmmc_status: str
    contract_start: date | None
    contract_end: date | None
    sharepoint_url: str | None
    grc_url: str | None
    vault_url: str | None
    notes: str | None
    # Phase 3 expansion
    industry: str | None = None
    employee_count: int | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    founded_year: int | None = None
    linkedin_url: str | None = None
    short_description: str | None = None
    annual_revenue: float | None = None
    contract_value: float | None = None
    service_tier: str = "bronze"
    engagement_phase: str = "onboarding"
    onboarding_date: date | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DomainCreate(BaseModel):
    domain: str
    is_primary: bool = False


class DomainResponse(BaseModel):
    id: UUID
    customer_id: UUID
    domain: str
    is_primary: bool
    created_at: datetime


class MailboxMappingCreate(BaseModel):
    mailbox_email: str
    folder_id: str
    folder_path: str
    include_subfolders: bool = True
    is_primary: bool = False


class MailboxMappingUpdate(BaseModel):
    mailbox_email: str | None = None
    folder_id: str | None = None
    folder_path: str | None = None
    include_subfolders: bool | None = None
    is_primary: bool | None = None


class MailboxMappingResponse(BaseModel):
    id: UUID
    customer_id: UUID
    mailbox_email: str
    folder_id: str
    folder_path: str
    include_subfolders: bool
    is_primary: bool
    created_at: datetime
    updated_at: datetime


# --- Contacts ---

class ContactCreate(BaseModel):
    first_name: str
    last_name: str
    email: str | None = None
    phone: str | None = None
    title: str | None = None
    is_primary: bool = False


class ContactUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    title: str | None = None
    is_primary: bool | None = None


class ContactResponse(BaseModel):
    id: UUID
    customer_id: UUID
    first_name: str
    last_name: str
    email: str | None
    phone: str | None
    title: str | None
    is_primary: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
