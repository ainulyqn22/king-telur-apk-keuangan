-- 011_seed_data.sql
-- Default configuration seed data for HouseERP

-- 1. SEED DEFAULT SETTINGS (If empty)
INSERT INTO public.settings (id, shop_name, logo, currency, default_transfer_price)
VALUES ('00000000-0000-0000-0000-000000000001', 'HouseERP - Telur Asin Mandiri', '', 'Rp', 2000)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED DEFAULT EXPENSE CATEGORIES
INSERT INTO public.expense_categories (name) VALUES
('Pakan Bebek'),
('Gaji Karyawan'),
('Bahan Pengasinan (Garam & Abu)'),
('Kemasan & Plastik'),
('Listrik & Air'),
('Bahan Bakar & Transportasi'),
('Pemeliharaan Kandang'),
('Lain-lain')
ON CONFLICT (name) DO NOTHING;

-- 3. SEED INITIAL STOCK STATES
INSERT INTO public.stock_states (id, qty, avg_cost) VALUES
('raw', 0, 0),
('salted', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED DEFAULT SYSTEM ROLES
INSERT INTO public.roles (id, name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Owner', 'Pemilik usaha dengan akses penuh ke seluruh modul sistem dan keuangan.'),
('22222222-2222-2222-2222-222222222222', 'Admin', 'Administrator sistem pengelola operasional harian.'),
('33333333-3333-3333-3333-333333333333', 'Warehouse', 'Staf Gudang pengelola stok bahan baku telur segar dan logistik pakan.'),
('44444444-4444-4444-4444-444444444444', 'Production', 'Staf Produksi pengelola batch pemeraman telur asin hingga pemanenan.'),
('55555555-5555-5555-5555-555555555555', 'Sales', 'Staf Penjualan pengelola data pelanggan dan transaksi penjualan keluar.'),
('66666666-6666-6666-6666-666666666666', 'Finance', 'Staf Keuangan pengelola biaya operasional dan laporan laba rugi.')
ON CONFLICT (id) DO NOTHING;

-- 5. SEED DEFAULT SYSTEM PERMISSIONS
INSERT INTO public.permissions (id, code, description) VALUES
('00000000-1111-0000-0000-000000000001', 'settings:read', 'Melihat profil usaha dan pengaturan sistem.'),
('00000000-1111-0000-0000-000000000002', 'settings:write', 'Mengubah profil usaha, logo, dan harga transfer default.'),
('00000000-2222-0000-0000-000000000001', 'suppliers:read', 'Melihat daftar supplier bahan baku.'),
('00000000-2222-0000-0000-000000000002', 'suppliers:write', 'Menambah, mengubah, atau menghapus data supplier.'),
('00000000-3333-0000-0000-000000000001', 'customers:read', 'Melihat daftar pelanggan.'),
('00000000-3333-0000-0000-000000000002', 'customers:write', 'Menambah, mengubah, atau menghapus data pelanggan.'),
('00000000-4444-0000-0000-000000000001', 'inventory:read', 'Melihat status stok telur segar dan telur asin.'),
('00000000-4444-0000-0000-000000000002', 'inventory:write', 'Melakukan koreksi stok atau pencatatan transfer logistik.'),
('00000000-5555-0000-0000-000000000001', 'production:read', 'Melihat status batch pemeraman telur asin.'),
('00000000-5555-0000-0000-000000000002', 'production:write', 'Memulai batch baru, mencatat HPP bahan baku, dan panen telur asin.'),
('00000000-6666-0000-0000-000000000001', 'sales:read', 'Melihat log transaksi penjualan telur segar maupun asin.'),
('00000000-6666-0000-0000-000000000002', 'sales:write', 'Mencatatkan transaksi penjualan baru dan kalkulasi COGS.'),
('00000000-7777-0000-0000-000000000001', 'finance:read', 'Melihat pengeluaran operasional dan ringkasan laba rugi.'),
('00000000-7777-0000-0000-000000000002', 'finance:write', 'Mencatatkan pengeluaran biaya operasional harian.')
ON CONFLICT (id) DO NOTHING;

-- 6. MAP ROLE TO PERMISSIONS (RBAC)
-- Owner permissions (All Permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM public.permissions
ON CONFLICT DO NOTHING;

-- Admin permissions (All Permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM public.permissions
ON CONFLICT DO NOTHING;

-- Warehouse permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('33333333-3333-3333-3333-333333333333', '00000000-1111-0000-0000-000000000001'), -- settings:read
('33333333-3333-3333-3333-333333333333', '00000000-2222-0000-0000-000000000001'), -- suppliers:read
('33333333-3333-3333-3333-333333333333', '00000000-2222-0000-0000-000000000002'), -- suppliers:write
('33333333-3333-3333-3333-333333333333', '00000000-4444-0000-0000-000000000001'), -- inventory:read
('33333333-3333-3333-3333-333333333333', '00000000-4444-0000-0000-000000000002')  -- inventory:write
ON CONFLICT DO NOTHING;

-- Production permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('44444444-4444-4444-4444-444444444444', '00000000-1111-0000-0000-000000000001'), -- settings:read
('44444444-4444-4444-4444-444444444444', '00000000-4444-0000-0000-000000000001'), -- inventory:read
('44444444-4444-4444-4444-444444444444', '00000000-5555-0000-0000-000000000001'), -- production:read
('44444444-4444-4444-4444-444444444444', '00000000-5555-0000-0000-000000000002')  -- production:write
ON CONFLICT DO NOTHING;

-- Sales permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('55555555-5555-5555-5555-555555555555', '00000000-1111-0000-0000-000000000001'), -- settings:read
('55555555-5555-5555-5555-555555555555', '00000000-3333-0000-0000-000000000001'), -- customers:read
('55555555-5555-5555-5555-555555555555', '00000000-3333-0000-0000-000000000002'), -- customers:write
('55555555-5555-5555-5555-555555555555', '00000000-4444-0000-0000-000000000001'), -- inventory:read
('55555555-5555-5555-5555-555555555555', '00000000-6666-0000-0000-000000000001'), -- sales:read
('55555555-5555-5555-5555-555555555555', '00000000-6666-0000-0000-000000000002')  -- sales:write
ON CONFLICT DO NOTHING;

-- Finance permissions
INSERT INTO public.role_permissions (role_id, permission_id) VALUES
('66666666-6666-6666-6666-666666666666', '00000000-1111-0000-0000-000000000001'), -- settings:read
('66666666-6666-6666-6666-666666666666', '00000000-4444-0000-0000-000000000001'), -- inventory:read
('66666666-6666-6666-6666-666666666666', '00000000-6666-0000-0000-000000000001'), -- sales:read
('66666666-6666-6666-6666-666666666666', '00000000-7777-0000-0000-000000000001'), -- finance:read
('66666666-6666-6666-6666-666666666666', '00000000-7777-0000-0000-000000000002')  -- finance:write
ON CONFLICT DO NOTHING;
