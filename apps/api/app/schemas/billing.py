from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class QBOMappingCreate(BaseModel):
    qbo_customer_id: str
    qbo_display_name: str | None = None


class QBOMappingResponse(BaseModel):
    id: UUID
    customer_id: UUID
    qbo_customer_id: str
    qbo_display_name: str | None
    created_at: datetime
    updated_at: datetime


class InvoiceResponse(BaseModel):
    invoice_id: str
    invoice_number: str
    date: str
    due_date: str
    amount: float
    balance_due: float
    status: str
    line_items: list[dict] = []


class PaymentResponse(BaseModel):
    payment_id: str
    date: str
    amount: float
    method: str | None
    applied_to_invoice: str | None
    memo: str | None


class BillingSummaryResponse(BaseModel):
    total_ar_balance: float
    overdue_amount: float
    open_invoices: int
    overdue_invoices: int
    last_payment_date: str | None
    last_payment_amount: float | None


class QBOConnectionStatus(BaseModel):
    connected: bool
    company_name: str | None = None
    realm_id: str | None = None
    connected_at: datetime | None = None


class QBOCustomerSearchResult(BaseModel):
    id: str
    display_name: str
    company_name: str
    balance: float
