-- 003_inventory_tables.sql
-- Inventory and Transactions tables for HouseERP PostgreSQL schema

-- 1. STOCK STATES TABLE (Maintains real-time stock and HPP)
CREATE TABLE IF NOT EXISTS public.stock_states (
    id VARCHAR(50) PRIMARY KEY, -- 'raw' or 'salted'
    qty NUMERIC(15, 2) NOT NULL DEFAULT 0,
    avg_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted_by VARCHAR(100)
);

-- 2. FARM PRODUCTION TABLE (Daily harvests from ducks)
CREATE TABLE IF NOT EXISTS public.farm_production (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    qty NUMERIC(15, 2) NOT NULL DEFAULT 0,
    transfer_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    population INTEGER NOT NULL DEFAULT 0,
    productive_count INTEGER NOT NULL DEFAULT 0,
    culled_count INTEGER NOT NULL DEFAULT 0,
    mortality INTEGER NOT NULL DEFAULT 0,
    feed_qty NUMERIC(15, 2) NOT NULL DEFAULT 0,
    feed_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted_by VARCHAR(100)
);

-- 3. RAW EGG TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.raw_transactions (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('PRODUCTION', 'PURCHASE', 'TRANSFER_OUT', 'SALE_OUT')),
    qty NUMERIC(15, 2) NOT NULL, -- positive for IN, negative for OUT
    price_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    after_qty NUMERIC(15, 2) NOT NULL,
    after_avg_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    ref_id VARCHAR(50) NOT NULL, -- references purchase_id, production_id, or batch_id
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted_by VARCHAR(100)
);

-- 4. SALTED EGG TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.production_transactions (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('BATCH_IN', 'SALE_OUT')),
    qty NUMERIC(15, 2) NOT NULL, -- positive for BATCH_IN, negative for SALE_OUT
    price_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    after_qty NUMERIC(15, 2) NOT NULL,
    after_avg_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    ref_id VARCHAR(50) NOT NULL, -- references batch_id or sale_id
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    deleted_by VARCHAR(100)
);
