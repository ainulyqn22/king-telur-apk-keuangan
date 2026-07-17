import { storageRepo, IStorageRepository } from '../repositories/StorageRepository.ts';
import { Utils } from '../../utils/managers.ts'; // Preserve Utils or inline them here
import { BusinessRuleViolation } from '../errors/CustomErrors.ts';
import { 
  SettingsSchema, 
  SupplierSchema, 
  CustomerSchema, 
  FarmProductionSchema, 
  ProductionBatchSchema, 
  SaleSchema, 
  OperationalCostSchema 
} from '../validators/schemas.ts';
import { 
  Settings, 
  Supplier, 
  Customer, 
  FarmProduction, 
  ProductionBatch, 
  Sale, 
  OperationalCost, 
  ActivityLog, 
  RawEggTransaction, 
  SaltedEggTransaction, 
  StockState 
} from '../types';

export class ErpService {
  constructor(private repo: IStorageRepository = storageRepo) {}

  private requirePositiveQuantity(qty: number, label: string): void {
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new BusinessRuleViolation(`${label} harus berupa angka lebih besar dari 0.`);
    }
  }

  private requireNonNegativeAmount(amount: number, label: string): void {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BusinessRuleViolation(`${label} harus berupa angka 0 atau lebih besar.`);
    }
  }

  // ==========================================
  // ACTIVITY LOGS
  // ==========================================
  logActivity(action: string, details: string): void {
    const logs = this.repo.getActivityLogs();
    const newLog: ActivityLog = {
      id: Utils.generateId(),
      timestamp: new Date().toISOString(),
      user: 'Administrator',
      action,
      details
    };
    logs.unshift(newLog);
    this.repo.saveActivityLogs(logs.slice(0, 200));
  }

  // ==========================================
  // SETTINGS & CATEGORIES
  // ==========================================
  getSettings(): Settings {
    return this.repo.getSettings();
  }

  updateSettings(settings: Settings): void {
    const validated = SettingsSchema.parse(settings);
    this.repo.saveSettings(validated);
    this.logActivity('SETTINGS_UPDATE', `Mengubah pengaturan profil ERP: ${validated.shopName}`);
  }

  getCategories(): string[] {
    return this.repo.getCategories();
  }

  addCategory(category: string): void {
    const cats = this.repo.getCategories();
    if (category && !cats.includes(category)) {
      cats.push(category);
      this.repo.saveCategories(cats);
      this.logActivity('CATEGORY_ADD', `Menambahkan kategori biaya operasional baru: ${category}`);
    }
  }

  // ==========================================
  // SUPPLIERS
  // ==========================================
  getSuppliers(): Supplier[] {
    return this.repo.getSuppliers();
  }

  addSupplier(data: Omit<Supplier, 'id'>): void {
    const id = 'sup-' + Utils.generateId();
    const validated = SupplierSchema.parse({ ...data, id });
    const list = this.getSuppliers();
    list.push(validated);
    this.repo.saveSuppliers(list);
    this.logActivity('SUPPLIER_ADD', `Menambahkan supplier baru: ${validated.name}`);
  }

  updateSupplier(id: string, data: Omit<Supplier, 'id'>): void {
    const validated = SupplierSchema.parse({ ...data, id });
    let list = this.getSuppliers();
    list = list.map(item => item.id === id ? validated : item);
    this.repo.saveSuppliers(list);
    this.logActivity('SUPPLIER_UPDATE', `Memperbarui detail supplier: ${validated.name}`);
  }

  deleteSupplier(id: string): void {
    const list = this.getSuppliers();
    const record = list.find(s => s.id === id);
    if (!record) return;
    this.repo.saveSuppliers(list.filter(s => s.id !== id));
    this.logActivity('SUPPLIER_DELETE', `Menghapus supplier: ${record.name}`);
  }

  // ==========================================
  // CUSTOMERS
  // ==========================================
  getCustomers(): Customer[] {
    return this.repo.getCustomers();
  }

  addCustomer(data: Omit<Customer, 'id'>): void {
    const id = 'cust-' + Utils.generateId();
    const validated = CustomerSchema.parse({ ...data, id });
    const list = this.getCustomers();
    list.push(validated);
    this.repo.saveCustomers(list);
    this.logActivity('CUSTOMER_ADD', `Menambahkan customer baru: ${validated.name} (${validated.type})`);
  }

  updateCustomer(id: string, data: Omit<Customer, 'id'>): void {
    const validated = CustomerSchema.parse({ ...data, id });
    let list = this.getCustomers();
    list = list.map(item => item.id === id ? validated : item);
    this.repo.saveCustomers(list);
    this.logActivity('CUSTOMER_UPDATE', `Memperbarui detail customer: ${validated.name}`);
  }

  deleteCustomer(id: string): void {
    const list = this.getCustomers();
    const record = list.find(c => c.id === id);
    if (!record) return;
    this.repo.saveCustomers(list.filter(c => c.id !== id));
    this.logActivity('CUSTOMER_DELETE', `Menghapus customer: ${record.name}`);
  }

  // ==========================================
  // INVENTORY & STOCK LOGIC
  // ==========================================
  getRawStock(): StockState {
    return this.repo.getRawStock();
  }

  getSaltedStock(): StockState {
    return this.repo.getSaltedStock();
  }

  getRawTransactions(): RawEggTransaction[] {
    return this.repo.getRawTransactions();
  }

  getSaltedTransactions(): SaltedEggTransaction[] {
    return this.repo.getSaltedTransactions();
  }

  addRawStock(date: string, type: 'PRODUCTION' | 'PURCHASE', qty: number, totalCost: number, refId: string, notes: string): void {
    this.requirePositiveQuantity(qty, 'Kuantitas stok telur segar');
    this.requireNonNegativeAmount(totalCost, 'Total biaya stok telur segar');

    const stock = this.getRawStock();
    const oldQty = stock.qty;
    const oldCost = stock.avgCost;

    const newQty = oldQty + qty;
    const newAvgCost = oldQty + qty > 0 ? (oldQty * oldCost + totalCost) / (oldQty + qty) : 0;

    this.repo.saveRawStock({ qty: newQty, avgCost: newAvgCost });

    const txs = this.getRawTransactions();
    const newTx: RawEggTransaction = {
      id: 'rtx-' + Utils.generateId(),
      date,
      type,
      qty,
      pricePerUnit: qty > 0 ? totalCost / qty : 0,
      totalCost,
      afterQty: newQty,
      afterAvgCost: newAvgCost,
      refId,
      notes
    };
    txs.push(newTx);
    this.repo.saveRawTransactions(txs);
    this.logActivity('STOCK_RAW_IN', `Stok telur segar bertambah +${qty} butir. Average baru: ${Utils.formatCurrency(newAvgCost)}`);
  }

  deductRawStock(date: string, type: 'TRANSFER_OUT' | 'SALE_OUT', qty: number, refId: string, notes: string): number {
    this.requirePositiveQuantity(qty, 'Kuantitas pengurangan telur segar');

    const stock = this.getRawStock();
    const oldQty = stock.qty;
    const currentAvgCost = stock.avgCost;

    if (oldQty < qty) {
      throw new Error(`Stok telur segar tidak mencukupi. Tersedia: ${oldQty}, diminta: ${qty}`);
    }

    const newQty = oldQty - qty;
    const totalCost = qty * currentAvgCost;

    this.repo.saveRawStock({ qty: newQty, avgCost: currentAvgCost });

    const txs = this.getRawTransactions();
    const newTx: RawEggTransaction = {
      id: 'rtx-' + Utils.generateId(),
      date,
      type,
      qty: -qty,
      pricePerUnit: currentAvgCost,
      totalCost,
      afterQty: newQty,
      afterAvgCost: currentAvgCost,
      refId,
      notes
    };
    txs.push(newTx);
    this.repo.saveRawTransactions(txs);
    this.logActivity('STOCK_RAW_OUT', `Stok telur segar berkurang -${qty} butir untuk ${notes}.`);

    return totalCost;
  }

  addSaltedStock(date: string, qty: number, totalCost: number, refId: string, notes: string): void {
    this.requirePositiveQuantity(qty, 'Kuantitas stok telur asin');
    this.requireNonNegativeAmount(totalCost, 'Total biaya stok telur asin');

    const stock = this.getSaltedStock();
    const oldQty = stock.qty;
    const oldCost = stock.avgCost;

    const newQty = oldQty + qty;
    const newAvgCost = oldQty + qty > 0 ? (oldQty * oldCost + totalCost) / (oldQty + qty) : 0;

    this.repo.saveSaltedStock({ qty: newQty, avgCost: newAvgCost });

    const txs = this.getSaltedTransactions();
    const newTx: SaltedEggTransaction = {
      id: 'stx-' + Utils.generateId(),
      date,
      type: 'BATCH_IN',
      qty,
      pricePerUnit: qty > 0 ? totalCost / qty : 0,
      totalCost,
      afterQty: newQty,
      afterAvgCost: newAvgCost,
      refId,
      notes
    };
    txs.push(newTx);
    this.repo.saveSaltedTransactions(txs);
    this.logActivity('STOCK_SALTED_IN', `Stok telur asin bertambah +${qty} butir dari batch ${refId}. Average baru: ${Utils.formatCurrency(newAvgCost)}`);
  }

  deductSaltedStock(date: string, qty: number, refId: string, notes: string): number {
    this.requirePositiveQuantity(qty, 'Kuantitas pengurangan telur asin');

    const stock = this.getSaltedStock();
    const oldQty = stock.qty;
    const currentAvgCost = stock.avgCost;

    if (oldQty < qty) {
      throw new Error(`Stok telur asin tidak mencukupi. Tersedia: ${oldQty}, diminta: ${qty}`);
    }

    const newQty = oldQty - qty;
    const totalCost = qty * currentAvgCost;

    this.repo.saveSaltedStock({ qty: newQty, avgCost: currentAvgCost });

    const txs = this.getSaltedTransactions();
    const newTx: SaltedEggTransaction = {
      id: 'stx-' + Utils.generateId(),
      date,
      type: 'SALE_OUT',
      qty: -qty,
      pricePerUnit: currentAvgCost,
      totalCost,
      afterQty: newQty,
      afterAvgCost: currentAvgCost,
      refId,
      notes
    };
    txs.push(newTx);
    this.repo.saveSaltedTransactions(txs);
    this.logActivity('STOCK_SALTED_OUT', `Stok telur asin berkurang -${qty} butir untuk penjualan.`);

    return totalCost;
  }

  // ==========================================
  // FARM PRODUCTION
  // ==========================================
  getFarmProductions(): FarmProduction[] {
    return this.repo.getFarmProductions();
  }

  addFarmProduction(data: Omit<FarmProduction, 'id'>): void {
    const id = 'farm-' + Utils.generateId();
    const validated = FarmProductionSchema.parse({ ...data, id });
    const list = this.getFarmProductions();
    list.push(validated);
    this.repo.saveFarmProductions(list);

    // Automatically add to Raw stock
    const totalCost = validated.qty * validated.transferPrice;
    this.addRawStock(
      validated.date,
      'PRODUCTION',
      validated.qty,
      totalCost,
      id,
      `Hasil panen kandang bebek petelur`
    );
    this.logActivity('FARM_PROD_ADD', `Mencatat panen hulu: ${validated.qty} butir @ ${Utils.formatCurrency(validated.transferPrice)}`);
  }

  deleteFarmProduction(id: string): void {
    const list = this.getFarmProductions();
    const record = list.find(p => p.id === id);
    if (!record) return;

    // Verify stock availability before reversal
    const rawStock = this.getRawStock();
    if (rawStock.qty < record.qty) {
      throw new Error(`Gagal hapus! Stok telur segar tinggal ${rawStock.qty} butir, tidak cukup mereversalkan panen ${record.qty} butir.`);
    }

    this.repo.saveFarmProductions(list.filter(p => p.id !== id));

    // Deduct stock to reverse
    this.deductRawStock(
      new Date().toISOString().split('T')[0],
      'TRANSFER_OUT',
      record.qty,
      id,
      `Reversal panen kandang dihapus (${id})`
    );

    // Remove raw transaction record
    let rawTxs = this.getRawTransactions();
    rawTxs = rawTxs.filter(tx => tx.refId !== id);
    this.repo.saveRawTransactions(rawTxs);

    this.logActivity('FARM_PROD_DEL', `Menghapus catatan panen hulu ${id} sebesar ${record.qty} butir.`);
  }

  // ==========================================
  // PRODUCTION BATCHES
  // ==========================================
  getProductionBatches(): ProductionBatch[] {
    return this.repo.getProductionBatches();
  }

  createBatch(data: Omit<ProductionBatch, 'id' | 'batchNo' | 'rawEggCost' | 'totalCost' | 'costPerUnit' | 'harvestDate'>): void {
    if (data.status !== 'Pemeraman') {
      throw new BusinessRuleViolation('Batch baru harus dimulai pada status Pemeraman.');
    }

    const stock = this.getRawStock();
    if (stock.qty < data.qtyInput) {
      throw new Error(`Stok telur segar tidak mencukupi. Tersedia: ${stock.qty}, dibutuhkan: ${data.qtyInput}`);
    }

    const id = 'batch-' + Utils.generateId();

    // ERP-001: Unique Batch Number Sequence Generation
    const targetDateStr = data.date.replace(/-/g, ''); // e.g. 20260714
    const prefix = `BATCH-${targetDateStr}-`;
    const existingBatches = this.getProductionBatches();
    const batchesOnDay = existingBatches.filter(b => b.date === data.date);
    
    let sequenceNum = batchesOnDay.length + 1;
    let batchNo = `${prefix}${String(sequenceNum).padStart(4, '0')}`;
    
    // Collision checking and sequential suffix increment
    while (existingBatches.some(b => b.batchNo === batchNo)) {
      sequenceNum++;
      batchNo = `${prefix}${String(sequenceNum).padStart(4, '0')}`;
    }

    // Calculate and validate the complete record before mutating inventory.
    const rawEggCost = data.qtyInput * stock.avgCost;
    const totalCost = rawEggCost + data.saltCost + data.ashCost + data.plasticCost + data.packagingCost + data.laborCost + data.otherCost;
    const costPerUnit = totalCost / data.qtyInput;

    const pDate = new Date(data.date);
    pDate.setDate(pDate.getDate() + 14);
    const harvestDate = pDate.toISOString().split('T')[0];

    const newBatch: ProductionBatch = {
      ...data,
      id,
      batchNo,
      rawEggCost,
      totalCost,
      costPerUnit,
      harvestDate
    };

    const validated = ProductionBatchSchema.parse(newBatch);

    this.deductRawStock(
      validated.date,
      'TRANSFER_OUT',
      validated.qtyInput,
      id,
      `Bahan baku produksi telur asin batch ${batchNo}`
    );

    const list = this.getProductionBatches();
    list.push(validated);
    this.repo.saveProductionBatches(list);

    this.logActivity('BATCH_CREATE', `Membuat batch produksi ${batchNo} sebanyak ${validated.qtyInput} butir.`);
  }

  updateBatchStatus(id: string, status: ProductionBatch['status']): void {
    const list = this.getProductionBatches();
    const index = list.findIndex(b => b.id === id);
    if (index === -1) return;

    const batch = list[index];
    const oldStatus = batch.status;
    if (oldStatus === status) return;

    // ERP-002: Batch State Machine - Prevent modifying finished batches
    if (oldStatus === 'Selesai') {
      throw new BusinessRuleViolation('Batch yang sudah selesai tidak dapat dimodifikasi atau diubah statusnya!');
    }

    // ERP-002: Validate controlled status transitions
    const validTransitions: Record<ProductionBatch['status'], ProductionBatch['status'][]> = {
      'Pemeraman': ['Siap Panen'],
      'Siap Panen': ['Siap Dijual'],
      'Siap Dijual': ['Selesai'],
      'Selesai': []
    };

    const allowedTransitions = validTransitions[oldStatus];
    if (!allowedTransitions || !allowedTransitions.includes(status)) {
      throw new BusinessRuleViolation(`Transisi status tidak diperbolehkan secara langsung dari ${oldStatus} ke ${status}. Transisi harus mengikuti tahapan alur ERP.`);
    }

    batch.status = status;
    this.repo.saveProductionBatches(list);

    // Curing transition to stock
    if (status === 'Siap Dijual') {
      this.addSaltedStock(
        new Date().toISOString().split('T')[0],
        batch.qtyInput,
        batch.totalCost,
        id,
        `Panen batch telur asin ${batch.batchNo}`
      );
    }

    this.logActivity('BATCH_STATUS_UPDATE', `Mengubah status batch ${batch.batchNo} dari ${oldStatus} menjadi ${status}`);
  }

  deleteBatch(id: string): void {
    const list = this.getProductionBatches();
    const batch = list.find(b => b.id === id);
    if (!batch) return;

    // ERP-002: Prevent deleting finished batches
    if (batch.status === 'Selesai') {
      throw new BusinessRuleViolation('Batch yang sudah selesai bersifat permanen dan tidak dapat dihapus untuk menjaga auditabilitas keuangan!');
    }

    // If batch was already harvested, verify we have enough salted stock to reverse it
    if (batch.status === 'Siap Dijual') {
      const saltedStock = this.getSaltedStock();
      if (saltedStock.qty < batch.qtyInput) {
        throw new Error(`Gagal hapus! Stok telur asin tinggal ${saltedStock.qty} butir, tidak cukup untuk mereversalkan panen batch ${batch.qtyInput} butir.`);
      }
      this.deductSaltedStock(
        new Date().toISOString().split('T')[0],
        batch.qtyInput,
        id,
        `Hapus batch produksi ${batch.batchNo}`
      );
    } else {
      // Return raw eggs back to raw stock
      this.addRawStock(
        new Date().toISOString().split('T')[0],
        'PRODUCTION',
        batch.qtyInput,
        batch.rawEggCost,
        id,
        `Reversal pembatalan batch ${batch.batchNo}`
      );
    }

    this.repo.saveProductionBatches(list.filter(b => b.id !== id));

    // Cleanup associated stock transactions
    let rawTxs = this.getRawTransactions();
    rawTxs = rawTxs.filter(tx => tx.refId !== id);
    this.repo.saveRawTransactions(rawTxs);

    let saltedTxs = this.getSaltedTransactions();
    saltedTxs = saltedTxs.filter(tx => tx.refId !== id);
    this.repo.saveSaltedTransactions(saltedTxs);

    this.logActivity('BATCH_DELETE', `Menghapus batch produksi ${batch.batchNo}.`);
  }

  // ==========================================
  // SALES
  // ==========================================
  getSales(): Sale[] {
    return this.repo.getSales();
  }

  createSale(data: Omit<Sale, 'id' | 'totalRevenue' | 'cogs' | 'grossProfit'>): void {
    const id = 'sale-' + Utils.generateId();

    // Check availability and calculate the complete sale before mutating inventory.
    let availableStock: StockState;
    if (data.eggType === 'RAW') {
      availableStock = this.getRawStock();
    } else {
      availableStock = this.getSaltedStock();
    }

    if (availableStock.qty < data.qty) {
      const eggLabel = data.eggType === 'RAW' ? 'segar' : 'asin';
      throw new Error(`Stok telur ${eggLabel} tidak mencukupi. Tersedia: ${availableStock.qty} butir.`);
    }

    const cogs = data.qty * availableStock.avgCost;
    const totalRevenue = (data.qty * data.pricePerUnit) - data.discount + data.shippingCost;
    const grossProfit = totalRevenue - cogs;

    const newSale: Sale = {
      ...data,
      id,
      totalRevenue,
      cogs,
      grossProfit
    };

    const validated = SaleSchema.parse(newSale);

    if (validated.eggType === 'RAW') {
      this.deductRawStock(validated.date, 'SALE_OUT', validated.qty, id, 'Penjualan telur segar');
    } else {
      this.deductSaltedStock(validated.date, validated.qty, id, 'Penjualan telur asin');
    }

    const list = this.getSales();
    list.unshift(validated); // newest first
    this.repo.saveSales(list);

    this.logActivity('SALE_CREATE', `Mencatat penjualan ${validated.eggType} sebanyak ${validated.qty} butir. Total: ${Utils.formatCurrency(totalRevenue)}`);
  }

  deleteSale(id: string): void {
    const list = this.getSales();
    const sale = list.find(s => s.id === id);
    if (!sale) return;

    // Reverse transaction: return sold inventory
    if (sale.eggType === 'RAW') {
      this.addRawStock(
        new Date().toISOString().split('T')[0],
        'PRODUCTION',
        sale.qty,
        sale.cogs,
        id,
        `Reversal pembatalan penjualan telur segar (${sale.id})`
      );
    } else {
      this.addSaltedStock(
        new Date().toISOString().split('T')[0],
        sale.qty,
        sale.cogs,
        id,
        `Reversal pembatalan penjualan telur asin (${sale.id})`
      );
    }

    this.repo.saveSales(list.filter(s => s.id !== id));

    // Cleanup associated stock transactions
    let rawTxs = this.getRawTransactions();
    rawTxs = rawTxs.filter(tx => tx.refId !== id);
    this.repo.saveRawTransactions(rawTxs);

    let saltedTxs = this.getSaltedTransactions();
    saltedTxs = saltedTxs.filter(tx => tx.refId !== id);
    this.repo.saveSaltedTransactions(saltedTxs);

    this.logActivity('SALE_DELETE', `Membatalkan penjualan ${sale.id} sebanyak ${sale.qty} butir.`);
  }

  // ==========================================
  // OPERATIONAL COSTS (FINANCE)
  // ==========================================
  getOperationalCosts(): OperationalCost[] {
    return this.repo.getOperationalCosts();
  }

  addOperationalCost(data: Omit<OperationalCost, 'id'>): void {
    const id = 'op-' + Utils.generateId();
    const validated = OperationalCostSchema.parse({ ...data, id });
    const list = this.getOperationalCosts();
    list.unshift(validated); // newest first
    this.repo.saveOperationalCosts(list);
    this.logActivity('OP_COST_ADD', `Mencatat biaya operasional [${validated.category}]: ${Utils.formatCurrency(validated.amount)}`);
  }

  deleteOperationalCost(id: string): void {
    const list = this.getOperationalCosts();
    const record = list.find(o => o.id === id);
    if (!record) return;

    this.repo.saveOperationalCosts(list.filter(o => o.id !== id));
    this.logActivity('OP_COST_DEL', `Menghapus catatan pengeluaran ${record.category} sebesar ${Utils.formatCurrency(record.amount)}`);
  }

  // ==========================================
  // SYSTEM UTILITIES (SEED/RESET/BACKUP)
  // ==========================================
  resetSystem(): void {
    this.repo.clearAll();
    const settings: Settings = {
      shopName: 'HouseERP Duck Farm',
      logo: '',
      currency: 'Rp',
      defaultTransferPrice: 2000
    };
    this.repo.saveSettings(settings);
    this.repo.saveCategories([
      'Garam', 'Abu Gosok', 'Plastik', 'Kemasan', 'Gaji Karyawan', 
      'Listrik', 'Air', 'Pakan Bebek', 'Transportasi', 'Vaksin & Obat', 'Lain-lain'
    ]);
    this.repo.saveSuppliers([]);
    this.repo.saveCustomers([]);
    this.repo.saveFarmProductions([]);
    this.repo.saveRawTransactions([]);
    this.repo.saveProductionBatches([]);
    this.repo.saveSaltedTransactions([]);
    this.repo.saveSales([]);
    this.repo.saveOperationalCosts([]);
    this.repo.saveActivityLogs([]);
    this.repo.saveRawStock({ qty: 0, avgCost: 0 });
    this.repo.saveSaltedStock({ qty: 0, avgCost: 0 });
    
    this.logActivity('RESET', 'Sistem berhasil direset total ke setelan awal.');
  }

  seedDemoData(): void {
    this.resetSystem();

    const settings: Settings = {
      shopName: 'HouseERP - Peternakan Barokah',
      logo: '',
      currency: 'Rp',
      defaultTransferPrice: 2000
    };
    this.repo.saveSettings(settings);

    const suppliers: Supplier[] = [
      { id: 'sup-1', name: 'H. Rozak Supplier Telur', address: 'Brebes, Jawa Tengah', phone: '081234567890', notes: 'Supplier telur bebek segar kualitas super' },
      { id: 'sup-2', name: 'Toko Kimia Makmur', address: 'Tegal, Jawa Tengah', phone: '085712345678', notes: 'Supplier garam kristal beryodium dan bahan pelengkap' }
    ];
    this.repo.saveSuppliers(suppliers);

    const customers: Customer[] = [
      { id: 'cust-1', name: 'Ibu Ningsih (Reseller)', type: 'Reseller', address: 'Cirebon, Jawa Barat', phone: '082198765432', notes: 'Beli rutin per minggu 500 butir' },
      { id: 'cust-2', name: 'Distributor Sembako Jaya', type: 'Distributor', address: 'Jakarta Selatan', phone: '081199887766', notes: 'Pengambilan skala besar per bulan' },
      { id: 'cust-3', name: 'Supermarket Fresh Mart', type: 'Retail', address: 'Bandung', phone: '089911223344', notes: 'Butuh telur asin dengan stiker label premium' }
    ];
    this.repo.saveCustomers(customers);

    // Simulate 7 Days of activities
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - i);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Farm Production
      const prodQty = 150 + Math.floor(Math.random() * 50);
      const farmId = 'farm-' + i;
      const deadDucks = Math.random() < 0.2 ? 1 : 0;
      
      const prodRecord: FarmProduction = {
        id: farmId,
        date: dateStr,
        qty: prodQty,
        transferPrice: 2000,
        population: 500 - (6 - i) * deadDucks,
        productiveCount: 420 - (6 - i) * deadDucks,
        culledCount: 5,
        mortality: deadDucks,
        feedQty: 50,
        feedCost: 350000,
        notes: `Produksi harian kandang hulu`
      };
      const farmList = this.repo.getFarmProductions();
      farmList.push(prodRecord);
      this.repo.saveFarmProductions(farmList);
      this.addRawStock(dateStr, 'PRODUCTION', prodQty, prodQty * 2000, farmId, 'Panen telur bebek harian');

      // Purchase additional stock from outside on day 6, 5 and 2
      if (i === 6) {
        this.addRawStock(dateStr, 'PURCHASE', 1000, 1850000, 'pur-6', 'Beli telur tambahan dari H. Rozak');
      }
      if (i === 5) {
        this.addRawStock(dateStr, 'PURCHASE', 1000, 1850000, 'pur-5', 'Beli telur tambahan dari H. Rozak');
      }
      if (i === 2) {
        this.addRawStock(dateStr, 'PURCHASE', 500, 950000, 'pur-2', 'Beli telur tambahan skala kecil');
      }

      // Operational costs
      if (i === 6) {
        this.addOperationalCost({ date: dateStr, category: 'Listrik', amount: 150000, description: 'Bayar PLN kandang & pompa air' });
      }
      if (i === 4) {
        this.addOperationalCost({ date: dateStr, category: 'Pakan Bebek', amount: 750000, description: 'Beli pakan bekatul & konsentrat' });
      }
      if (i === 1) {
        this.addOperationalCost({ date: dateStr, category: 'Air', amount: 80000, description: 'PDAM kandang produksi' });
      }

      // Create some production batches
      if (i === 6 || i === 4 || i === 1) {
        const batchQty = i === 6 ? 300 : i === 4 ? 400 : 250;
        const batchId = 'batch-' + i;
        const batchNo = `BATCH-${dateStr.replace(/-/g, '')}-001`;

        const rawEggCost = this.deductRawStock(dateStr, 'TRANSFER_OUT', batchQty, batchId, `Internal batch ${batchNo}`);
        const totalBatchCost = rawEggCost + (batchQty * 150) + (batchQty * 100) + (batchQty * 50) + (batchQty * 50) + (batchQty * 150) + 15000;
        const costPerUnit = totalBatchCost / batchQty;

        const hDate = new Date(currentDate);
        hDate.setDate(hDate.getDate() + 14);
        const harvestDateStr = hDate.toISOString().split('T')[0];

        const newBatch: ProductionBatch = {
          id: batchId,
          batchNo,
          date: dateStr,
          qtyInput: batchQty,
          status: i === 6 ? 'Siap Dijual' : 'Pemeraman',
          rawEggCost,
          saltCost: batchQty * 150,
          ashCost: batchQty * 100,
          plasticCost: batchQty * 50,
          packagingCost: batchQty * 50,
          laborCost: batchQty * 150,
          otherCost: 15000,
          totalCost: totalBatchCost,
          costPerUnit,
          harvestDate: harvestDateStr,
          notes: 'Batch telur asin resep sedang'
        };

        const batchList = this.repo.getProductionBatches();
        batchList.push(newBatch);
        this.repo.saveProductionBatches(batchList);

        if (newBatch.status === 'Siap Dijual') {
          this.addSaltedStock(dateStr, batchQty, totalBatchCost, batchId, `Penyelesaian batch ${batchNo}`);
        }
      }

      // Inject old salted eggs for immediate sale
      if (i === 6) {
        this.addSaltedStock(dateStr, 800, 800 * 2500, 'batch-old', 'Stok telur asin siap jual batch lama');
      }

      // Sales
      if (i === 3) {
        this.createSale({
          date: dateStr,
          customerId: 'cust-1',
          eggType: 'SALTED',
          qty: 300,
          pricePerUnit: 3500,
          discount: 15000,
          shippingCost: 25000,
          notes: 'Reseller rutin Ibu Ningsih'
        });
      }
      if (i === 1) {
        this.createSale({
          date: dateStr,
          customerId: 'cust-2',
          eggType: 'RAW',
          qty: 200,
          pricePerUnit: 2300,
          discount: 0,
          shippingCost: 15000,
          notes: 'Grosir telur segar distributor jaya'
        });
      }
      if (i === 0) {
        this.createSale({
          date: dateStr,
          customerId: 'cust-3',
          eggType: 'SALTED',
          qty: 150,
          pricePerUnit: 3600,
          discount: 10000,
          shippingCost: 0,
          notes: 'Harian Fresh Mart Bandung'
        });
      }
    }

    this.logActivity('SEED_DATA', 'Sistem berhasil di-seed dengan data transaksi simulasi ERP lengkap!');
  }
}

export const erpService = new ErpService();
