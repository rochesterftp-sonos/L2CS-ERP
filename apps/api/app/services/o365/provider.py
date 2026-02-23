"""
O365 email provider abstraction.
Uses mock data when GRAPH_ENABLED=false (default for local dev).
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
from uuid import uuid4

from app.core.config import settings


class EmailMessage:
    def __init__(self, message_id: str, conversation_id: str, subject: str,
                 from_email: str, received_at: datetime, body_preview: str, has_attachments: bool = False):
        self.message_id = message_id
        self.conversation_id = conversation_id
        self.subject = subject
        self.from_email = from_email
        self.received_at = received_at
        self.body_preview = body_preview
        self.has_attachments = has_attachments

    def to_dict(self) -> dict:
        return {
            "message_id": self.message_id,
            "conversation_id": self.conversation_id,
            "subject": self.subject,
            "from_email": self.from_email,
            "received_at": self.received_at.isoformat(),
            "body_preview": self.body_preview,
            "has_attachments": self.has_attachments,
        }


class EmailProvider(ABC):
    @abstractmethod
    async def list_messages(self, mailbox_email: str, folder_id: str, top: int = 50) -> list[EmailMessage]:
        ...

    @abstractmethod
    async def list_mailboxes(self) -> list[dict]:
        ...

    @abstractmethod
    async def list_folders(self, mailbox_email: str) -> list[dict]:
        ...


class MockEmailProvider(EmailProvider):
    async def list_messages(self, mailbox_email: str, folder_id: str, top: int = 50) -> list[EmailMessage]:
        now = datetime.now(timezone.utc)
        return [
            EmailMessage(
                message_id=f"mock-msg-{i}",
                conversation_id=f"mock-conv-{i // 2}",
                subject=f"Mock email #{i} — RE: Project update",
                from_email=f"contact{i}@example.com",
                received_at=now - timedelta(hours=i * 3),
                body_preview=f"This is a mock email preview for message {i}. It simulates O365 Graph API results.",
                has_attachments=i % 3 == 0,
            )
            for i in range(1, min(top, 10) + 1)
        ]

    async def list_mailboxes(self) -> list[dict]:
        return [
            {"email": "support@level2solutions.io", "display_name": "Support Inbox"},
            {"email": "admin@level2solutions.io", "display_name": "Admin"},
        ]

    async def list_folders(self, mailbox_email: str) -> list[dict]:
        return [
            {"id": "inbox", "display_name": "Inbox", "child_folder_count": 2},
            {"id": "inbox-customers", "display_name": "Inbox/Customers", "child_folder_count": 3},
            {"id": "inbox-customers-acme", "display_name": "Inbox/Customers/ACME Corp", "child_folder_count": 0},
            {"id": "inbox-customers-globex", "display_name": "Inbox/Customers/Globex", "child_folder_count": 0},
            {"id": "inbox-customers-initech", "display_name": "Inbox/Customers/Initech", "child_folder_count": 0},
        ]


class GraphEmailProvider(EmailProvider):
    """Placeholder for real Microsoft Graph integration."""

    async def list_messages(self, mailbox_email: str, folder_id: str, top: int = 50) -> list[EmailMessage]:
        # TODO: Implement real Graph API calls
        raise NotImplementedError("Graph API not yet configured")

    async def list_mailboxes(self) -> list[dict]:
        raise NotImplementedError("Graph API not yet configured")

    async def list_folders(self, mailbox_email: str) -> list[dict]:
        raise NotImplementedError("Graph API not yet configured")


def get_email_provider() -> EmailProvider:
    if settings.graph_enabled:
        return GraphEmailProvider()
    return MockEmailProvider()
