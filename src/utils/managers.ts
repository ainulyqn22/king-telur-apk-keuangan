import { erpService } from '../shared/services/ErpService.ts';
import { storageRepo } from '../shared/repositories/StorageRepository.ts';
import { BackupService } from '../shared/services/BackupService.ts';
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
  ActivityLog,
  CustomerType,
  BatchStatus
} from '../shared/types/index.ts';

// ==========================================
// UTILS
// ==========================================
export const Utils = {
  generateId(): string {
    return crypto.randomUUID();
  },

  formatCurrency(value: number, currency: string = 'Rp'): string {
    return `${currency} ${Math.round(value).toLocaleString('id-ID')}`;
  },

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  },

  getDaysDifference(date1: string | Date, date2: string | Date): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  isDateInPeriod(dateStr: string, period: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom', customRange?: { start: string; end: string }): boolean {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (period === 'today') {
      return date.getTime() === today.getTime();
    }
    if (period === 'yesterday') {
      return date.getTime() === yesterday.getTime();
    }
    if (period === 'week') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      return date.getTime() >= sevenDaysAgo.getTime() && date.getTime() <= today.getTime();
    }
    if (period === 'month') {
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    }
    if (period === 'year') {
      return date.getFullYear() === today.getFullYear();
    }
    if (period === 'custom' && customRange) {
      const start = new Date(customRange.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customRange.end);
      end.setHours(23, 59, 59, 999);
      return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
    }
    return true;
  }
};

