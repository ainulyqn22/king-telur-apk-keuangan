-- 010_row_level_security.sql
-- HouseERP row-level security baseline for Supabase.
--
-- Security model:
--   * anonymous clients have no access to application tables;
--   * authenticated access is authorized from public.profiles;
--   * credential/session tables have RLS enabled and no client policies;
--   * audit rows are written only by SECURITY DEFINER audit triggers.

-- Enable RLS on every table created by migrations 002-007.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Resolve authorization without recursively invoking the profiles SELECT policy.
CREATE OR REPLACE FUNCTION public.check_user_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = auth.uid()
        AND profile.deleted_at IS NULL
        AND profile.role = ANY(allowed_roles)
    );
$$;

REVOKE ALL ON FUNCTION public.check_user_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_user_role(text[]) TO authenticated;

-- Profiles
CREATE POLICY "profiles_select_self_or_admin"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.check_user_role(ARRAY['Owner', 'Admin']));

CREATE POLICY "profiles_update_self"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id AND deleted_at IS NULL)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT profile.role FROM public.profiles AS profile WHERE profile.id = auth.uid())
  AND deleted_at IS NULL
);

CREATE POLICY "profiles_owner_manage"
ON public.profiles FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner']))
WITH CHECK (public.check_user_role(ARRAY['Owner']));

-- Settings and expense categories
CREATE POLICY "settings_select_authenticated"
ON public.settings FOR SELECT TO authenticated
USING (deleted_at IS NULL);

CREATE POLICY "settings_manage_admin"
ON public.settings FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin']));

CREATE POLICY "expense_categories_select_authenticated"
ON public.expense_categories FOR SELECT TO authenticated
USING (deleted_at IS NULL);

CREATE POLICY "expense_categories_manage_finance"
ON public.expense_categories FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin', 'Finance']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin', 'Finance']));

-- Authenticated ERP reads. Soft-deleted records are intentionally hidden.
CREATE POLICY "suppliers_select_authenticated" ON public.suppliers FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "customers_select_authenticated" ON public.customers FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "stock_states_select_authenticated" ON public.stock_states FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "farm_production_select_authenticated" ON public.farm_production FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "raw_transactions_select_authenticated" ON public.raw_transactions FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "production_batches_select_authenticated" ON public.production_batches FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "production_transactions_select_authenticated" ON public.production_transactions FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "sales_select_authenticated" ON public.sales FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "operational_costs_select_authenticated" ON public.operational_costs FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- Role-protected ERP writes. WITH CHECK prevents unauthorized inserted/updated rows.
CREATE POLICY "suppliers_manage_warehouse" ON public.suppliers FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin', 'Warehouse']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin', 'Warehouse']));

CREATE POLICY "customers_manage_sales" ON public.customers FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin', 'Sales']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin', 'Sales']));

CREATE POLICY "stock_states_manage_operations" ON public.stock_states FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin', 'Warehouse', 'Production', 'Sales']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin', 'Warehouse', 'Production', 'Sales']));

CREATE POLICY "farm_production_manage_warehouse" ON public.farm_production FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin', 'Warehouse']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin', 'Warehouse']));

CREATE POLICY "raw_transactions_manage_operations" ON public.raw_transactions FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin', 'Warehouse', 'Production', 'Sales']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin', 'Warehouse', 'Production', 'Sales']));

CREATE POLICY "production_batches_manage_production" ON public.production_batches FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin', 'Production']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin', 'Production']));

CREATE POLICY "production_transactions_manage_operations" ON public.production_transactions FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin', 'Production', 'Sales']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin', 'Production', 'Sales']));

CREATE POLICY "sales_manage_sales" ON public.sales FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin', 'Sales']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin', 'Sales']));

CREATE POLICY "operational_costs_manage_finance" ON public.operational_costs FOR ALL TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin', 'Finance']))
WITH CHECK (public.check_user_role(ARRAY['Owner', 'Admin', 'Finance']));

-- Application activity is readable by authenticated users and insert-only to clients.
CREATE POLICY "activity_logs_select_authenticated"
ON public.activity_logs FOR SELECT TO authenticated
USING (deleted_at IS NULL);

CREATE POLICY "activity_logs_insert_authenticated"
ON public.activity_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND deleted_at IS NULL);

-- Database audit logs are generated by SECURITY DEFINER triggers. No client INSERT,
-- UPDATE, or DELETE policy is deliberately defined.
CREATE POLICY "audit_logs_select_admin"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.check_user_role(ARRAY['Owner', 'Admin']));

-- The custom credential/session tables intentionally have no policies. RLS therefore
-- denies all access through Supabase's anon and authenticated API roles.
