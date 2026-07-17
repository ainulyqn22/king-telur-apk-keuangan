-- 008_indexes.sql
-- Performance Tuning Indexes for HouseERP database

-- 1. FOREIGN KEY INDEXES (Crucial for query joins and ON DELETE cascades)
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);

-- 2. TEMPORAL / DATE RANGE INDEXES (Optimizes dashboard stats, ledger history, filters)
CREATE INDEX IF NOT EXISTS idx_farm_production_date ON public.farm_production(date DESC);
CREATE INDEX IF NOT EXISTS idx_raw_transactions_date ON public.raw_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_production_batches_date ON public.production_batches(date DESC);
CREATE INDEX IF NOT EXISTS idx_production_transactions_date ON public.production_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_operational_costs_date ON public.operational_costs(date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- 3. COMPOSITE INDEXES & FILTER PATTERNS
-- Optimizing raw inventory filters (by type and date)
CREATE INDEX IF NOT EXISTS idx_raw_tx_type_date ON public.raw_transactions(type, date DESC);
-- Optimizing salted inventory filters (by type and date)
CREATE INDEX IF NOT EXISTS idx_salted_tx_type_date ON public.production_transactions(type, date DESC);
-- Optimizing production batch status and harvest date check
CREATE INDEX IF NOT EXISTS idx_prod_batches_status_harvest ON public.production_batches(status, harvest_date);
-- Optimizing customer lookup by type
CREATE INDEX IF NOT EXISTS idx_customers_type ON public.customers(type);
-- Operational cost filters by category
CREATE INDEX IF NOT EXISTS idx_operational_costs_category ON public.operational_costs(category);

-- 4. SOFT DELETE FILTER (Partial Indexes to exclude soft-deleted records in common scans)
CREATE INDEX IF NOT EXISTS idx_active_suppliers ON public.suppliers(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_active_customers ON public.customers(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_active_batches ON public.production_batches(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_active_sales ON public.sales(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_active_operational_costs ON public.operational_costs(id) WHERE deleted_at IS NULL;
