import { describe, expect, it } from 'vitest';
import { ErpService } from './ErpService';
import { BusinessRuleViolation } from '../errors/CustomErrors';
import { MemoryRepository } from '../../test/MemoryRepository';

describe('ErpService inventory integrity', () => {
  it('calculates weighted-average raw stock cost and preserves it on deduction', () => {
    const repo = new MemoryRepository();
    const service = new ErpService(repo);

    service.addRawStock('2026-07-16', 'PURCHASE', 50, 150_000, 'purchase-1', 'Pembelian');

    expect(repo.rawStock.qty).toBe(150);
    expect(repo.rawStock.avgCost).toBeCloseTo(2_333.333333, 5);
    expect(repo.rawTransactions.at(-1)).toMatchObject({ qty: 50, totalCost: 150_000, afterQty: 150 });

    const deductedCost = service.deductRawStock('2026-07-16', 'SALE_OUT', 30, 'sale-1', 'Penjualan');

    expect(deductedCost).toBeCloseTo(70_000, 5);
    expect(repo.rawStock.qty).toBe(120);
    expect(repo.rawStock.avgCost).toBeCloseTo(2_333.333333, 5);
  });

  it('rejects invalid or insufficient deductions without changing stock', () => {
    const repo = new MemoryRepository();
    const service = new ErpService(repo);

    expect(() => service.deductRawStock('2026-07-16', 'SALE_OUT', -10, 'bad', 'Invalid')).toThrow(BusinessRuleViolation);
    expect(() => service.deductRawStock('2026-07-16', 'SALE_OUT', Number.NaN, 'bad', 'Invalid')).toThrow(BusinessRuleViolation);
    expect(() => service.deductRawStock('2026-07-16', 'SALE_OUT', 101, 'bad', 'Insufficient')).toThrow(/tidak mencukupi/);

    expect(repo.rawStock).toEqual({ qty: 100, avgCost: 2_000 });
    expect(repo.rawTransactions).toEqual([]);
  });

  it('does not deduct raw stock when a batch fails validation', () => {
    const repo = new MemoryRepository();
    const service = new ErpService(repo);

    expect(() => service.createBatch({
      date: '2026-07-16',
      qtyInput: 10,
      status: 'Pemeraman',
      saltCost: -1,
      ashCost: 0,
      plasticCost: 0,
      packagingCost: 0,
      laborCost: 0,
      otherCost: 0,
      notes: '',
    })).toThrow();

    expect(repo.rawStock).toEqual({ qty: 100, avgCost: 2_000 });
    expect(repo.rawTransactions).toEqual([]);
    expect(repo.productionBatches).toEqual([]);
  });

  it('does not deduct raw stock when a sale fails validation', () => {
    const repo = new MemoryRepository();
    const service = new ErpService(repo);

    expect(() => service.createSale({
      date: '2026-07-16',
      customerId: '',
      eggType: 'RAW',
      qty: 10,
      pricePerUnit: 2_500,
      discount: 0,
      shippingCost: 0,
      notes: '',
    })).toThrow();

    expect(repo.rawStock).toEqual({ qty: 100, avgCost: 2_000 });
    expect(repo.rawTransactions).toEqual([]);
    expect(repo.sales).toEqual([]);
  });

  it('does not deduct salted stock when sale revenue is invalid', () => {
    const repo = new MemoryRepository();
    const service = new ErpService(repo);

    expect(() => service.createSale({
      date: '2026-07-16',
      customerId: 'cust-1',
      eggType: 'SALTED',
      qty: 10,
      pricePerUnit: 3_500,
      discount: 40_000,
      shippingCost: 0,
      notes: '',
    })).toThrow();

    expect(repo.saltedStock).toEqual({ qty: 50, avgCost: 3_000 });
    expect(repo.saltedTransactions).toEqual([]);
    expect(repo.sales).toEqual([]);
  });

  it('enforces every production-batch transition and adds salted stock once', () => {
    const repo = new MemoryRepository();
    const service = new ErpService(repo);

    service.createBatch({
      date: '2026-07-16',
      qtyInput: 10,
      status: 'Pemeraman',
      saltCost: 1_000,
      ashCost: 0,
      plasticCost: 0,
      packagingCost: 0,
      laborCost: 0,
      otherCost: 0,
      notes: '',
    });

    const batch = repo.productionBatches[0];
    expect(repo.rawStock.qty).toBe(90);
    expect(batch.status).toBe('Pemeraman');
    expect(batch.totalCost).toBe(21_000);
    expect(() => service.updateBatchStatus(batch.id, 'Siap Dijual')).toThrow(BusinessRuleViolation);
    expect(batch.status).toBe('Pemeraman');

    service.updateBatchStatus(batch.id, 'Siap Panen');
    service.updateBatchStatus(batch.id, 'Siap Dijual');

    expect(repo.saltedStock.qty).toBe(60);
    expect(repo.saltedStock.avgCost).toBe(2_850);
    expect(repo.saltedTransactions.filter((tx) => tx.refId === batch.id)).toHaveLength(1);

    service.updateBatchStatus(batch.id, 'Selesai');
    expect(batch.status).toBe('Selesai');
    expect(() => service.updateBatchStatus(batch.id, 'Pemeraman')).toThrow(BusinessRuleViolation);
    expect(() => service.deleteBatch(batch.id)).toThrow(BusinessRuleViolation);
  });

  it('prevents a new batch from bypassing the initial curing state', () => {
    const repo = new MemoryRepository();
    const service = new ErpService(repo);

    expect(() => service.createBatch({
      date: '2026-07-16',
      qtyInput: 10,
      status: 'Siap Dijual',
      saltCost: 0,
      ashCost: 0,
      plasticCost: 0,
      packagingCost: 0,
      laborCost: 0,
      otherCost: 0,
      notes: '',
    })).toThrow(BusinessRuleViolation);

    expect(repo.rawStock.qty).toBe(100);
    expect(repo.saltedStock.qty).toBe(50);
    expect(repo.productionBatches).toEqual([]);
  });

  it('records a raw sale and restores quantity and cost when cancelled', () => {
    const repo = new MemoryRepository();
    const service = new ErpService(repo);

    service.createSale({
      date: '2026-07-16',
      customerId: 'cust-1',
      eggType: 'RAW',
      qty: 10,
      pricePerUnit: 2_500,
      discount: 0,
      shippingCost: 0,
      notes: '',
    });

    const sale = repo.sales[0];
    expect(repo.rawStock).toEqual({ qty: 90, avgCost: 2_000 });
    expect(sale).toMatchObject({ qty: 10, totalRevenue: 25_000, cogs: 20_000, grossProfit: 5_000 });

    service.deleteSale(sale.id);

    expect(repo.rawStock).toEqual({ qty: 100, avgCost: 2_000 });
    expect(repo.sales).toEqual([]);
    expect(repo.rawTransactions.filter((tx) => tx.refId === sale.id)).toEqual([]);
  });

  it('records a salted sale and restores quantity and cost when cancelled', () => {
    const repo = new MemoryRepository();
    const service = new ErpService(repo);

    service.createSale({
      date: '2026-07-16',
      customerId: 'cust-1',
      eggType: 'SALTED',
      qty: 10,
      pricePerUnit: 3_500,
      discount: 0,
      shippingCost: 0,
      notes: '',
    });

    const sale = repo.sales[0];
    expect(repo.saltedStock).toEqual({ qty: 40, avgCost: 3_000 });
    expect(sale).toMatchObject({ qty: 10, totalRevenue: 35_000, cogs: 30_000, grossProfit: 5_000 });

    service.deleteSale(sale.id);

    expect(repo.saltedStock).toEqual({ qty: 50, avgCost: 3_000 });
    expect(repo.sales).toEqual([]);
    expect(repo.saltedTransactions.filter((tx) => tx.refId === sale.id)).toEqual([]);
  });
});
