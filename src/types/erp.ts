export type CustomerType = 'Tengkulak' | 'Distributor' | 'Reseller' | 'Retail' | 'Customer Langsung';
export type EggType = 'RAW' | 'SALTED';
export type BatchStatus = 'Pemeraman' | 'Siap Panen' | 'Siap Dijual' | 'Selesai';

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
  qty: number;
  transferPrice: number;
  population: number;
  productiveCount: number;
  culledCount: number;
  mortality: number;
  feedQty: number;
  feedCost: number;
  notes: string;
}

export interface RawTransaction {
  id: string;
  date: string;
  type: 'PRODUCTION' | 'PURCHASE' | 'TRANSFER_OUT' | 'SALE_OUT';
  qty: number;
  pricePerUnit: number;
  totalCost: number;
  afterQty: number;
  afterAvgCost: number;
  refId: string;
  notes: string;
}

export interface ProductionBatch {
  id: string;
  batchNo: string;
  date: string;
  qtyInput: number;
  status: BatchStatus;
  rawEggCost: number;
  saltCost: number;
  ashCost: number;
  plasticCost: number;
  packagingCost: number;
  laborCost: number;
  otherCost: number;
  totalCost: number;
  costPerUnit: number;
  harvestDate: string;
  notes: string;
}

export interface Sale {
  id: string;
  date: string;
  customerId: string;
  eggType: EggType;
  qty: number;
  pricePerUnit: number;
  discount: number;
  shippingCost: number;
  totalRevenue: number;
  cogs: number;
  grossProfit: number;
  notes: string;
}

export interface OperationalCost {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
}

export interface DashboardSnapshot {
  settings: Settings;
  rawStock: StockState;
  saltedStock: StockState;
  sales: Sale[];
  expenses: OperationalCost[];
  batches: ProductionBatch[];
}
