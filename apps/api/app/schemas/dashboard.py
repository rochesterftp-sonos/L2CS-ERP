from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TicketKPIs(BaseModel):
    open_count: int = 0
    unassigned_count: int = 0
    avg_resolution_hours: float | None = None
    sla_compliance_pct: float | None = None
    by_status: dict[str, int] = {}
    by_priority: dict[str, int] = {}


class CustomerKPIs(BaseModel):
    total_active: int = 0
    by_risk: dict[str, int] = {}
    by_cmmc: dict[str, int] = {}
    by_service_tier: dict[str, int] = {}
    contracts_expiring_30d: int = 0
    contracts_expiring_90d: int = 0


class ActivityKPIs(BaseModel):
    volume_7d: int = 0
    volume_30d: int = 0
    recent: list[dict] = []


class GlobalDashboardResponse(BaseModel):
    tickets: TicketKPIs
    customers: CustomerKPIs
    activities: ActivityKPIs


class CustomerHealthResponse(BaseModel):
    health_score: int
    open_tickets: int = 0
    sla_compliance_pct: float | None = None
    ar_balance: float = 0.0
    contract_days_remaining: int | None = None
    activity_count_30d: int = 0
