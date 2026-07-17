import { z } from 'zod';

const IdSchema = z.string().trim().min(1);
const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus berformat YYYY-MM-DD').refine(
  (value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
  'Tanggal tidak valid',
);

const SettingsSchema = z.object({
  shopName: z.string().min(1, { message: 'Nama usaha tidak boleh kosong' }),
  logo: z.string().optional().default(''),
  currency: z.string().optional().default('Rp'),
  defaultTransferPrice: z.number().nonnegative()
}).strict();

const SupplierSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  deleted_at: z.string().optional(),
  deleted_by: z.string().optional()
}).strict();

const CustomerSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  type: z.enum(['Tengkulak', 'Distributor', 'Reseller', 'Retail', 'Customer Langsung']),
  address: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  deleted_at: z.string().optional(),
  deleted_by: z.string().optional()
}).strict();

const StockStateSchema = z.object({
  qty: z.number().nonnegative(),
  avgCost: z.number().nonnegative()
}).strict();

const FarmProductionSchema = z.object({
  id: IdSchema,
  date: IsoDateSchema,
  qty: z.number().positive(),
  transferPrice: z.number().nonnegative(),
  population: z.number().positive(),
  productiveCount: z.number().nonnegative(),
  culledCount: z.number().nonnegative(),
  mortality: z.number().nonnegative(),
  feedQty: z.number().nonnegative(),
  feedCost: z.number().nonnegative().optional().default(0),
  notes: z.string().optional().default(''),
  deleted_at: z.string().optional(),
  deleted_by: z.string().optional()
}).strict();

const RawEggTransactionSchema = z.object({
  id: IdSchema,
  date: IsoDateSchema,
  type: z.enum(['PRODUCTION', 'PURCHASE', 'TRANSFER_OUT', 'SALE_OUT']),
  qty: z.number().refine((value) => value !== 0, 'Kuantitas transaksi tidak boleh 0'),
  pricePerUnit: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  afterQty: z.number().nonnegative(),
  afterAvgCost: z.number().nonnegative(),
  refId: IdSchema,
  notes: z.string().optional().default(''),
  deleted_at: z.string().optional(),
  deleted_by: z.string().optional()
}).strict();

const ProductionBatchSchema = z.object({
  id: IdSchema,
  batchNo: IdSchema,
  date: IsoDateSchema,
  qtyInput: z.number().positive(),
  status: z.enum(['Pemeraman', 'Siap Panen', 'Siap Dijual', 'Selesai']),
  rawEggCost: z.number().nonnegative(),
  saltCost: z.number().nonnegative(),
  ashCost: z.number().nonnegative(),
  plasticCost: z.number().nonnegative(),
  packagingCost: z.number().nonnegative(),
  laborCost: z.number().nonnegative(),
  otherCost: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  costPerUnit: z.number().nonnegative(),
  harvestDate: IsoDateSchema,
  notes: z.string().optional().default(''),
  deleted_at: z.string().optional(),
  deleted_by: z.string().optional()
}).strict();

const SaltedEggTransactionSchema = z.object({
  id: IdSchema,
  date: IsoDateSchema,
  type: z.enum(['BATCH_IN', 'SALE_OUT']),
  qty: z.number().refine((value) => value !== 0, 'Kuantitas transaksi tidak boleh 0'),
  pricePerUnit: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  afterQty: z.number().nonnegative(),
  afterAvgCost: z.number().nonnegative(),
  refId: IdSchema,
  notes: z.string().optional().default(''),
  deleted_at: z.string().optional(),
  deleted_by: z.string().optional()
}).strict();

const SaleSchema = z.object({
  id: IdSchema,
  date: IsoDateSchema,
  customerId: IdSchema,
  eggType: z.enum(['RAW', 'SALTED']),
  qty: z.number().positive(),
  pricePerUnit: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  shippingCost: z.number().nonnegative(),
  totalRevenue: z.number().nonnegative(),
  cogs: z.number().nonnegative(),
  grossProfit: z.number(),
  notes: z.string().optional().default(''),
  deleted_at: z.string().optional(),
  deleted_by: z.string().optional()
}).strict();

const OperationalCostSchema = z.object({
  id: IdSchema,
  date: IsoDateSchema,
  category: z.string().trim().min(1),
  amount: z.number().positive(),
  description: z.string().optional().default(''),
  deleted_at: z.string().optional(),
  deleted_by: z.string().optional()
}).strict();

const ActivityLogSchema = z.object({
  id: IdSchema,
  timestamp: z.string().datetime(),
  user: z.string().min(1),
  action: z.string().min(1),
  details: z.string()
}).strict();

export const BackupSchema = z.object({
  settings: SettingsSchema,
  suppliers: z.array(SupplierSchema).optional().default([]),
  customers: z.array(CustomerSchema).optional().default([]),
  stock_raw: StockStateSchema.optional().default({ qty: 0, avgCost: 0 }),
  stock_salted: StockStateSchema.optional().default({ qty: 0, avgCost: 0 }),
  farm_production: z.array(FarmProductionSchema).optional().default([]),
  raw_transactions: z.array(RawEggTransactionSchema).optional().default([]),
  production_batches: z.array(ProductionBatchSchema).optional().default([]),
  production_transactions: z.array(SaltedEggTransactionSchema).optional().default([]),
  sales: z.array(SaleSchema).optional().default([]),
  operational_costs: z.array(OperationalCostSchema).optional().default([]),
  categories: z.array(z.string().trim().min(1)).optional().default([]),
  activity_logs: z.array(ActivityLogSchema).optional().default([]),
  backup_version: z.literal('1.0').optional().default('1.0')
}).strict(); // strict prevents any unexpected/unwanted fields
