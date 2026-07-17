-- Atomic raw-egg purchasing. PostgreSQL is the sole authority for stock and HPP.

CREATE TABLE IF NOT EXISTS public.raw_egg_purchases (
    id VARCHAR(50) PRIMARY KEY,
    date DATE NOT NULL,
    supplier_id VARCHAR(50) NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    qty NUMERIC(15, 2) NOT NULL CHECK (qty > 0),
    price_per_unit NUMERIC(15, 2) NOT NULL CHECK (price_per_unit > 0),
    shipping_cost NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
    total_cost NUMERIC(15, 2) NOT NULL CHECK (total_cost > 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.raw_egg_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY raw_egg_purchases_authenticated_select
ON public.raw_egg_purchases FOR SELECT TO authenticated
USING (true);

CREATE POLICY raw_egg_purchases_authenticated_insert
ON public.raw_egg_purchases FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = created_by
    AND public.check_user_role(ARRAY['Owner', 'Admin', 'Warehouse'])
);

CREATE INDEX IF NOT EXISTS idx_raw_egg_purchases_date
ON public.raw_egg_purchases(date DESC);

CREATE INDEX IF NOT EXISTS idx_raw_egg_purchases_supplier
ON public.raw_egg_purchases(supplier_id);

CREATE OR REPLACE FUNCTION public.record_raw_egg_purchase(
    p_date DATE,
    p_supplier_id VARCHAR(50),
    p_qty NUMERIC,
    p_price_per_unit NUMERIC,
    p_shipping_cost NUMERIC DEFAULT 0,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    purchase_id VARCHAR(50),
    transaction_id VARCHAR(50),
    stock_qty NUMERIC,
    stock_avg_cost NUMERIC,
    total_cost NUMERIC
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_purchase_id VARCHAR(50) := 'pur-' || gen_random_uuid()::text;
    v_transaction_id VARCHAR(50) := 'raw-' || gen_random_uuid()::text;
    v_old_qty NUMERIC;
    v_old_avg_cost NUMERIC;
    v_total_cost NUMERIC;
    v_new_qty NUMERIC;
    v_new_avg_cost NUMERIC;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Authentication is required';
    END IF;
    IF p_date IS NULL THEN RAISE EXCEPTION 'Purchase date is required'; END IF;
    IF p_qty IS NULL OR p_qty <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
    IF p_price_per_unit IS NULL OR p_price_per_unit <= 0 THEN RAISE EXCEPTION 'Price per unit must be greater than zero'; END IF;
    IF COALESCE(p_shipping_cost, 0) < 0 THEN RAISE EXCEPTION 'Shipping cost cannot be negative'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Supplier does not exist';
    END IF;

    INSERT INTO public.stock_states (id, qty, avg_cost, created_by, updated_by)
    VALUES ('raw', 0, 0, v_user_id::text, v_user_id::text)
    ON CONFLICT (id) DO NOTHING;

    SELECT qty, avg_cost INTO STRICT v_old_qty, v_old_avg_cost
    FROM public.stock_states WHERE id = 'raw' FOR UPDATE;

    v_total_cost := (p_qty * p_price_per_unit) + COALESCE(p_shipping_cost, 0);
    v_new_qty := v_old_qty + p_qty;
    v_new_avg_cost := ((v_old_qty * v_old_avg_cost) + v_total_cost) / v_new_qty;

    INSERT INTO public.raw_egg_purchases
        (id, date, supplier_id, qty, price_per_unit, shipping_cost, total_cost, notes, created_by)
    VALUES
        (v_purchase_id, p_date, p_supplier_id, p_qty, p_price_per_unit,
         COALESCE(p_shipping_cost, 0), v_total_cost, p_notes, v_user_id);

    UPDATE public.stock_states
    SET qty = v_new_qty, avg_cost = v_new_avg_cost, updated_by = v_user_id::text
    WHERE id = 'raw';

    INSERT INTO public.raw_transactions
        (id, date, type, qty, price_per_unit, total_cost, after_qty,
         after_avg_cost, ref_id, notes, created_by, updated_by)
    VALUES
        (v_transaction_id, p_date, 'PURCHASE', p_qty, v_total_cost / p_qty,
         v_total_cost, v_new_qty, v_new_avg_cost, v_purchase_id, p_notes,
         v_user_id::text, v_user_id::text);

    -- Existing audit triggers execute inside this transaction. Any exception in any
    -- insert, stock update, or audit write rolls the complete purchase back.
    RETURN QUERY SELECT v_purchase_id, v_transaction_id, v_new_qty, v_new_avg_cost, v_total_cost;
END;
$$;

REVOKE ALL ON FUNCTION public.record_raw_egg_purchase(DATE, VARCHAR, NUMERIC, NUMERIC, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_raw_egg_purchase(DATE, VARCHAR, NUMERIC, NUMERIC, NUMERIC, TEXT) TO authenticated;

CREATE TRIGGER trg_audit_raw_egg_purchases
AFTER INSERT OR UPDATE OR DELETE ON public.raw_egg_purchases
FOR EACH ROW EXECUTE FUNCTION public.log_database_audit_action();
