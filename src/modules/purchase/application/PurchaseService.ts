import { z } from 'zod';
import type { PurchaseRepository } from '../domain/PurchaseRepository';
import type { PurchaseSnapshot, RecordRawEggPurchaseCommand, RecordRawEggPurchaseResult } from '../domain/Purchase';

const commandSchema = z.object({
  date: z.iso.date(),
  supplierId: z.string().min(1),
  qty: z.number().positive(),
  pricePerUnit: z.number().positive(),
  shippingCost: z.number().nonnegative(),
  notes: z.string().max(2_000),
});

export class PurchaseService {
  constructor(private readonly repository: PurchaseRepository) {}

  getSnapshot(): Promise<PurchaseSnapshot> {
    return this.repository.getSnapshot();
  }

  record(command: RecordRawEggPurchaseCommand): Promise<RecordRawEggPurchaseResult> {
    return this.repository.recordRawEggPurchase(commandSchema.parse(command));
  }
}
