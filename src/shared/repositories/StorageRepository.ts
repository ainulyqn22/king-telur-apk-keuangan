import { 
  Settings, 
  Supplier, 
  Customer, 
  StockState, 
  FarmProduction, 
  RawEggTransaction, 
  ProductionBatch, 
  SaltedEggTransaction, 
  Sale, 
  OperationalCost, 
  ActivityLog 
} from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

export const APPLICATION_STORAGE_KEYS = [
  'settings',
  'categories',
  'suppliers',
  'customers',
  'farm_production',
  'raw_transactions',
  'production_batches',
  'production_transactions',
  'sales',
  'operational_costs',
  'activity_logs',
  'stock_raw',
  'stock_salted',
] as const;

export interface IStorageRepository {
  getSettings(): Settings;
  saveSettings(settings: Settings): void;
  
  getCategories(): string[];
  saveCategories(categories: string[]): void;

  getSuppliers(): Supplier[];
  saveSuppliers(suppliers: Supplier[]): void;

  getCustomers(): Customer[];
  saveCustomers(customers: Customer[]): void;

  getFarmProductions(): FarmProduction[];
  saveFarmProductions(productions: FarmProduction[]): void;

  getRawTransactions(): RawEggTransaction[];
  saveRawTransactions(txs: RawEggTransaction[]): void;

  getProductionBatches(): ProductionBatch[];
  saveProductionBatches(batches: ProductionBatch[]): void;

  getSaltedTransactions(): SaltedEggTransaction[];
  saveSaltedTransactions(txs: SaltedEggTransaction[]): void;

  getSales(): Sale[];
  saveSales(sales: Sale[]): void;

  getOperationalCosts(): OperationalCost[];
  saveOperationalCosts(costs: OperationalCost[]): void;

  getActivityLogs(): ActivityLog[];
  saveActivityLogs(logs: ActivityLog[]): void;

  getRawStock(): StockState;
  saveRawStock(stock: StockState): void;

  getSaltedStock(): StockState;
  saveSaltedStock(stock: StockState): void;
  
  clearAll(): void;
}

export class SecureStorageRepository implements IStorageRepository {
  constructor() {
    void this.pullAllFromSupabase();
  }

  private computeHash(valueStr: string): string {
    let hash = 0;
    const secret = 'HouseERP_Secure_Salt_2026';
    const combined = valueStr + secret;
    for (let i = 0; i < combined.length; i++) {
      const chr = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private async syncToSupabase(key: string, value: any) {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase
        .from('erp_store')
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) {
        console.warn(`Failed to sync key "${key}" to Supabase:`, error.message);
      }
    } catch (err) {
      console.warn(`Failed to sync key "${key}" to Supabase:`, err);
    }
  }

