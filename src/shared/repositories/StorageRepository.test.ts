import { beforeEach, describe, expect, it } from 'vitest';
import { APPLICATION_STORAGE_KEYS, SecureStorageRepository } from './StorageRepository';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('SecureStorageRepository', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage(),
    });
  });

  it('clears only HouseERP-owned browser storage', () => {
    localStorage.setItem('unrelated-application', 'preserve-me');
    for (const key of APPLICATION_STORAGE_KEYS) {
      localStorage.setItem(key, '{}');
      localStorage.setItem(`${key}_hash`, 'hash');
    }

    new SecureStorageRepository().clearAll();

    expect(localStorage.getItem('unrelated-application')).toBe('preserve-me');
    for (const key of APPLICATION_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
      expect(localStorage.getItem(`${key}_hash`)).toBeNull();
    }
  });
});
