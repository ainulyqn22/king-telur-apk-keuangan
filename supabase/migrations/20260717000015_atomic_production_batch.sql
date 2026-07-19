-- Atomic batch creation and lifecycle transitions.

CREATE OR REPLACE FUNCTION public.create_production_batch(
    p_date DATE,
    p_qty_input NUMERIC,
    p_salt_cost NUMERIC DEFAULT 0,
    p_ash_cost NUMERIC DEFAULT 0,
    p_plastic_cost NUMERIC DEFAULT 0,
    p_packaging_cost NUMERIC DEFAULT 0,
    p_labor_cost NUMERIC DEFAULT 0,
    p_other_cost NUMERIC DEFAULT 0,
    p_notes TEXT DEFAULT NULL
)
RETURNS SETOF public.production_batches
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_stock public.stock_states%ROWTYPE;
    v_batch public.production_batches%ROWTYPE;
    v_raw_cost NUMERIC;
    v_total NUMERIC;
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Authentication is required'; END IF;
    IF p_date IS NULL THEN RAISE EXCEPTION 'Batch date is required'; END IF;
    IF p_qty_input IS NULL OR p_qty_input <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
    IF LEAST(COALESCE(p_salt_cost,0), COALESCE(p_ash_cost,0), COALESCE(p_plastic_cost,0),
             COALESCE(p_packaging_cost,0), COALESCE(p_labor_cost,0), COALESCE(p_other_cost,0)) < 0
    THEN RAISE EXCEPTION 'Batch costs cannot be negative'; END IF;

    SELECT * INTO STRICT v_stock FROM public.stock_states WHERE id='raw' FOR UPDATE;
    IF v_stock.qty < p_qty_input THEN
        RAISE EXCEPTION 'Insufficient raw egg stock. Available: %, requested: %', v_stock.qty, p_qty_input;
    END IF;

    v_raw_cost := p_qty_input * v_stock.avg_cost;
    v_total := v_raw_cost + COALESCE(p_salt_cost,0) + COALESCE(p_ash_cost,0)
        + COALESCE(p_plastic_cost,0) + COALESCE(p_packaging_cost,0)
        + COALESCE(p_labor_cost,0) + COALESCE(p_other_cost,0);

    INSERT INTO public.production_batches (
        id,batch_no,date,qty_input,status,raw_egg_cost,salt_cost,ash_cost,plastic_cost,
        packaging_cost,labor_cost,other_cost,total_cost,cost_per_unit,harvest_date,notes,created_by,updated_by
    ) VALUES (
        'batch-'||gen_random_uuid()::text,
        'BATCH-'||to_char(p_date,'YYYYMMDD')||'-'||upper(substr(gen_random_uuid()::text,1,6)),
        p_date,p_qty_input,'Pemeraman',v_raw_cost,COALESCE(p_salt_cost,0),COALESCE(p_ash_cost,0),
        COALESCE(p_plastic_cost,0),COALESCE(p_packaging_cost,0),COALESCE(p_labor_cost,0),
        COALESCE(p_other_cost,0),v_total,v_total/p_qty_input,p_date+14,p_notes,v_user::text,v_user::text
    ) RETURNING * INTO v_batch;

    UPDATE public.stock_states SET qty=qty-p_qty_input, updated_by=v_user::text WHERE id='raw';
    INSERT INTO public.raw_transactions
        (id,date,type,qty,price_per_unit,total_cost,after_qty,after_avg_cost,ref_id,notes,created_by,updated_by)
    VALUES ('raw-'||gen_random_uuid()::text,p_date,'TRANSFER_OUT',-p_qty_input,v_stock.avg_cost,
        v_raw_cost,v_stock.qty-p_qty_input,v_stock.avg_cost,v_batch.id,
        'Raw eggs consumed by '||v_batch.batch_no,v_user::text,v_user::text);

    RETURN NEXT v_batch;
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_production_batch(p_batch_id VARCHAR, p_new_status VARCHAR)
RETURNS SETOF public.production_batches
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_batch public.production_batches%ROWTYPE;
    v_salted public.stock_states%ROWTYPE;
    v_new_qty NUMERIC;
    v_new_avg NUMERIC;
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Authentication is required'; END IF;
    SELECT * INTO STRICT v_batch FROM public.production_batches
      WHERE id=p_batch_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT ((v_batch.status='Pemeraman' AND p_new_status='Siap Panen') OR
            (v_batch.status='Siap Panen' AND p_new_status='Siap Dijual') OR
            (v_batch.status='Siap Dijual' AND p_new_status='Selesai')) THEN
        RAISE EXCEPTION 'Invalid batch transition from % to %', v_batch.status, p_new_status;
    END IF;

    IF p_new_status='Siap Dijual' THEN
        INSERT INTO public.stock_states(id,qty,avg_cost,created_by,updated_by)
        VALUES('salted',0,0,v_user::text,v_user::text) ON CONFLICT(id) DO NOTHING;
        SELECT * INTO STRICT v_salted FROM public.stock_states WHERE id='salted' FOR UPDATE;
        v_new_qty := v_salted.qty + v_batch.qty_input;
        v_new_avg := ((v_salted.qty*v_salted.avg_cost)+v_batch.total_cost)/v_new_qty;
        UPDATE public.stock_states SET qty=v_new_qty,avg_cost=v_new_avg,updated_by=v_user::text WHERE id='salted';
        INSERT INTO public.production_transactions
          (id,date,type,qty,price_per_unit,total_cost,after_qty,after_avg_cost,ref_id,notes,created_by,updated_by)
        VALUES ('prod-'||gen_random_uuid()::text,CURRENT_DATE,'BATCH_IN',v_batch.qty_input,
          v_batch.cost_per_unit,v_batch.total_cost,v_new_qty,v_new_avg,v_batch.id,
          'Harvested '||v_batch.batch_no,v_user::text,v_user::text);
    END IF;

    UPDATE public.production_batches SET status=p_new_status,updated_by=v_user::text
      WHERE id=p_batch_id RETURNING * INTO v_batch;
    RETURN NEXT v_batch;
END;
$$;

REVOKE ALL ON FUNCTION public.create_production_batch(DATE,NUMERIC,NUMERIC,NUMERIC,NUMERIC,NUMERIC,NUMERIC,NUMERIC,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_production_batch(DATE,NUMERIC,NUMERIC,NUMERIC,NUMERIC,NUMERIC,NUMERIC,NUMERIC,TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.transition_production_batch(VARCHAR,VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_production_batch(VARCHAR,VARCHAR) TO authenticated;
