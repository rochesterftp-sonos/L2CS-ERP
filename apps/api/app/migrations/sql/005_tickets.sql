CREATE TABLE tickets (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    priority TEXT NOT NULL DEFAULT 'medium',
    category TEXT,
    assigned_to UUID REFERENCES users(id),
    sla_first_response_due TIMESTAMPTZ,
    sla_resolution_due TIMESTAMPTZ,
    sla_first_response_met BOOLEAN,
    sla_resolution_met BOOLEAN,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal_note')),
    sender_email TEXT,
    body TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ticket_email_links (
    id UUID PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    mailbox_email TEXT NOT NULL,
    o365_message_id TEXT NOT NULL,
    o365_conversation_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(mailbox_email, o365_message_id)
);

CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
