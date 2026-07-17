import type { PurchaseSnapshot, RecordRawEggPurchaseCommand, RecordRawEggPurchaseResult } from './Purchase';

export interface PurchaseRepository {
  getSnapshot(): Promise<PurchaseSnapshot>;
  recordRawEggPurchase(command: RecordRawEggPurchaseCommand): Promise<RecordRawEggPurchaseResult>;
}
