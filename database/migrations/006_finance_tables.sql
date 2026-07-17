-- 006_finance_tables.sql
-- Finance and Activity/Audit tracking for HouseERP PostgreSQL schema

-- 1. OPERATIONAL COSTS
CREATE TABLE IF NOT EXISTS public.operational_costs (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL, -- can link to expense_categories or free text
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted_by VARCHAR(100)
);

-- 2. ACTIVITY LOGS (App level activity trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    "user" VARCHAR(100) DEFAULT 'Administrator',
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted_by VARCHAR(100)
);

-- 3. AUDIT LOGS (Immutable DB-level security trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    record_id VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    performed_by VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted_by VARCHAR(100)
);
