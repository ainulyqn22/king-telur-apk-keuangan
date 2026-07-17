import type { IStorageRepository } from '../shared/repositories/StorageRepository';
import type {
  ActivityLog,
  Customer,
  FarmProduction,
  OperationalCost,
  ProductionBatch,
  RawEggTransaction,
  Sale,
  SaltedEggTransaction,
  Settings,
  StockState,
  Supplier,
} from '../shared/types';

export class MemoryRepository implements IStorageRepository {
  settings: Settings = { shopName: 'Test', logo: '', currency: 'Rp', defaultTransferPrice: 2_000 };
  categories: string[] = [];
  suppliers: Supplier[] = [];
  customers: Customer[] = [];
  farmProductions: FarmProduction[] = [];
  rawTransactions: RawEggTransaction[] = [];
  productionBatches: ProductionBatch[] = [];
  saltedTransactions: SaltedEggTransaction[] = [];
  sales: Sale[] = [];
  operationalCosts: OperationalCost[] = [];
  activityLogs: ActivityLog[] = [];
  rawStock: StockState = { qty: 100, avgCost: 2_000 };
  saltedStock: StockState = { qty: 50, avgCost: 3_000 };

  getSettings = () => this.settings;
  saveSettings = (value: Settings) => { this.settings = value; };
  getCategories = () => this.categories;
  saveCategories = (value: string[]) => { this.categories = value; };
  getSuppliers = () => this.suppliers;
  saveSuppliers = (value: Supplier[]) => { this.suppliers = value; };
  getCustomers = () => this.customers;
  saveCustomers = (value: Customer[]) => { this.customers = value; };
  getFarmProductions = () => this.farmProductions;
  saveFarmProductions = (value: FarmProduction[]) => { this.farmProductions = value; };
  getRawTransactions = () => this.rawTransactions;
  saveRawTransactions = (value: RawEggTransaction[]) => { this.rawTransactions = value; };
  getProductionBatches = () => this.productionBatches;
  saveProductionBatches = (value: ProductionBatch[]) => { this.productionBatches = value; };
  getSaltedTransactions = () => this.saltedTransactions;
  saveSaltedTransactions = (value: SaltedEggTransaction[]) => { this.saltedTransactions = value; };
  getSales = () => this.sales;
  saveSales = (value: Sale[]) => { this.sales = value; };
  getOperationalCosts = () => this.operationalCosts;
  saveOperationalCosts = (value: OperationalCost[]) => { this.operationalCosts = value; };
  getActivityLogs = () => this.activityLogs;
  saveActivityLogs = (value: ActivityLog[]) => { this.activityLogs = value; };
  getRawStock = () => this.rawStock;
  saveRawStock = (value: StockState) => { this.rawStock = value; };
  getSaltedStock = () => this.saltedStock;
  saveSaltedStock = (value: StockState) => { this.saltedStock = value; };
  clearAll = () => {};
}
