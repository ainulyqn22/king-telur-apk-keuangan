import { describe, expect, it, vi } from 'vitest';
import { BackupRecoveryError, BackupValidationError } from '../errors/CustomErrors';
import { MemoryRepository } from '../../test/MemoryRepository';
import { BackupService } from './BackupService';

describe('BackupService', () => {
  it('exports and restores a fully validated backup', () => {
    const source = new MemoryRepository();
    source.settings.shopName = 'Restored Farm';
    source.categories = ['Pakan'];
    source.customers = [{
      id: 'cust-1',
      name: 'Customer',
      type: 'Retail',
      address: 'Jakarta',
      phone: '0800',
      notes: '',
    }];
    const backup = new BackupService(source).create();

    const target = new MemoryRepository();
    target.settings.shopName = 'Original Farm';
    const afterRestore = vi.fn();
    new BackupService(target).restore(backup, afterRestore);

    expect(target.settings.shopName).toBe('Restored Farm');
    expect(target.categories).toEqual(['Pakan']);
    expect(target.customers).toEqual(source.customers);
    expect(afterRestore).toHaveBeenCalledOnce();
  });

  it.each([
    ['malformed JSON', '{not-json'],
    ['unknown backup version', JSON.stringify({ settings: { shopName: 'X', defaultTransferPrice: 0 }, backup_version: '2.0' })],
    ['negative stock', JSON.stringify({ settings: { shopName: 'X', defaultTransferPrice: 0 }, stock_raw: { qty: -1, avgCost: 0 } })],
    ['unexpected fields', JSON.stringify({ settings: { shopName: 'X', defaultTransferPrice: 0 }, injected: true })],
  ])('rejects %s before changing current data', (_caseName, payload) => {
    const repo = new MemoryRepository();
    const service = new BackupService(repo);
    const before = service.create();

    expect(() => service.restore(payload)).toThrow(BackupValidationError);
    expect(service.create()).toBe(before);
  });

  it('rolls back every prior write when restoration fails midway', () => {
    const incomingRepo = new MemoryRepository();
    incomingRepo.settings.shopName = 'Incoming Farm';
    incomingRepo.suppliers = [{ id: 'sup-1', name: 'Supplier', address: '', phone: '', notes: '' }];
    incomingRepo.customers = [{ id: 'cust-1', name: 'Customer', type: 'Retail', address: '', phone: '', notes: '' }];
    const incoming = new BackupService(incomingRepo).create();

    const target = new MemoryRepository();
    target.settings.shopName = 'Original Farm';
    target.categories = ['Original Category'];
    const service = new BackupService(target);
    const before = service.create();

    const saveCustomers = target.saveCustomers;
    let failOnce = true;
    target.saveCustomers = (customers) => {
      if (failOnce) {
        failOnce = false;
        throw new Error('simulated storage failure');
      }
      saveCustomers(customers);
    };

    expect(() => service.restore(incoming)).toThrow(BackupRecoveryError);
    expect(service.create()).toBe(before);
  });
});