// ==========================================
// STORAGE MANAGER ADAPTER
// ==========================================
export const StorageManager = {
  initialize() {
    // In-service initialization check
    const settings = storageRepo.getSettings();
    if (!settings || !settings.shopName) {
      erpService.resetSystem();
    }
  },

  getData<T>(key: string): T | null {
    if (key === 'settings') return storageRepo.getSettings() as any;
    if (key === 'suppliers') return storageRepo.getSuppliers() as any;
    if (key === 'customers') return storageRepo.getCustomers() as any;
    if (key === 'farm_production') return storageRepo.getFarmProductions() as any;
    if (key === 'raw_transactions') return storageRepo.getRawTransactions() as any;
    if (key === 'production_batches') return storageRepo.getProductionBatches() as any;
    if (key === 'production_transactions') return storageRepo.getSaltedTransactions() as any;
    if (key === 'sales') return storageRepo.getSales() as any;
    if (key === 'operational_costs') return storageRepo.getOperationalCosts() as any;
    if (key === 'activity_logs') return storageRepo.getActivityLogs() as any;
    if (key === 'stock_raw') return storageRepo.getRawStock() as any;
    if (key === 'stock_salted') return storageRepo.getSaltedStock() as any;
    if (key === 'categories') return storageRepo.getCategories() as any;
    
    // Default fallback to direct localstorage for unhandled keys
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  setData<T>(key: string, value: T): void {
    if (key === 'settings') storageRepo.saveSettings(value as any);
    else if (key === 'suppliers') storageRepo.saveSuppliers(value as any);
    else if (key === 'customers') storageRepo.saveCustomers(value as any);
    else if (key === 'farm_production') storageRepo.saveFarmProductions(value as any);
    else if (key === 'raw_transactions') storageRepo.saveRawTransactions(value as any);
    else if (key === 'production_batches') storageRepo.saveProductionBatches(value as any);
    else if (key === 'production_transactions') storageRepo.saveSaltedTransactions(value as any);
    else if (key === 'sales') storageRepo.saveSales(value as any);
    else if (key === 'operational_costs') storageRepo.saveOperationalCosts(value as any);
    else if (key === 'activity_logs') storageRepo.saveActivityLogs(value as any);
    else if (key === 'stock_raw') storageRepo.saveRawStock(value as any);
    else if (key === 'stock_salted') storageRepo.saveSaltedStock(value as any);
    else if (key === 'categories') storageRepo.saveCategories(value as any);
    else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  logActivity(action: string, details: string): void {
    erpService.logActivity(action, details);
  },

  resetSystem(): void {
    erpService.resetSystem();
  },

  backupData(): string {
    return new BackupService(storageRepo).create();
  },

  restoreData(jsonString: string): boolean {
    try {
      new BackupService(storageRepo).restore(jsonString, () => {
        erpService.logActivity('RESTORE', 'Database berhasil direstore dengan validasi integritas data lengkap.');
      });
      return true;
    } catch (err: unknown) {
      console.error('Error during database restore:', err);
      return false;
    }
  },

  seedSampleData() {
    erpService.seedDemoData();
  }
};

// ==========================================
// STOCK MANAGER ADAPTER
// ==========================================
export const StockManager = {
  getRawStock(): StockState {
    return erpService.getRawStock();
  },

  getSaltedStock(): StockState {
    return erpService.getSaltedStock();
  },

  getRawTransactions(): RawEggTransaction[] {
    return erpService.getRawTransactions();
  },

  getSaltedTransactions(): SaltedEggTransaction[] {
    return erpService.getSaltedTransactions();
  },

  checkRawAvailability(qty: number): boolean {
    return erpService.getRawStock().qty >= qty;
  },

  checkSaltedAvailability(qty: number): boolean {
    return erpService.getSaltedStock().qty >= qty;
  },

  addRawStock(date: string, type: 'PRODUCTION' | 'PURCHASE', qty: number, totalCost: number, refId: string, notes: string): void {
    erpService.addRawStock(date, type, qty, totalCost, refId, notes);
  },

  deductRawStock(date: string, type: 'TRANSFER_OUT' | 'SALE_OUT', qty: number, refId: string, notes: string): number {
    return erpService.deductRawStock(date, type, qty, refId, notes);
  },

  addSaltedStock(date: string, qty: number, totalCost: number, refId: string, notes: string): void {
    erpService.addSaltedStock(date, qty, totalCost, refId, notes);
  },

  deductSaltedStock(date: string, qty: number, refId: string, notes: string): number {
    return erpService.deductSaltedStock(date, qty, refId, notes);
  }
};

// ==========================================
// PRODUCTION MANAGER (KANDANG) ADAPTER
// ==========================================
export const ProductionManager = {
  getProductions(): FarmProduction[] {
    return erpService.getFarmProductions();
  },

  addProduction(data: Omit<FarmProduction, 'id'>): void {
    erpService.addFarmProduction(data);
  },

  deleteProduction(id: string): void {
    erpService.deleteFarmProduction(id);
  }
};

// ==========================================
// BATCH MANAGER (PRODUKSI TELUR ASIN) ADAPTER
// ==========================================
export const BatchManager = {
  getBatches(): ProductionBatch[] {
    return erpService.getProductionBatches();
  },

  createBatch(data: {
    date: string;
    qtyInput: number;
    saltCost: number;
    ashCost: number;
    plasticCost: number;
    packagingCost: number;
    laborCost: number;
    otherCost: number;
    notes: string;
  }): void {
    erpService.createBatch({
      ...data,
      status: 'Pemeraman'
    } as any);
  },

  updateBatchStatus(id: string, newStatus: BatchStatus): void {
    erpService.updateBatchStatus(id, newStatus);
  },

  deleteBatch(id: string): void {
    erpService.deleteBatch(id);
  },

  getBatchAge(batch: ProductionBatch): number {
    return Utils.getDaysDifference(batch.date, new Date());
  },

  getBatchStatusBadge(status: BatchStatus): { bg: string, text: string } {
    switch (status) {
      case 'Pemeraman':
        return { bg: 'bg-amber-100 text-amber-800', text: 'Pemeraman (Asin)' };
      case 'Siap Panen':
        return { bg: 'bg-blue-100 text-blue-800', text: 'Siap Panen' };
      case 'Siap Dijual':
        return { bg: 'bg-emerald-100 text-emerald-800', text: 'Siap Dijual' };
      case 'Selesai':
        return { bg: 'bg-gray-100 text-gray-800', text: 'Selesai' };
      default:
        return { bg: 'bg-gray-100 text-gray-800', text: status };
    }
  }
};

// ==========================================
// SALES MANAGER ADAPTER
// ==========================================
export const SalesManager = {
  getSales(): Sale[] {
    return erpService.getSales();
  },

  addSale(data: {
    date: string;
    customerId: string;
    eggType: 'RAW' | 'SALTED';
    qty: number;
    pricePerUnit: number;
    discount: number;
    shippingCost: number;
    notes: string;
  }): void {
    erpService.createSale(data);
  },

  deleteSale(id: string): void {
    erpService.deleteSale(id);
  }
};

// ==========================================
// FARM MONITORING MANAGER ADAPTER
// ==========================================
export const FarmManager = {
  getFlockKPIs() {
    const productions = erpService.getFarmProductions();
    if (productions.length === 0) {
      return {
        population: 0,
        productiveCount: 0,
        culledCount: 0,
        mortality: 0,
        feedQty: 0,
        productivityPct: 0,
        eggYieldPerDuck: 0
      };
    }

    const sorted = [...productions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const last30DaysProds = productions.filter(p => new Date(p.date) >= thirtyDaysAgo);
    const totalEggs30 = last30DaysProds.reduce((sum, p) => sum + p.qty, 0);
    const totalProductiveDucks30 = last30DaysProds.reduce((sum, p) => sum + p.productiveCount, 0);
    const totalMortality = productions.reduce((sum, p) => sum + (p.mortality || 0), 0);
    const totalCulled = productions.reduce((sum, p) => sum + (p.culledCount || 0), 0);
    const totalFeed = productions.reduce((sum, p) => sum + (p.feedQty || 0), 0);

    const productivityPct = latest.productiveCount > 0 ? (latest.qty / latest.productiveCount) * 100 : 0;
    const eggYieldPerDuck = totalProductiveDucks30 > 0 ? (totalEggs30 / totalProductiveDucks30) : 0;

    return {
      population: latest.population,
      productiveCount: latest.productiveCount,
      culledCount: totalCulled,
      mortality: totalMortality,
      feedQty: totalFeed,
      productivityPct,
      eggYieldPerDuck
    };
  }
};

// ==========================================
// REPORT & FINANCIAL MANAGER ADAPTER
// ==========================================
export const ReportManager = {
  getStockRawCard(period: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom', customRange?: { start: string; end: string }) {
    const txs = erpService.getRawTransactions();
    return txs.filter(tx => Utils.isDateInPeriod(tx.date, period, customRange))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getStockSaltedCard(period: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom', customRange?: { start: string; end: string }) {
    const txs = erpService.getSaltedTransactions();
    return txs.filter(tx => Utils.isDateInPeriod(tx.date, period, customRange))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getProductionReport(period: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom', customRange?: { start: string; end: string }) {
    const farmProds = erpService.getFarmProductions();
    const batches = erpService.getProductionBatches();

    const filteredFarm = farmProds.filter(p => Utils.isDateInPeriod(p.date, period, customRange));
    const filteredBatches = batches.filter(b => Utils.isDateInPeriod(b.date, period, customRange));

    return {
      farmProductions: filteredFarm,
      saltedBatches: filteredBatches,
      totalFarmEggs: filteredFarm.reduce((sum, p) => sum + p.qty, 0),
      totalSaltedEggs: filteredBatches.reduce((sum, b) => sum + b.qtyInput, 0),
      totalBatchCost: filteredBatches.reduce((sum, b) => sum + b.totalCost, 0)
    };
  },

  getPurchaseReport(supplierId?: string, period: string = 'month', customRange?: { start: string; end: string }) {
    const rawTxs = erpService.getRawTransactions();
    let purchases = rawTxs.filter(tx => tx.type === 'PURCHASE');
    
    if (supplierId && supplierId !== 'all') {
      purchases = purchases.filter(tx => tx.notes.toLowerCase().includes(supplierId.toLowerCase()) || tx.refId === supplierId);
    }

    if (period !== 'all') {
      purchases = purchases.filter(tx => Utils.isDateInPeriod(tx.date, period as any, customRange));
    }

    return purchases;
  },

  getSalesReport(customerId?: string, period: string = 'month', customRange?: { start: string; end: string }) {
    const sales = erpService.getSales();
    let filtered = sales;

    if (customerId && customerId !== 'all') {
      filtered = filtered.filter(s => s.customerId === customerId);
    }

    if (period !== 'all') {
      filtered = filtered.filter(s => Utils.isDateInPeriod(s.date, period as any, customRange));
    }

    return {
      sales: filtered,
      totalQty: filtered.reduce((sum, s) => sum + s.qty, 0),
      totalRevenue: filtered.reduce((sum, s) => sum + s.totalRevenue, 0),
      totalCOGS: filtered.reduce((sum, s) => sum + s.cogs, 0),
      totalGrossProfit: filtered.reduce((sum, s) => sum + s.grossProfit, 0)
    };
  },

  getInventoryValuation() {
    const rawStock = erpService.getRawStock();
    const saltedStock = erpService.getSaltedStock();

    const rawValue = rawStock.qty * rawStock.avgCost;
    const saltedValue = saltedStock.qty * saltedStock.avgCost;

    return {
      rawQty: rawStock.qty,
      rawAvgCost: rawStock.avgCost,
      rawValue,
      saltedQty: saltedStock.qty,
      saltedAvgCost: saltedStock.avgCost,
      saltedValue,
      totalValue: rawValue + saltedValue
    };
  },

  getIncomeStatement(period: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom', customRange?: { start: string; end: string }) {
    const sales = erpService.getSales().filter(s => Utils.isDateInPeriod(s.date, period, customRange));
    const opCosts = erpService.getOperationalCosts();
    const filteredOpCosts = opCosts.filter(c => Utils.isDateInPeriod(c.date, period, customRange));

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalCOGS = sales.reduce((sum, s) => sum + s.cogs, 0);
    const grossProfit = totalRevenue - totalCOGS;

    const totalOpCosts = filteredOpCosts.reduce((sum, c) => sum + c.amount, 0);
    const netProfit = grossProfit - totalOpCosts;

    const expensesByCategory: Record<string, number> = {};
    filteredOpCosts.forEach(c => {
      expensesByCategory[c.category] = (expensesByCategory[c.category] || 0) + c.amount;
    });

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      operationalCosts: filteredOpCosts,
      totalOpCosts,
      netProfit,
      expensesByCategory
    };
  }
};

// ==========================================
// DASHBOARD & CHART MANAGER ADAPTER
// ==========================================
export const DashboardManager = {
  getKPIs() {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const farmProds = erpService.getFarmProductions();
    const todayFarm = farmProds.filter(p => p.date === todayStr);
    const todayProdQty = todayFarm.reduce((sum, p) => sum + p.qty, 0);

    const rawStock = erpService.getRawStock();
    const saltedStock = erpService.getSaltedStock();

    const rawValue = rawStock.qty * rawStock.avgCost;
    const saltedValue = saltedStock.qty * saltedStock.avgCost;

    const sales = erpService.getSales();
    const todaySalesList = sales.filter(s => s.date === todayStr);
    const todaySalesQty = todaySalesList.reduce((sum, s) => sum + s.qty, 0);
    const todayRevenue = todaySalesList.reduce((sum, s) => sum + s.totalRevenue, 0);
    const todayCOGS = todaySalesList.reduce((sum, s) => sum + s.cogs, 0);
    const todayGrossProfit = todaySalesList.reduce((sum, s) => sum + s.grossProfit, 0);

    const opCosts = erpService.getOperationalCosts();
    const todayCosts = opCosts.filter(c => c.date === todayStr).reduce((sum, c) => sum + c.amount, 0);
    const todayNetProfit = todayGrossProfit - todayCosts;

    const suppliers = storageRepo.getSuppliers();
    const customers = storageRepo.getCustomers();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayFarm = farmProds.filter(p => p.date === yesterdayStr);
    const yesterdayProdQty = yesterdayFarm.reduce((sum, p) => sum + p.qty, 0);

    const yesterdaySalesList = sales.filter(s => s.date === yesterdayStr);
    const yesterdayRevenue = yesterdaySalesList.reduce((sum, s) => sum + s.totalRevenue, 0);
    const yesterdayCosts = opCosts.filter(c => c.date === yesterdayStr).reduce((sum, c) => sum + c.amount, 0);
    const yesterdayNetProfit = (yesterdaySalesList.reduce((sum, s) => sum + s.grossProfit, 0)) - yesterdayCosts;

    const getTrendIndicator = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? { label: '▲ Baru', color: 'text-emerald-600 bg-emerald-50' } : { label: '-', color: 'text-gray-500' };
      }
      const pct = ((current - previous) / previous) * 100;
      if (pct > 0) {
        return { label: `▲ ${pct.toFixed(0)}%`, color: 'text-emerald-600 bg-emerald-50' };
      } else if (pct < 0) {
        return { label: `▼ ${Math.abs(pct).toFixed(0)}%`, color: 'text-rose-600 bg-rose-50' };
      }
      return { label: '● 0%', color: 'text-gray-500' };
    };

    return {
      productionToday: { qty: todayProdQty, trend: getTrendIndicator(todayProdQty, yesterdayProdQty) },
      rawStock: { qty: rawStock.qty, value: rawValue },
      saltedStock: { qty: saltedStock.qty, value: saltedValue },
      salesToday: { qty: todaySalesQty, revenue: todayRevenue, trend: getTrendIndicator(todayRevenue, yesterdayRevenue) },
      cogsToday: todayCOGS,
      grossProfitToday: todayGrossProfit,
      expensesToday: todayCosts,
      netProfitToday: { val: todayNetProfit, trend: getTrendIndicator(todayNetProfit, yesterdayNetProfit) },
      totalSuppliers: suppliers.length,
      totalCustomers: customers.length
    };
  }
};

export const ChartManager = {
  get30DaysTrends() {
    const today = new Date();
    const dataList = [];

    const farmProds = erpService.getFarmProductions();
    const sales = erpService.getSales();
    const opCosts = erpService.getOperationalCosts();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      const dayFarm = farmProds.filter(p => p.date === dateStr);
      const productionQty = dayFarm.reduce((sum, p) => sum + p.qty, 0);

      const daySales = sales.filter(s => s.date === dateStr);
      const salesRevenue = daySales.reduce((sum, s) => sum + s.totalRevenue, 0);
      const salesCOGS = daySales.reduce((sum, s) => sum + s.cogs, 0);
      const salesQty = daySales.reduce((sum, s) => sum + s.qty, 0);
      const grossProfit = salesRevenue - salesCOGS;

      const dayCosts = opCosts.filter(c => c.date === dateStr).reduce((sum, c) => sum + c.amount, 0);
      const netProfit = grossProfit - dayCosts;

      dataList.push({
        date: dateStr,
        label,
        production: productionQty,
        sales: salesRevenue,
        salesQty,
        cogs: salesCOGS,
        profit: netProfit,
        costs: dayCosts
      });
    }

    return dataList;
  },

  getCostComposition() {
    const opCosts = erpService.getOperationalCosts();
    const composition: Record<string, number> = {};

    opCosts.forEach(c => {
      composition[c.category] = (composition[c.category] || 0) + c.amount;
    });

    const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#6b7280'];

    return Object.keys(composition).map((cat, idx) => ({
      name: cat,
      value: composition[cat],
      color: colors[idx % colors.length]
    }));
  }
};

export const ExportManager = {
  exportToCSV(headers: string[], rows: any[][], filename: string): void {
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.map(val => {
          const cellStr = String(val === null || val === undefined ? '' : val);
          if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    erpService.logActivity('EXPORT_CSV', `Mengeksport data laporan ke file CSV (${filename}.csv)`);
  },

  exportAllTransactionsToCSV(): void {
    const rawTxs = storageRepo.getRawTransactions();
    const saltedTxs = storageRepo.getSaltedTransactions();
    const sales = storageRepo.getSales();
    const opCosts = storageRepo.getOperationalCosts();

    const allRecords: any[] = [];

    rawTxs.forEach(tx => {
      allRecords.push({
        id: tx.id,
        date: tx.date,
        module: 'Bahan Baku (Raw)',
        type: tx.type,
        qty: tx.qty,
        pricePerUnit: tx.pricePerUnit,
        totalAmount: tx.totalCost,
        refId: tx.refId,
        notes: tx.notes
      });
    });

    saltedTxs.forEach(tx => {
      allRecords.push({
        id: tx.id,
        date: tx.date,
        module: 'Telur Asin (Salted)',
        type: tx.type,
        qty: tx.qty,
        pricePerUnit: tx.pricePerUnit,
        totalAmount: tx.totalCost,
        refId: tx.refId,
        notes: tx.notes
      });
    });

    sales.forEach(tx => {
      allRecords.push({
        id: tx.id,
        date: tx.date,
        module: 'Penjualan (Sales)',
        type: tx.eggType === 'RAW' ? 'JUAL_SEGAR' : 'JUAL_ASIN',
        qty: -tx.qty,
        pricePerUnit: tx.pricePerUnit,
        totalAmount: tx.totalRevenue,
        refId: tx.customerId,
        notes: tx.notes
      });
    });

    opCosts.forEach(tx => {
      allRecords.push({
        id: tx.id,
        date: tx.date,
        module: 'Biaya Operasional (Expenses)',
        type: tx.category,
        qty: 0,
        pricePerUnit: 0,
        totalAmount: -tx.amount,
        refId: '-',
        notes: tx.description
      });
    });

    allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const headers = [
      'ID Transaksi',
      'Tanggal',
      'Modul/Kategori',
      'Tipe Transaksi',
      'Kuantitas (Butir)',
      'Harga Satuan',
      'Total Nominal',
      'ID Referensi/Ref',
      'Keterangan/Catatan'
    ];

    const rows = allRecords.map(rec => [
      rec.id,
      rec.date,
      rec.module,
      rec.type,
      rec.qty,
      rec.pricePerUnit,
      rec.totalAmount,
      rec.refId,
      rec.notes
    ]);

    const filename = `audit_ledgers_${new Date().toISOString().split('T')[0]}`;
    this.exportToCSV(headers, rows, filename);
    erpService.logActivity('AUDIT_EXPORT_CSV', `Mengeksport jurnal audit lengkap ke file CSV (${filename}.csv)`);
  }
};