  public async pullAllFromSupabase() {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('erp_store')
        .select('*');
      if (error) {
        console.warn('Failed to pull from Supabase:', error.message);
        return;
      }
      if (data) {
        for (const row of data) {
          const valStr = JSON.stringify(row.value);
          localStorage.setItem(row.key, valStr);
          localStorage.setItem(`${row.key}_hash`, this.computeHash(valStr));
        }
      }
    } catch (err) {
      console.warn('Failed to pull all from Supabase:', err);
    }
  }

  private setSecureJson<T>(key: string, value: T): void {
    const valueStr = JSON.stringify(value);
    localStorage.setItem(key, valueStr);
    localStorage.setItem(`${key}_hash`, this.computeHash(valueStr));
    
    // Background async sync to Supabase PostgreSQL
    void this.syncToSupabase(key, value);
  }

  private getSecureJson<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const storedHash = localStorage.getItem(`${key}_hash`);
    const computedHash = this.computeHash(data);
    
    if (storedHash !== computedHash) {
      console.warn(`SECURITY WARNING: Direct DevTools modification detected for key "${key}"! Restoring from secure cloud state.`);
      return null;
    }
    
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private saveWithSoftDelete<T extends { id: string, deleted_at?: string, deleted_by?: string }>(
    key: string,
    newList: T[]
  ): void {
    const oldList = this.getSecureJson<T[]>(key) || [];
    const newUserIds = new Set(newList.map(item => item.id));
    const deletedItems: T[] = [];
    const userEmail = 'system';
    const nowStr = new Date().toISOString();

    for (const oldItem of oldList) {
      if (!newUserIds.has(oldItem.id)) {
        if (oldItem.deleted_at) {
          deletedItems.push(oldItem);
        } else {
          deletedItems.push({
            ...oldItem,
            deleted_at: nowStr,
            deleted_by: userEmail
          });
        }
      }
    }

    const fullList = [...newList, ...deletedItems];
    this.setSecureJson(key, fullList);
  }

  private getActiveOnly<T>(key: string, fallback: T[] = []): T[] {
    const list = this.getSecureJson<any[]>(key) || fallback;
    return list.filter(item => !item.deleted_at);
  }

  // --- IStorageRepository Implementation ---

  getSettings(): Settings {
    return this.getSecureJson<Settings>('settings') || {
      shopName: 'HouseERP Duck Farm',
      logo: '',
      currency: 'Rp',
      defaultTransferPrice: 2000
    };
  }

  saveSettings(settings: Settings): void {
    this.setSecureJson('settings', settings);
  }

  getCategories(): string[] {
    return this.getSecureJson<string[]>('categories') || [
      'Garam', 'Abu Gosok', 'Plastik', 'Kemasan', 'Gaji Karyawan', 
      'Listrik', 'Air', 'Pakan Bebek', 'Transportasi', 'Vaksin & Obat', 'Lain-lain'
    ];
  }

  saveCategories(categories: string[]): void {
    this.setSecureJson('categories', categories);
  }

  getSuppliers(): Supplier[] {
    return this.getActiveOnly<Supplier>('suppliers');
  }

  saveSuppliers(suppliers: Supplier[]): void {
    this.saveWithSoftDelete('suppliers', suppliers);
  }

  getCustomers(): Customer[] {
    return this.getActiveOnly<Customer>('customers');
  }

  saveCustomers(customers: Customer[]): void {
    this.saveWithSoftDelete('customers', customers);
  }

  getFarmProductions(): FarmProduction[] {
    return this.getActiveOnly<FarmProduction>('farm_production');
  }

  saveFarmProductions(productions: FarmProduction[]): void {
    this.saveWithSoftDelete('farm_production', productions);
  }

  getRawTransactions(): RawEggTransaction[] {
    return this.getActiveOnly<RawEggTransaction>('raw_transactions');
  }

  saveRawTransactions(txs: RawEggTransaction[]): void {
    this.saveWithSoftDelete('raw_transactions', txs);
  }

  getProductionBatches(): ProductionBatch[] {
    return this.getActiveOnly<ProductionBatch>('production_batches');
  }

  saveProductionBatches(batches: ProductionBatch[]): void {
    this.saveWithSoftDelete('production_batches', batches);
  }

  getSaltedTransactions(): SaltedEggTransaction[] {
    return this.getActiveOnly<SaltedEggTransaction>('production_transactions');
  }

  saveSaltedTransactions(txs: SaltedEggTransaction[]): void {
    this.saveWithSoftDelete('production_transactions', txs);
  }

  getSales(): Sale[] {
    return this.getActiveOnly<Sale>('sales');
  }

  saveSales(sales: Sale[]): void {
    this.saveWithSoftDelete('sales', sales);
  }

  getOperationalCosts(): OperationalCost[] {
    return this.getActiveOnly<OperationalCost>('operational_costs');
  }

  saveOperationalCosts(costs: OperationalCost[]): void {
    this.saveWithSoftDelete('operational_costs', costs);
  }

  getActivityLogs(): ActivityLog[] {
    return this.getSecureJson<ActivityLog[]>('activity_logs') || [];
  }

  saveActivityLogs(logs: ActivityLog[]): void {
    this.setSecureJson('activity_logs', logs);
  }

  getRawStock(): StockState {
    return this.getSecureJson<StockState>('stock_raw') || { qty: 0, avgCost: 0 };
  }

  saveRawStock(stock: StockState): void {
    this.setSecureJson('stock_raw', stock);
  }

  getSaltedStock(): StockState {
    return this.getSecureJson<StockState>('stock_salted') || { qty: 0, avgCost: 0 };
  }

  saveSaltedStock(stock: StockState): void {
    this.setSecureJson('stock_salted', stock);
  }

  clearAll(): void {
    for (const key of APPLICATION_STORAGE_KEYS) {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_hash`);
    }
    if (isSupabaseConfigured) {
      void supabase.from('erp_store').delete().in('key', [...APPLICATION_STORAGE_KEYS]).then(({ error }) => {
        if (error) {
          console.warn('Failed to clear HouseERP cloud data:', error.message);
          return;
        }
        console.log('HouseERP cloud data cleared.');
      });
    }
  }
}

export const storageRepo: IStorageRepository = new SecureStorageRepository();
