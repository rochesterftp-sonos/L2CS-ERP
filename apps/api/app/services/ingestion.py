from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.uuid import new_id
from app.schemas.tickets import SupportEmailIngest
from app.services.activities import create_activity


async def ingest_support_email(db: AsyncSession, data: SupportEmailIngest) -> dict:
    # 1. Dedupe check
    result = await db.execute(
        text("""
            SELECT id FROM ticket_email_links
            WHERE mailbox_email = :mailbox AND o365_message_id = :msg_id
        """),
        {"mailbox": data.mailbox, "msg_id": data.o365_message_id},
    )
    if result.fetchone():
        return {"status": "duplicate", "message": "Email already ingested"}

    # 2. Match sender domain to customer
    sender_domain = data.from_email.split("@")[-1].lower() if "@" in data.from_email else None
    customer_id = None

    if sender_domain:
        result = await db.execute(
            text("SELECT customer_id FROM customer_domains WHERE domain = :domain"),
            {"domain": sender_domain},
        )
        rows = result.fetchall()
        if len(rows) == 1:
            customer_id = rows[0][0]
        # If 0 or >1 matches, customer_id stays None (unassigned queue)

    # 3. Create ticket
    tid = new_id()
    await db.execute(
        text("""
            INSERT INTO tickets (id, customer_id, subject, status, priority)
            VALUES (:id, :customer_id, :subject, 'new', 'medium')
        """),
        {
            "id": str(tid),
            "customer_id": str(customer_id) if customer_id else None,
            "subject": data.subject,
        },
    )

    # 4. Create ticket message (inbound)
    mid = new_id()
    await db.execute(
        text("""
            INSERT INTO ticket_messages (id, ticket_id, direction, sender_email, body)
            VALUES (:id, :ticket_id, 'inbound', :sender_email, :body)
        """),
        {
            "id": str(mid),
            "ticket_id": str(tid),
            "sender_email": data.from_email,
            "body": data.body,
        },
    )

    # 5. Create email link
    lid = new_id()
    await db.execute(
        text("""
            INSERT INTO ticket_email_links (id, ticket_id, mailbox_email, o365_message_id, o365_conversation_id)
            VALUES (:id, :ticket_id, :mailbox, :msg_id, :conv_id)
        """),
        {
            "id": str(lid),
            "ticket_id": str(tid),
            "mailbox": data.mailbox,
            "msg_id": data.o365_message_id,
            "conv_id": data.o365_conversation_id,
        },
    )

    # 6. Activities
    await create_activity(
        db,
        customer_id=customer_id,
        activity_type="ticket_created",
        source="email_ingestion",
        reference_table="tickets",
        reference_id=tid,
        title=f"Ticket created from email: {data.subject}",
    )
    await create_activity(
        db,
        customer_id=customer_id,
        activity_type="email_received",
        source="email_ingestion",
        reference_table="ticket_messages",
        reference_id=mid,
        title=f"Email received from {data.from_email}",
        summary=data.body[:200],
    )

    await db.commit()

    return {
        "status": "created",
        "ticket_id": str(tid),
        "customer_id": str(customer_id) if customer_id else None,
        "customer_matched": customer_id is not None,
    }
