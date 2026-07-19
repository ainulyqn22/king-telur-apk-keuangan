-- 012_views.sql
-- Strategic Database Views for Reporting & Dashboard Queries in HouseERP

-- 1. CURRENT STOCK VIEW (Combines stock states and quick indicators)
CREATE OR REPLACE VIEW public.v_current_stock AS
SELECT 
    id AS product_type,
    CASE 
        WHEN id = 'raw' THEN 'Telur Bebek Segar'
        WHEN id = 'salted' THEN 'Telur Asin Mandiri'
        ELSE 'Lain-lain'
    END AS product_name,
    qty AS available_quantity,
    avg_cost AS hpp_per_unit,
    (qty * avg_cost) AS total_asset_value,
    updated_at AS last_updated
FROM public.stock_states
WHERE deleted_at IS NULL;

-- 2. SALES SUMMARY VIEW (Aggregates sales by Customer & Product Type)
CREATE OR REPLACE VIEW public.v_sales_summary AS
SELECT 
    s.id AS sale_id,
    s.date AS transaction_date,
    c.id AS customer_id,
    c.name AS customer_name,
    c.type AS customer_type,
    s.egg_type,
    s.qty,
    s.price_per_unit,
    s.discount,
    s.shipping_cost,
    s.total_revenue,
    s.cogs,
    s.gross_profit,
    s.notes
FROM public.sales s
LEFT JOIN public.customers c ON s.customer_id = c.id
WHERE s.deleted_at IS NULL;

-- 3. PRODUCTION BATCHES MONITORING VIEW
CREATE OR REPLACE VIEW public.v_production_summary AS
SELECT 
    id AS batch_id,
    batch_no,
    date AS started_date,
    qty_input,
    status,
    raw_egg_cost,
    (salt_cost + ash_cost + plastic_cost + packaging_cost + labor_cost + other_cost) AS total_materials_and_labor_cost,
    total_cost,
    cost_per_unit AS hpp_per_salted_egg,
    harvest_date,
    CASE 
        WHEN status = 'Pemeraman' AND harvest_date <= CURRENT_DATE THEN 'Panen Tertunda'
        WHEN status = 'Pemeraman' THEN 'Sedang Diperam'
        ELSE status
    END AS computed_status,
    notes
FROM public.production_batches
WHERE deleted_at IS NULL;
