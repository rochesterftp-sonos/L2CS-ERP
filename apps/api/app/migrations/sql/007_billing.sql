-- QBO OAuth connection (single row per company)
CREATE TABLE qbo_connections (
    id UUID PRIMARY KEY,
    realm_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    company_name TEXT,
    connected_by UUID REFERENCES users(id),
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links ERP customer to QBO customer ID (manual mapping)
CREATE TABLE customer_qbo_mappings (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
    qbo_customer_id TEXT NOT NULL,
    qbo_display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qbo_mappings_customer ON customer_qbo_mappings(customer_id);
CREATE INDEX idx_qbo_mappings_qbo_id ON customer_qbo_mappings(qbo_customer_id);
