-- 005_sales_tables.sql
-- Sales and Revenue tracking for HouseERP PostgreSQL schema

CREATE TABLE IF NOT EXISTS public.sales (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    customer_id VARCHAR(50) REFERENCES public.customers(id) ON DELETE RESTRICT,
    egg_type VARCHAR(50) NOT NULL CHECK (egg_type IN ('RAW', 'SALTED')),
    qty NUMERIC(15, 2) NOT NULL DEFAULT 0,
    price_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cogs NUMERIC(15, 2) NOT NULL DEFAULT 0,
    gross_profit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted_by VARCHAR(100)
);
