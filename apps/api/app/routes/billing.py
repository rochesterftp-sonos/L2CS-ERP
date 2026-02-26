from __future__ import annotations

from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import TokenData, require_internal_user
from app.core.database import get_db
from app.schemas.billing import (
    BillingSummaryResponse,
    InvoiceResponse,
    PaymentResponse,
    QBOMappingCreate,
    QBOMappingResponse,
)
from app.services import billing as svc
from app.services.qbo.provider import get_qbo_provider

router = APIRouter(prefix="/customers", tags=["billing"])


# --- QBO Mapping CRUD ---

@router.get("/{customer_id}/qbo-mapping", response_model=Optional[QBOMappingResponse])
async def get_qbo_mapping_route(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    return await svc.get_qbo_mapping(db, customer_id)


@router.post("/{customer_id}/qbo-mapping", response_model=QBOMappingResponse, status_code=201)
async def create_qbo_mapping_route(
    customer_id: UUID,
    body: QBOMappingCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    existing = await svc.get_qbo_mapping(db, customer_id)
    if existing:
        raise HTTPException(status_code=409, detail="QBO mapping already exists for this customer")
    return await svc.create_qbo_mapping(db, customer_id, body.qbo_customer_id, body.qbo_display_name)


@router.delete("/{customer_id}/qbo-mapping", status_code=204)
async def delete_qbo_mapping_route(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    deleted = await svc.delete_qbo_mapping(db, customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="No QBO mapping found")


# --- Billing Data (read-through from QBO) ---

@router.get("/{customer_id}/billing/summary", response_model=BillingSummaryResponse)
async def get_billing_summary(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    mapping = await svc.get_qbo_mapping(db, customer_id)
    if not mapping:
        return BillingSummaryResponse(
            total_ar_balance=0, overdue_amount=0,
            open_invoices=0, overdue_invoices=0,
            last_payment_date=None, last_payment_amount=None,
        )
    provider = get_qbo_provider()
    return await provider.get_balance(mapping["qbo_customer_id"])


@router.get("/{customer_id}/billing/invoices", response_model=list[InvoiceResponse])
async def list_billing_invoices(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    mapping = await svc.get_qbo_mapping(db, customer_id)
    if not mapping:
        return []
    provider = get_qbo_provider()
    return await provider.list_invoices(mapping["qbo_customer_id"])


@router.get("/{customer_id}/billing/payments", response_model=list[PaymentResponse])
async def list_billing_payments(
    customer_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[TokenData, Depends(require_internal_user)],
):
    mapping = await svc.get_qbo_mapping(db, customer_id)
    if not mapping:
        return []
    provider = get_qbo_provider()
    return await provider.list_payments(mapping["qbo_customer_id"])
