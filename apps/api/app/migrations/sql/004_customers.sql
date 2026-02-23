CREATE TABLE customers (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    primary_domain TEXT,
    engagement_manager_id UUID REFERENCES users(id),
    risk_status TEXT NOT NULL DEFAULT 'green',
    cmmc_status TEXT NOT NULL DEFAULT 'not_started',
    contract_start DATE,
    contract_end DATE,
    sharepoint_url TEXT,
    grc_url TEXT,
    vault_url TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE customer_domains (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(domain)
);

CREATE TABLE customer_mailbox_mappings (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    mailbox_email TEXT NOT NULL,
    folder_id TEXT NOT NULL,
    folder_path TEXT NOT NULL,
    include_subfolders BOOLEAN NOT NULL DEFAULT true,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
