"""
QBO billing provider abstraction.
Uses mock data when QBO_ENABLED=false (default for local dev).
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import random

from app.core.config import settings


class QBOProvider(ABC):
    @abstractmethod
    async def search_customers(self, query: str) -> list[dict]:
        ...

    @abstractmethod
    async def get_customer(self, qbo_customer_id: str) -> dict:
        ...

    @abstractmethod
    async def list_invoices(self, qbo_customer_id: str) -> list[dict]:
        ...

    @abstractmethod
    async def list_payments(self, qbo_customer_id: str) -> list[dict]:
        ...

    @abstractmethod
    async def get_balance(self, qbo_customer_id: str) -> dict:
        ...


class MockQBOProvider(QBOProvider):
    """Returns realistic mock data for local development."""

    _MOCK_CUSTOMERS = [
        {"id": "QBO-1001", "display_name": "ACME Corporation", "company_name": "ACME Corp", "balance": 12500.00},
        {"id": "QBO-1002", "display_name": "Globex Industries", "company_name": "Globex Industries", "balance": 8750.50},
        {"id": "QBO-1003", "display_name": "Initech LLC", "company_name": "Initech LLC", "balance": 3200.00},
        {"id": "QBO-1004", "display_name": "Umbrella Corp", "company_name": "Umbrella Corporation", "balance": 45000.00},
        {"id": "QBO-1005", "display_name": "Stark Industries", "company_name": "Stark Industries", "balance": 22100.75},
        {"id": "QBO-1006", "display_name": "Wayne Enterprises", "company_name": "Wayne Enterprises", "balance": 18300.00},
        {"id": "QBO-1007", "display_name": "Cyberdyne Systems", "company_name": "Cyberdyne Systems", "balance": 6400.25},
        {"id": "QBO-1008", "display_name": "Soylent Corp", "company_name": "Soylent Corp", "balance": 950.00},
    ]

    async def search_customers(self, query: str) -> list[dict]:
        q = query.lower()
        return [
            c for c in self._MOCK_CUSTOMERS
            if q in c["display_name"].lower() or q in c["company_name"].lower()
        ]

    async def get_customer(self, qbo_customer_id: str) -> dict:
        for c in self._MOCK_CUSTOMERS:
            if c["id"] == qbo_customer_id:
                return c
        return {"id": qbo_customer_id, "display_name": "Unknown", "company_name": "Unknown", "balance": 0}

    async def list_invoices(self, qbo_customer_id: str) -> list[dict]:
        now = datetime.now(timezone.utc)
        invoices = []
        for i in range(1, 8):
            days_ago = i * 15 + random.randint(-5, 5)
            due_days = days_ago - 30
            amount = round(random.uniform(1500, 15000), 2)
            paid = i > 3
            overdue = not paid and due_days < 0
            balance_due = 0.0 if paid else amount

            invoices.append({
                "invoice_id": f"INV-{1000 + i}",
                "invoice_number": f"{1000 + i}",
                "date": (now - timedelta(days=days_ago)).date().isoformat(),
                "due_date": (now - timedelta(days=due_days)).date().isoformat(),
                "amount": amount,
                "balance_due": balance_due,
                "status": "paid" if paid else ("overdue" if overdue else "open"),
                "line_items": [
                    {"description": "Managed Security Services", "amount": round(amount * 0.7, 2)},
                    {"description": "Compliance Consulting", "amount": round(amount * 0.3, 2)},
                ],
            })
        return invoices

    async def list_payments(self, qbo_customer_id: str) -> list[dict]:
        now = datetime.now(timezone.utc)
        payments = []
        for i in range(1, 5):
            days_ago = i * 20 + random.randint(-3, 3)
            amount = round(random.uniform(2000, 12000), 2)
            payments.append({
                "payment_id": f"PMT-{2000 + i}",
                "date": (now - timedelta(days=days_ago)).date().isoformat(),
                "amount": amount,
                "method": random.choice(["ACH", "Check", "Credit Card", "Wire"]),
                "applied_to_invoice": f"INV-{1000 + i + 3}",
                "memo": None,
            })
        return payments

    async def get_balance(self, qbo_customer_id: str) -> dict:
        customer = await self.get_customer(qbo_customer_id)
        invoices = await self.list_invoices(qbo_customer_id)
        payments = await self.list_payments(qbo_customer_id)

        total_ar = sum(inv["balance_due"] for inv in invoices)
        overdue = sum(inv["balance_due"] for inv in invoices if inv["status"] == "overdue")
        last_payment = payments[0] if payments else None

        return {
            "total_ar_balance": round(total_ar, 2),
            "overdue_amount": round(overdue, 2),
            "open_invoices": sum(1 for inv in invoices if inv["status"] != "paid"),
            "overdue_invoices": sum(1 for inv in invoices if inv["status"] == "overdue"),
            "last_payment_date": last_payment["date"] if last_payment else None,
            "last_payment_amount": last_payment["amount"] if last_payment else None,
        }


class LiveQBOProvider(QBOProvider):
    """Placeholder for real QuickBooks Online API integration."""

    def __init__(self, access_token: str, realm_id: str):
        self.access_token = access_token
        self.realm_id = realm_id
        self.base_url = (
            "https://sandbox-quickbooks.api.intuit.com"
            if settings.qbo_environment == "sandbox"
            else "https://quickbooks.api.intuit.com"
        )

    async def search_customers(self, query: str) -> list[dict]:
        # TODO: Implement real QBO API calls using httpx
        raise NotImplementedError("QBO API not yet configured")

    async def get_customer(self, qbo_customer_id: str) -> dict:
        raise NotImplementedError("QBO API not yet configured")

    async def list_invoices(self, qbo_customer_id: str) -> list[dict]:
        raise NotImplementedError("QBO API not yet configured")

    async def list_payments(self, qbo_customer_id: str) -> list[dict]:
        raise NotImplementedError("QBO API not yet configured")

    async def get_balance(self, qbo_customer_id: str) -> dict:
        raise NotImplementedError("QBO API not yet configured")


def get_qbo_provider() -> QBOProvider:
    if settings.qbo_enabled:
        # In production, tokens would be loaded from qbo_connections table
        # For now, return mock to avoid breaking during development
        return MockQBOProvider()
    return MockQBOProvider()
