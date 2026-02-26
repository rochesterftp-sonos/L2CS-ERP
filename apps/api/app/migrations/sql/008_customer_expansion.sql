-- 008_customer_expansion.sql
-- Phase 3: Expanded company details, contacts table, lookup seeds

-- ============================================================
-- Expand customers table
-- ============================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS employee_count INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC(15,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contract_value NUMERIC(15,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS service_tier TEXT NOT NULL DEFAULT 'bronze';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS engagement_phase TEXT NOT NULL DEFAULT 'onboarding';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS onboarding_date DATE;

-- ============================================================
-- Contacts table
-- ============================================================

CREATE TABLE IF NOT EXISTS contacts (
    id              UUID PRIMARY KEY,
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    title           TEXT,
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_customer ON contacts(customer_id);

-- ============================================================
-- Lookup seeds
-- ============================================================

-- service_tier type
INSERT INTO lookup_types (id, type_key, label, description)
VALUES (gen_random_uuid(), 'service_tier', 'Service Tier', 'Customer service tier level')
ON CONFLICT (type_key) DO NOTHING;

INSERT INTO lookup_values (id, type_key, value_key, label, sort_order, is_system) VALUES
    (gen_random_uuid(), 'service_tier', 'bronze',   'Bronze',   1, true),
    (gen_random_uuid(), 'service_tier', 'silver',   'Silver',   2, true),
    (gen_random_uuid(), 'service_tier', 'gold',     'Gold',     3, true),
    (gen_random_uuid(), 'service_tier', 'platinum', 'Platinum', 4, true)
ON CONFLICT DO NOTHING;

-- engagement_phase values (type already exists from 003)
INSERT INTO lookup_values (id, type_key, value_key, label, sort_order, is_system) VALUES
    (gen_random_uuid(), 'engagement_phase', 'prospect',     'Prospect',     1, true),
    (gen_random_uuid(), 'engagement_phase', 'onboarding',   'Onboarding',   2, true),
    (gen_random_uuid(), 'engagement_phase', 'active',       'Active',       3, true),
    (gen_random_uuid(), 'engagement_phase', 'renewal',      'Renewal',      4, true),
    (gen_random_uuid(), 'engagement_phase', 'offboarding',  'Offboarding',  5, true)
ON CONFLICT DO NOTHING;

-- industry type
INSERT INTO lookup_types (id, type_key, label, description)
VALUES (gen_random_uuid(), 'industry', 'Industry', 'Customer industry vertical')
ON CONFLICT (type_key) DO NOTHING;

INSERT INTO lookup_values (id, type_key, value_key, label, sort_order, is_system) VALUES
    (gen_random_uuid(), 'industry', 'defense',       'Defense',       1, true),
    (gen_random_uuid(), 'industry', 'manufacturing', 'Manufacturing', 2, true),
    (gen_random_uuid(), 'industry', 'healthcare',    'Healthcare',    3, true),
    (gen_random_uuid(), 'industry', 'financial',     'Financial',     4, true),
    (gen_random_uuid(), 'industry', 'technology',    'Technology',    5, true),
    (gen_random_uuid(), 'industry', 'government',    'Government',    6, true),
    (gen_random_uuid(), 'industry', 'education',     'Education',     7, true),
    (gen_random_uuid(), 'industry', 'other',         'Other',         8, true)
ON CONFLICT DO NOTHING;
