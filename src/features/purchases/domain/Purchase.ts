import type { RawEggTransaction, StockState, Supplier } from '@/shared/types';

export interface RecordRawEggPurchaseCommand {
  date: string;
  supplierId: string;
  qty: number;
  pricePerUnit: number;
  shippingCost: number;
  notes: string;
}

export interface RecordRawEggPurchaseResult {
  purchaseId: string;
  transactionId: string;
  stock: StockState;
  totalCost: number;
}

export interface PurchaseSnapshot {
  suppliers: Supplier[];
  purchases: RawEggTransaction[];
  stock: StockState;
}
