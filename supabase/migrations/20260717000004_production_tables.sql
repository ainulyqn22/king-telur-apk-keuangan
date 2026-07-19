-- 004_production_tables.sql
-- Production Batches for HouseERP PostgreSQL schema

CREATE TABLE IF NOT EXISTS public.production_batches (
    id VARCHAR(50) PRIMARY KEY,
    batch_no VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    qty_input NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Pemeraman', 'Siap Panen', 'Siap Dijual', 'Selesai')),
    raw_egg_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    salt_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    ash_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    plastic_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    packaging_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    labor_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    other_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cost_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    harvest_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted_by VARCHAR(100)
);
