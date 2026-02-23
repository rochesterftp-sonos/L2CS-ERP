CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed a default admin user (password: admin123)
INSERT INTO users (id, email, password_hash, display_name, role)
VALUES (
    '019478a0-0000-7000-8000-000000000001',
    'admin@level2solutions.io',
    '$2b$12$Waa1d2d8uXHh8NufMd6hNeh7Ip7qDjcNt7OGpT/p6rclb1ChTkej6',
    'Admin User',
    'admin'
);
