from __future__ import annotations

from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dashboard import (
    ActivityKPIs,
    CustomerHealthResponse,
    CustomerKPIs,
    GlobalDashboardResponse,
    TicketKPIs,
)


async def get_global_kpis(db: AsyncSession) -> GlobalDashboardResponse:
    tickets = await _ticket_kpis(db)
    customers = await _customer_kpis(db)
    activities = await _activity_kpis(db)
    return GlobalDashboardResponse(tickets=tickets, customers=customers, activities=activities)


async def _ticket_kpis(db: AsyncSession) -> TicketKPIs:
    # Open count (not closed)
    row = await db.execute(text("SELECT COUNT(*) AS cnt FROM tickets WHERE status != 'closed'"))
    open_count = row.scalar() or 0

    # Unassigned
    row = await db.execute(
        text("SELECT COUNT(*) AS cnt FROM tickets WHERE status != 'closed' AND assigned_to IS NULL")
    )
    unassigned_count = row.scalar() or 0

    # Avg resolution hours (for closed tickets with both created_at and updated_at)
    row = await db.execute(text("""
        SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) AS avg_hrs
        FROM tickets WHERE status = 'closed'
    """))
    avg_resolution = row.scalar()

    # SLA compliance: % of closed tickets where sla_resolution_met = true
    row = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE sla_resolution_met = true) AS met,
            COUNT(*) FILTER (WHERE sla_resolution_met IS NOT NULL) AS total
        FROM tickets WHERE status = 'closed'
    """))
    sla_row = row.fetchone()
    sla_pct = None
    if sla_row and sla_row[1] > 0:
        sla_pct = round(sla_row[0] / sla_row[1] * 100, 1)

    # By status
    rows = await db.execute(text("SELECT status, COUNT(*) AS cnt FROM tickets GROUP BY status"))
    by_status = {r[0]: r[1] for r in rows.fetchall()}

    # By priority
    rows = await db.execute(text("SELECT priority, COUNT(*) AS cnt FROM tickets GROUP BY priority"))
    by_priority = {r[0]: r[1] for r in rows.fetchall()}

    return TicketKPIs(
        open_count=open_count,
        unassigned_count=unassigned_count,
        avg_resolution_hours=round(avg_resolution, 1) if avg_resolution else None,
        sla_compliance_pct=sla_pct,
        by_status=by_status,
        by_priority=by_priority,
    )


async def _customer_kpis(db: AsyncSession) -> CustomerKPIs:
    row = await db.execute(text("SELECT COUNT(*) FROM customers WHERE is_active = true"))
    total_active = row.scalar() or 0

    rows = await db.execute(
        text("SELECT risk_status, COUNT(*) FROM customers WHERE is_active = true GROUP BY risk_status")
    )
    by_risk = {r[0]: r[1] for r in rows.fetchall()}

    rows = await db.execute(
        text("SELECT cmmc_status, COUNT(*) FROM customers WHERE is_active = true GROUP BY cmmc_status")
    )
    by_cmmc = {r[0]: r[1] for r in rows.fetchall()}

    rows = await db.execute(
        text("SELECT service_tier, COUNT(*) FROM customers WHERE is_active = true GROUP BY service_tier")
    )
    by_tier = {r[0]: r[1] for r in rows.fetchall()}

    today = date.today()
    d30 = today + timedelta(days=30)
    d90 = today + timedelta(days=90)

    row = await db.execute(text(
        "SELECT COUNT(*) FROM customers WHERE is_active = true AND contract_end IS NOT NULL AND contract_end <= :d30 AND contract_end >= :today"
    ), {"d30": d30, "today": today})
    exp_30 = row.scalar() or 0

    row = await db.execute(text(
        "SELECT COUNT(*) FROM customers WHERE is_active = true AND contract_end IS NOT NULL AND contract_end <= :d90 AND contract_end >= :today"
    ), {"d90": d90, "today": today})
    exp_90 = row.scalar() or 0

    return CustomerKPIs(
        total_active=total_active,
        by_risk=by_risk,
        by_cmmc=by_cmmc,
        by_service_tier=by_tier,
        contracts_expiring_30d=exp_30,
        contracts_expiring_90d=exp_90,
    )


async def _activity_kpis(db: AsyncSession) -> ActivityKPIs:
    row = await db.execute(text(
        "SELECT COUNT(*) FROM activities WHERE occurred_at >= now() - INTERVAL '7 days'"
    ))
    vol_7d = row.scalar() or 0

    row = await db.execute(text(
        "SELECT COUNT(*) FROM activities WHERE occurred_at >= now() - INTERVAL '30 days'"
    ))
    vol_30d = row.scalar() or 0

    rows = await db.execute(text("""
        SELECT a.id, a.activity_type, a.title, a.summary, a.occurred_at, a.customer_id, c.name AS customer_name
        FROM activities a
        LEFT JOIN customers c ON a.customer_id = c.id
        ORDER BY a.occurred_at DESC
        LIMIT 10
    """))
    recent = [dict(r._mapping) for r in rows.fetchall()]

    return ActivityKPIs(volume_7d=vol_7d, volume_30d=vol_30d, recent=recent)


async def get_customer_health(db: AsyncSession, customer_id: UUID) -> CustomerHealthResponse:
    cid = str(customer_id)

    # Open tickets
    row = await db.execute(text(
        "SELECT COUNT(*) FROM tickets WHERE customer_id = :cid AND status != 'closed'"
    ), {"cid": cid})
    open_tickets = row.scalar() or 0

    # SLA compliance for this customer (closed tickets)
    row = await db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE sla_resolution_met = true) AS met,
            COUNT(*) FILTER (WHERE sla_resolution_met IS NOT NULL) AS total
        FROM tickets WHERE customer_id = :cid AND status = 'closed'
    """), {"cid": cid})
    sla_row = row.fetchone()
    sla_pct = None
    if sla_row and sla_row[1] > 0:
        sla_pct = round(sla_row[0] / sla_row[1] * 100, 1)

    # AR balance from QBO mock — read from billing service
    ar_balance = 0.0
    try:
        from app.services.billing import get_qbo_mapping
        from app.services.qbo.provider import get_qbo_provider
        mapping = await get_qbo_mapping(db, customer_id)
        if mapping:
            provider = get_qbo_provider()
            balance = await provider.get_balance(mapping["qbo_customer_id"])
            ar_balance = balance or 0.0
    except Exception:
        pass

    # Contract days remaining
    row = await db.execute(text(
        "SELECT contract_end, risk_status FROM customers WHERE id = :cid"
    ), {"cid": cid})
    cust_row = row.fetchone()
    contract_days = None
    risk_status = "green"
    if cust_row:
        risk_status = cust_row[1] or "green"
        if cust_row[0]:
            contract_days = (cust_row[0] - date.today()).days

    # Activity count 30d
    row = await db.execute(text(
        "SELECT COUNT(*) FROM activities WHERE customer_id = :cid AND occurred_at >= now() - INTERVAL '30 days'"
    ), {"cid": cid})
    activity_30d = row.scalar() or 0

    # --- Compute health score (0-100) ---
    score = _compute_health_score(
        risk_status=risk_status,
        sla_pct=sla_pct,
        contract_days=contract_days,
        activity_30d=activity_30d,
        ar_balance=ar_balance,
    )

    return CustomerHealthResponse(
        health_score=score,
        open_tickets=open_tickets,
        sla_compliance_pct=sla_pct,
        ar_balance=ar_balance,
        contract_days_remaining=contract_days,
        activity_count_30d=activity_30d,
    )


