export interface Settings {
  shopName: string;
  logo: string;
  currency: string;
  defaultTransferPrice: number;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  phone: string;
  notes: string;
}

export type CustomerType = 'Tengkulak' | 'Distributor' | 'Reseller' | 'Retail' | 'Customer Langsung';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  address: string;
  phone: string;
  notes: string;
}

export interface StockState {
  qty: number;
  avgCost: number;
}

export interface FarmProduction {
  id: string;
  date: string;
  qty: number; // eggs produced
  transferPrice: number; // default or custom
  population: number; // total ducks
  productiveCount: number; // productive ducks
  culledCount: number; // culled ducks (afkir)
  mortality: number; // dead ducks
  feedQty: number; // kg of feed consumed
  feedCost: number; // cost of feed (optional for farm HPP calculation)
  notes: string;
}

export type RawTransactionType = 'PRODUCTION' | 'PURCHASE' | 'TRANSFER_OUT' | 'SALE_OUT';

export interface RawEggTransaction {
  id: string;
  date: string;
  type: RawTransactionType;
  qty: number; // positive for IN, negative for OUT
  pricePerUnit: number;
  totalCost: number;
  afterQty: number;
  afterAvgCost: number;
  refId: string; // ID of purchase, production, or batch
  notes: string;
}

export type BatchStatus = 'Pemeraman' | 'Siap Panen' | 'Siap Dijual' | 'Selesai';

export interface ProductionBatch {
  id: string;
  batchNo: string;
  date: string;
  qtyInput: number; // raw eggs used
  status: BatchStatus;
  rawEggCost: number; // based on moving avg of raw eggs at that time
  saltCost: number;
  ashCost: number;
  plasticCost: number;
  packagingCost: number;
  laborCost: number;
  otherCost: number;
  totalCost: number; // sum of rawEggCost + materials + labor + others
  costPerUnit: number; // HPP per salted egg
  harvestDate: string; // calculated: production date + 14 days
  notes: string;
}

export type SaltedTransactionType = 'BATCH_IN' | 'SALE_OUT';

export interface SaltedEggTransaction {
  id: string;
  date: string;
  type: SaltedTransactionType;
  qty: number; // positive for BATCH_IN, negative for SALE_OUT
  pricePerUnit: number;
  totalCost: number;
  afterQty: number;
  afterAvgCost: number;
  refId: string; // BATCH_ID or SALES_ID
  notes: string;
}

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  eggType: 'RAW' | 'SALTED';
  qty: number;
  pricePerUnit: number;
  discount: number;
  shippingCost: number;
  totalRevenue: number; // (qty * pricePerUnit) - discount + shippingCost
  cogs: number; // HPP * qty
  grossProfit: number; // totalRevenue - cogs (or without shipping cost, or matching user's specific formula)
  notes: string;
}

export interface OperationalCost {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
