-- Atomic sale, inventory deduction, COGS, journal, and audit transaction.

CREATE OR REPLACE FUNCTION public.record_sale(
    p_date DATE,
    p_customer_id VARCHAR(50),
    p_egg_type VARCHAR(20),
    p_qty NUMERIC,
    p_price_per_unit NUMERIC,
    p_discount NUMERIC DEFAULT 0,
    p_shipping_cost NUMERIC DEFAULT 0,
    p_notes TEXT DEFAULT NULL
)
RETURNS SETOF public.sales
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_stock_id VARCHAR(50);
    v_stock public.stock_states%ROWTYPE;
    v_sale public.sales%ROWTYPE;
    v_revenue NUMERIC;
    v_cogs NUMERIC;
    v_profit NUMERIC;
    v_after_qty NUMERIC;
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Authentication is required'; END IF;
    IF p_date IS NULL THEN RAISE EXCEPTION 'Sale date is required'; END IF;
    IF p_egg_type NOT IN ('RAW','SALTED') THEN RAISE EXCEPTION 'Invalid egg type'; END IF;
    IF p_qty IS NULL OR p_qty <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
    IF p_price_per_unit IS NULL OR p_price_per_unit <= 0 THEN RAISE EXCEPTION 'Price per unit must be greater than zero'; END IF;
    IF COALESCE(p_discount,0) < 0 OR COALESCE(p_shipping_cost,0) < 0 THEN
        RAISE EXCEPTION 'Discount and shipping cost cannot be negative';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id=p_customer_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Customer does not exist';
    END IF;

    v_revenue := (p_qty*p_price_per_unit)-COALESCE(p_discount,0)+COALESCE(p_shipping_cost,0);
    IF v_revenue < 0 THEN RAISE EXCEPTION 'Discount cannot exceed sale value plus shipping'; END IF;
    v_stock_id := CASE p_egg_type WHEN 'RAW' THEN 'raw' ELSE 'salted' END;
    SELECT * INTO STRICT v_stock FROM public.stock_states WHERE id=v_stock_id FOR UPDATE;
    IF v_stock.qty < p_qty THEN
        RAISE EXCEPTION 'Insufficient % inventory. Available: %, requested: %', v_stock_id, v_stock.qty, p_qty;
    END IF;

    v_after_qty := v_stock.qty-p_qty;
    v_cogs := p_qty*v_stock.avg_cost;
    v_profit := v_revenue-v_cogs;
    INSERT INTO public.sales
      (id,date,customer_id,egg_type,qty,price_per_unit,discount,shipping_cost,total_revenue,cogs,gross_profit,notes,created_by,updated_by)
    VALUES
      ('sale-'||gen_random_uuid()::text,p_date,p_customer_id,p_egg_type,p_qty,p_price_per_unit,
       COALESCE(p_discount,0),COALESCE(p_shipping_cost,0),v_revenue,v_cogs,v_profit,p_notes,v_user::text,v_user::text)
    RETURNING * INTO v_sale;

    UPDATE public.stock_states SET qty=v_after_qty,updated_by=v_user::text WHERE id=v_stock_id;
    IF p_egg_type='RAW' THEN
        INSERT INTO public.raw_transactions
          (id,date,type,qty,price_per_unit,total_cost,after_qty,after_avg_cost,ref_id,notes,created_by,updated_by)
        VALUES ('raw-'||gen_random_uuid()::text,p_date,'SALE_OUT',-p_qty,v_stock.avg_cost,v_cogs,
          v_after_qty,v_stock.avg_cost,v_sale.id,'Raw egg sale '||v_sale.id,v_user::text,v_user::text);
    ELSE
        INSERT INTO public.production_transactions
          (id,date,type,qty,price_per_unit,total_cost,after_qty,after_avg_cost,ref_id,notes,created_by,updated_by)
        VALUES ('prod-'||gen_random_uuid()::text,p_date,'SALE_OUT',-p_qty,v_stock.avg_cost,v_cogs,
          v_after_qty,v_stock.avg_cost,v_sale.id,'Salted egg sale '||v_sale.id,v_user::text,v_user::text);
    END IF;
    -- Sale, stock, journal and audit triggers share this transaction. Any error rolls all back.
    RETURN NEXT v_sale;
END;
$$;

REVOKE ALL ON FUNCTION public.record_sale(DATE,VARCHAR,VARCHAR,NUMERIC,NUMERIC,NUMERIC,NUMERIC,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_sale(DATE,VARCHAR,VARCHAR,NUMERIC,NUMERIC,NUMERIC,NUMERIC,TEXT) TO authenticated;