def _compute_health_score(
    *,
    risk_status: str,
    sla_pct: float | None,
    contract_days: int | None,
    activity_30d: int,
    ar_balance: float,
) -> int:
    """Weighted composite: risk(30%) + SLA(25%) + contract(20%) + activity(15%) + billing(10%)"""

    # Risk component (0-100)
    risk_map = {"green": 100, "yellow": 50, "red": 10}
    risk_score = risk_map.get(risk_status, 50)

    # SLA component (0-100)
    sla_score = sla_pct if sla_pct is not None else 75  # neutral default

    # Contract proximity (0-100)
    if contract_days is None:
        contract_score = 75  # no contract = neutral
    elif contract_days < 0:
        contract_score = 10  # expired
    elif contract_days <= 30:
        contract_score = 30
    elif contract_days <= 90:
        contract_score = 60
    else:
        contract_score = 100

    # Activity (0-100) — more activity is better up to a point
    if activity_30d >= 10:
        activity_score = 100
    elif activity_30d >= 5:
        activity_score = 75
    elif activity_30d >= 1:
        activity_score = 50
    else:
        activity_score = 20  # no activity is concerning

    # Billing (0-100) — neutral default
    if ar_balance <= 0:
        billing_score = 100
    elif ar_balance < 5000:
        billing_score = 70
    else:
        billing_score = 40

    total = (
        risk_score * 0.30
        + sla_score * 0.25
        + contract_score * 0.20
        + activity_score * 0.15
        + billing_score * 0.10
    )
    return max(0, min(100, round(total)))
