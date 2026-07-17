import { z } from 'zod';
import type { BatchStatus } from '../../../types';
import type { CreateProductionBatchCommand, ProductionBatchRepository } from '../domain/ProductionBatchRepository';

const schema = z.object({
  date: z.iso.date(), qtyInput: z.number().positive(), saltCost: z.number().nonnegative(),
  ashCost: z.number().nonnegative(), plasticCost: z.number().nonnegative(),
  packagingCost: z.number().nonnegative(), laborCost: z.number().nonnegative(),
  otherCost: z.number().nonnegative(), notes: z.string().max(2_000),
});
export class ProductionBatchService {
  constructor(private readonly repository: ProductionBatchRepository) {}
  getSnapshot() { return this.repository.getSnapshot(); }
  create(command: CreateProductionBatchCommand) { return this.repository.create(schema.parse(command)); }
  transition(id: string, status: BatchStatus) { return this.repository.transition(id, status); }
}
