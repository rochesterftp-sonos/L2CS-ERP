-- Lookup Types
INSERT INTO lookup_types (id, type_key, label, description) VALUES
    ('019478a0-1000-7000-8000-000000000001', 'ticket_status', 'Ticket Status', 'Status values for support tickets'),
    ('019478a0-1000-7000-8000-000000000002', 'ticket_priority', 'Ticket Priority', 'Priority levels for support tickets'),
    ('019478a0-1000-7000-8000-000000000003', 'risk_status', 'Risk Status', 'Customer risk status indicators'),
    ('019478a0-1000-7000-8000-000000000004', 'cmmc_status', 'CMMC Status', 'CMMC certification status'),
    ('019478a0-1000-7000-8000-000000000005', 'sales_stage', 'Sales Stage', 'Sales pipeline stages'),
    ('019478a0-1000-7000-8000-000000000006', 'engagement_phase', 'Engagement Phase', 'Customer engagement phases'),
    ('019478a0-1000-7000-8000-000000000007', 'ticket_category', 'Ticket Category', 'Categories for support tickets');

-- Ticket Status (system-locked)
INSERT INTO lookup_values (id, type_key, value_key, label, sort_order, is_system, is_editable, is_deletable) VALUES
    ('019478a0-2000-7000-8000-000000000001', 'ticket_status', 'new', 'New', 1, true, false, false),
    ('019478a0-2000-7000-8000-000000000002', 'ticket_status', 'in_progress', 'In Progress', 2, true, false, false),
    ('019478a0-2000-7000-8000-000000000003', 'ticket_status', 'waiting_on_client', 'Waiting on Client', 3, true, false, false),
    ('019478a0-2000-7000-8000-000000000004', 'ticket_status', 'escalated', 'Escalated', 4, true, false, false),
    ('019478a0-2000-7000-8000-000000000005', 'ticket_status', 'closed', 'Closed', 5, true, false, false);

-- Ticket Priority (system-locked, with SLA metadata)
INSERT INTO lookup_values (id, type_key, value_key, label, sort_order, is_system, is_editable, is_deletable, metadata) VALUES
    ('019478a0-2000-7000-8000-000000000011', 'ticket_priority', 'low', 'Low', 1, true, false, false, '{"sla_first_response_hours": 24, "sla_resolution_hours": 120}'),
    ('019478a0-2000-7000-8000-000000000012', 'ticket_priority', 'medium', 'Medium', 2, true, false, false, '{"sla_first_response_hours": 8, "sla_resolution_hours": 48}'),
    ('019478a0-2000-7000-8000-000000000013', 'ticket_priority', 'high', 'High', 3, true, false, false, '{"sla_first_response_hours": 4, "sla_resolution_hours": 24}'),
    ('019478a0-2000-7000-8000-000000000014', 'ticket_priority', 'critical', 'Critical', 4, true, false, false, '{"sla_first_response_hours": 1, "sla_resolution_hours": 8}');

-- Risk Status (system-locked)
INSERT INTO lookup_values (id, type_key, value_key, label, sort_order, is_system, is_editable, is_deletable) VALUES
    ('019478a0-2000-7000-8000-000000000021', 'risk_status', 'green', 'Green', 1, true, false, false),
    ('019478a0-2000-7000-8000-000000000022', 'risk_status', 'yellow', 'Yellow', 2, true, false, false),
    ('019478a0-2000-7000-8000-000000000023', 'risk_status', 'red', 'Red', 3, true, false, false);

-- CMMC Status (system-locked)
INSERT INTO lookup_values (id, type_key, value_key, label, sort_order, is_system, is_editable, is_deletable) VALUES
    ('019478a0-2000-7000-8000-000000000031', 'cmmc_status', 'not_started', 'Not Started', 1, true, false, false),
    ('019478a0-2000-7000-8000-000000000032', 'cmmc_status', 'in_progress', 'In Progress', 2, true, false, false),
    ('019478a0-2000-7000-8000-000000000033', 'cmmc_status', 'audit_ready', 'Audit Ready', 3, true, false, false),
    ('019478a0-2000-7000-8000-000000000034', 'cmmc_status', 'certified', 'Certified', 4, true, false, false);

-- Ticket Category (user-editable)
INSERT INTO lookup_values (id, type_key, value_key, label, sort_order, is_system, is_editable, is_deletable) VALUES
    ('019478a0-2000-7000-8000-000000000041', 'ticket_category', 'general', 'General', 1, false, true, true),
    ('019478a0-2000-7000-8000-000000000042', 'ticket_category', 'network', 'Network', 2, false, true, true),
    ('019478a0-2000-7000-8000-000000000043', 'ticket_category', 'security', 'Security', 3, false, true, true),
    ('019478a0-2000-7000-8000-000000000044', 'ticket_category', 'compliance', 'Compliance', 4, false, true, true),
    ('019478a0-2000-7000-8000-000000000045', 'ticket_category', 'cloud', 'Cloud / Infrastructure', 5, false, true, true);

-- System Settings
INSERT INTO system_settings (key, value, description) VALUES
    ('internal_domains', '["level2solutions.io"]', 'Domains considered internal'),
    ('support_inbox', '"support@level2solutions.io"', 'Shared support mailbox'),
    ('default_week_start', '"monday"', 'Default start day of the week'),
    ('activity_cache_minutes', '10', 'Minutes to cache activity timeline');
