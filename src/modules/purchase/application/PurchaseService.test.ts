import { describe, expect, it, vi } from 'vitest';
import type { PurchaseRepository } from '../domain/PurchaseRepository';
import { PurchaseService } from './PurchaseService';

function repository(recordRawEggPurchase: PurchaseRepository['recordRawEggPurchase']): PurchaseRepository {
  return {
    getSnapshot: vi.fn(),
    recordRawEggPurchase,
  };
}

describe('PurchaseService', () => {
  it('passes a valid purchase to the repository', async () => {
    const recordPurchase = vi.fn().mockResolvedValue({
      purchaseId: 'pur-1', transactionId: 'raw-1',
      stock: { qty: 10, avgCost: 2_100 }, totalCost: 21_000,
    });
    const repo = repository(recordPurchase);
    const service = new PurchaseService(repo);
    await service.record({
      date: '2026-07-17', supplierId: 'sup-1', qty: 10,
      pricePerUnit: 2_000, shippingCost: 1_000, notes: 'test',
    });
    expect(recordPurchase).toHaveBeenCalledOnce();
  });

  it('rejects invalid input before opening a database transaction', async () => {
    const recordPurchase = vi.fn();
    const repo = repository(recordPurchase);
    const service = new PurchaseService(repo);
    await expect(service.record({
      date: '2026-07-17', supplierId: 'sup-1', qty: 0,
      pricePerUnit: 2_000, shippingCost: 0, notes: '',
    })).rejects.toThrow();
    expect(recordPurchase).not.toHaveBeenCalled();
  });
});
