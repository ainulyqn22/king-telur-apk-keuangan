import type { BatchStatus, ProductionBatch, StockState } from "@/shared/types";

export interface CreateProductionBatchCommand {
  date: string;
  qtyInput: number;
  saltCost: number;
  ashCost: number;
  plasticCost: number;
  packagingCost: number;
  laborCost: number;
  otherCost: number;
  notes: string;
}
export interface ProductionBatchSnapshot {
  batches: ProductionBatch[];
  rawStock: StockState;
}
export interface ProductionBatchRepository {
  getSnapshot(): Promise<ProductionBatchSnapshot>;
  create(command: CreateProductionBatchCommand): Promise<ProductionBatch>;
  transition(id: string, status: BatchStatus): Promise<ProductionBatch>;
}
