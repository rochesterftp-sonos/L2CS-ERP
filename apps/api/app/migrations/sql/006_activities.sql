CREATE TABLE activities (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    activity_type TEXT NOT NULL,
    source TEXT,
    reference_table TEXT,
    reference_id UUID,
    title TEXT NOT NULL,
    summary TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_customer ON activities(customer_id);
CREATE INDEX idx_activities_occurred ON activities(occurred_at DESC);
CREATE INDEX idx_activities_reference ON activities(reference_table, reference_id);
