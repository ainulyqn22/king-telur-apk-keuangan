-- 009_functions_and_triggers.sql
-- Database automation triggers and audit logs for HouseERP PostgreSQL

-- 1. UTILITY: AUTOMATIC UPDATED_AT COLUMN TIMESTAMP REFRESH
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all standard tables
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_stock_states_updated_at BEFORE UPDATE ON public.stock_states FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_farm_production_updated_at BEFORE UPDATE ON public.farm_production FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_raw_transactions_updated_at BEFORE UPDATE ON public.raw_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_production_transactions_updated_at BEFORE UPDATE ON public.production_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_production_batches_updated_at BEFORE UPDATE ON public.production_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_operational_costs_updated_at BEFORE UPDATE ON public.operational_costs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_activity_logs_updated_at BEFORE UPDATE ON public.activity_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 2. UTILITY: IMMUTABLE AUDIT TRAIL LOGGING TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.log_database_audit_action()
RETURNS TRIGGER AS $$
DECLARE
    v_user VARCHAR(100);
    v_rec_id VARCHAR(50);
    v_old JSONB := NULL;
    v_new JSONB := NULL;
BEGIN
    -- Resolve current user context
    IF current_setting('request.jwt.claims', true) IS NOT NULL THEN
        v_user := COALESCE(
            current_setting('request.jwt.claims', true)::json->>'email', 
            current_setting('request.jwt.claims', true)::json->>'sub', 
            'Supabase-Service'
        );
    ELSE
        v_user := COALESCE(current_user::text, 'System-Internal');
    END IF;

    -- Process based on trigger action
    IF (TG_OP = 'DELETE') THEN
        v_rec_id := OLD.id::text;
        v_old := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_rec_id := NEW.id::text;
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        v_rec_id := NEW.id::text;
        v_new := to_jsonb(NEW);
    END IF;

    -- Insert into immutable audit logs table
    INSERT INTO public.audit_logs (
        table_name,
        action_type,
        record_id,
        old_data,
        new_data,
        performed_by
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        v_rec_id,
        v_old,
        v_new,
        v_user
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Apply audit triggers to critical tables
CREATE TRIGGER trg_audit_settings AFTER INSERT OR UPDATE OR DELETE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.log_database_audit_action();
CREATE TRIGGER trg_audit_suppliers AFTER INSERT OR UPDATE OR DELETE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.log_database_audit_action();
CREATE TRIGGER trg_audit_customers AFTER INSERT OR UPDATE OR DELETE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.log_database_audit_action();
CREATE TRIGGER trg_audit_farm_production AFTER INSERT OR UPDATE OR DELETE ON public.farm_production FOR EACH ROW EXECUTE FUNCTION public.log_database_audit_action();
CREATE TRIGGER trg_audit_raw_transactions AFTER INSERT OR UPDATE OR DELETE ON public.raw_transactions FOR EACH ROW EXECUTE FUNCTION public.log_database_audit_action();
CREATE TRIGGER trg_audit_production_transactions AFTER INSERT OR UPDATE OR DELETE ON public.production_transactions FOR EACH ROW EXECUTE FUNCTION public.log_database_audit_action();
CREATE TRIGGER trg_audit_production_batches AFTER INSERT OR UPDATE OR DELETE ON public.production_batches FOR EACH ROW EXECUTE FUNCTION public.log_database_audit_action();
CREATE TRIGGER trg_audit_sales AFTER INSERT OR UPDATE OR DELETE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.log_database_audit_action();
CREATE TRIGGER trg_audit_operational_costs AFTER INSERT OR UPDATE OR DELETE ON public.operational_costs FOR EACH ROW EXECUTE FUNCTION public.log_database_audit_action();
