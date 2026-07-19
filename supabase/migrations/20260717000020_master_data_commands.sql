-- Master-data commands keep authorization and inserts in one database transaction.
CREATE OR REPLACE FUNCTION public.create_supplier(
    p_name VARCHAR(255), p_address TEXT DEFAULT NULL, p_phone VARCHAR(50) DEFAULT NULL, p_notes TEXT DEFAULT NULL
)
RETURNS SETOF public.suppliers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_supplier public.suppliers%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Authentication is required'; END IF;
    IF NOT public.check_user_role(ARRAY['Owner','Admin','Warehouse']) THEN
        RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Role is not allowed to manage suppliers';
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN RAISE EXCEPTION 'Supplier name is required'; END IF;
    INSERT INTO public.suppliers(id,name,address,phone,notes,created_by,updated_by)
    VALUES ('sup-'||gen_random_uuid()::text,btrim(p_name),p_address,p_phone,p_notes,auth.uid()::text,auth.uid()::text)
    RETURNING * INTO v_supplier;
    RETURN NEXT v_supplier;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_customer(
    p_name VARCHAR(255), p_type VARCHAR(50), p_address TEXT DEFAULT NULL, p_phone VARCHAR(50) DEFAULT NULL, p_notes TEXT DEFAULT NULL
)
RETURNS SETOF public.customers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_customer public.customers%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Authentication is required'; END IF;
    IF NOT public.check_user_role(ARRAY['Owner','Admin','Sales']) THEN
        RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Role is not allowed to manage customers';
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN RAISE EXCEPTION 'Customer name is required'; END IF;
    INSERT INTO public.customers(id,name,type,address,phone,notes,created_by,updated_by)
    VALUES ('cust-'||gen_random_uuid()::text,btrim(p_name),p_type,p_address,p_phone,p_notes,auth.uid()::text,auth.uid()::text)
    RETURNING * INTO v_customer;
    RETURN NEXT v_customer;
END;
$$;

REVOKE ALL ON FUNCTION public.create_supplier(VARCHAR,TEXT,VARCHAR,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_supplier(VARCHAR,TEXT,VARCHAR,TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.create_customer(VARCHAR,VARCHAR,TEXT,VARCHAR,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_customer(VARCHAR,VARCHAR,TEXT,VARCHAR,TEXT) TO authenticated;
