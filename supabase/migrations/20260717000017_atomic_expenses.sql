-- Relational expense commands. Financial records are append-only in the UI.

CREATE OR REPLACE FUNCTION public.record_operational_expense(
    p_date DATE, p_category VARCHAR(100), p_amount NUMERIC, p_description TEXT DEFAULT NULL
)
RETURNS SETOF public.operational_costs
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_user UUID:=auth.uid(); v_expense public.operational_costs%ROWTYPE;
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Authentication is required'; END IF;
    IF p_date IS NULL THEN RAISE EXCEPTION 'Expense date is required'; END IF;
    IF p_amount IS NULL OR p_amount<=0 THEN RAISE EXCEPTION 'Expense amount must be greater than zero'; END IF;
    IF NOT EXISTS(SELECT 1 FROM public.expense_categories WHERE name=p_category AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Expense category does not exist';
    END IF;
    INSERT INTO public.operational_costs(id,date,category,amount,description,created_by,updated_by)
    VALUES('op-'||gen_random_uuid()::text,p_date,p_category,p_amount,p_description,v_user::text,v_user::text)
    RETURNING * INTO v_expense;
    -- The existing audit trigger shares this transaction; audit failure rolls back the expense.
    RETURN NEXT v_expense;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_expense_category(p_name VARCHAR(100))
RETURNS SETOF public.expense_categories
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_category public.expense_categories%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Authentication is required'; END IF;
    IF p_name IS NULL OR length(btrim(p_name))=0 THEN RAISE EXCEPTION 'Category name is required'; END IF;
    INSERT INTO public.expense_categories(name,created_by,updated_by)
    VALUES(btrim(p_name),auth.uid()::text,auth.uid()::text)
    RETURNING * INTO v_category;
    RETURN NEXT v_category;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Expense category already exists';
END;
$$;

CREATE TRIGGER trg_audit_expense_categories AFTER INSERT OR UPDATE OR DELETE ON public.expense_categories
FOR EACH ROW EXECUTE FUNCTION public.log_database_audit_action();

REVOKE ALL ON FUNCTION public.record_operational_expense(DATE,VARCHAR,NUMERIC,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_operational_expense(DATE,VARCHAR,NUMERIC,TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.create_expense_category(VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_expense_category(VARCHAR) TO authenticated;
