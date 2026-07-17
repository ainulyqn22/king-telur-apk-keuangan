import { describe, expect, it, vi } from 'vitest';
import type { ProductionBatchRepository } from '../domain/ProductionBatchRepository';
import { ProductionBatchService } from './ProductionBatchService';

describe('ProductionBatchService', () => {
  it('validates a batch before calling PostgreSQL', async () => {
    const create = vi.fn();
    const repository: ProductionBatchRepository = { getSnapshot: vi.fn(), create, transition: vi.fn() };
    const service = new ProductionBatchService(repository);
    await expect(service.create({ date:'2026-07-17',qtyInput:0,saltCost:0,ashCost:0,
      plasticCost:0,packagingCost:0,laborCost:0,otherCost:0,notes:'' })).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
});
