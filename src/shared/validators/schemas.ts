import { z } from 'zod';

export const SettingsSchema = z.object({
  shopName: z.string().min(1, 'Nama Toko / Peternakan harus diisi'),
  logo: z.string().optional().default(''),
  currency: z.string().default('Rp'),
  defaultTransferPrice: z.number().min(0, 'Harga transfer minimal 0'),
});

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama Supplier harus diisi'),
  address: z.string().min(1, 'Alamat harus diisi'),
  phone: z.string().min(1, 'Nomor Telepon harus diisi'),
  notes: z.string().optional().default(''),
});

export const CustomerTypeSchema = z.enum(['Tengkulak', 'Distributor', 'Reseller', 'Retail', 'Customer Langsung']);

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama Customer harus diisi'),
  type: CustomerTypeSchema,
  address: z.string().min(1, 'Alamat harus diisi'),
  phone: z.string().min(1, 'Nomor Telepon harus diisi'),
  notes: z.string().optional().default(''),
});

export const FarmProductionSchema = z.object({
  id: z.string(),
  date: z.string().min(1, 'Tanggal harus diisi'),
  qty: z.number().positive('Produksi telur minimal 1 butir'),
  transferPrice: z.number().min(0, 'Harga transfer minimal 0'),
  population: z.number().min(1, 'Populasi bebek minimal 1'),
  productiveCount: z.number().min(0, 'Bebek produktif minimal 0'),
  culledCount: z.number().min(0, 'Bebek afkir minimal 0'),
  mortality: z.number().min(0, 'Mortalitas minimal 0'),
  feedQty: z.number().min(0, 'Kuantitas pakan minimal 0'),
  feedCost: z.number().min(0, 'Biaya pakan minimal 0'),
  notes: z.string().optional().default(''),
});

export const ProductionBatchSchema = z.object({
  id: z.string(),
  batchNo: z.string().min(1, 'Nomor Batch harus diisi'),
  date: z.string().min(1, 'Tanggal harus diisi'),
  qtyInput: z.number().min(1, 'Input telur raw minimal 1 butir'),
  status: z.enum(['Pemeraman', 'Siap Panen', 'Siap Dijual', 'Selesai']),
  rawEggCost: z.number().min(0),
  saltCost: z.number().min(0).default(0),
  ashCost: z.number().min(0).default(0),
  plasticCost: z.number().min(0).default(0),
  packagingCost: z.number().min(0).default(0),
  laborCost: z.number().min(0).default(0),
  otherCost: z.number().min(0).default(0),
  totalCost: z.number().min(0),
  costPerUnit: z.number().min(0),
  harvestDate: z.string().min(1),
  notes: z.string().optional().default(''),
});

export const SaleSchema = z.object({
  id: z.string(),
  date: z.string().min(1, 'Tanggal harus diisi'),
  customerId: z.string().min(1, 'Pilih Customer terlebih dahulu'),
  eggType: z.enum(['RAW', 'SALTED']),
  qty: z.number().min(1, 'Kuantitas penjualan minimal 1 butir'),
  pricePerUnit: z.number().min(0, 'Harga satuan minimal 0'),
  discount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  totalRevenue: z.number().min(0),
  cogs: z.number().min(0),
  grossProfit: z.number(),
  notes: z.string().optional().default(''),
});

export const OperationalCostSchema = z.object({
  id: z.string(),
  date: z.string().min(1, 'Tanggal harus diisi'),
  category: z.string().min(1, 'Kategori pengeluaran harus dipilih/diisi'),
  amount: z.number().min(1, 'Nominal pengeluaran minimal 1 rupiah'),
  description: z.string().optional().default(''),
});
