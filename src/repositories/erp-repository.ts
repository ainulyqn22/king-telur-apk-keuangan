import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BatchStatus,
  Customer,
  CustomerType,
  DashboardSnapshot,
  EggType,
  FarmProduction,
  OperationalCost,
  ProductionBatch,
  RawTransaction,
  Sale,
  Settings,
  StockState,
  Supplier,
} from '@/types/erp';

type Row = Record<string, unknown>;

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => Number(value ?? 0);

function stock(row: Row | null | undefined): StockState {
  return { qty: num(row?.qty), avgCost: num(row?.avg_cost) };
}

function mapSettings(row: Row | null | undefined): Settings {
  return row
    ? {
        shopName: text(row.shop_name) || 'HouseERP',
        logo: text(row.logo),
        currency: text(row.currency) || 'Rp',
        defaultTransferPrice: num(row.default_transfer_price),
      }
    : { shopName: 'HouseERP', logo: '', currency: 'Rp', defaultTransferPrice: 2000 };
}

function mapSupplier(row: Row): Supplier {
  return { id: text(row.id), name: text(row.name), address: text(row.address), phone: text(row.phone), notes: text(row.notes) };
}

function mapCustomer(row: Row): Customer {
  return {
    id: text(row.id),
    name: text(row.name),
    type: text(row.type) as CustomerType,
    address: text(row.address),
    phone: text(row.phone),
    notes: text(row.notes),
  };
}

function mapFarm(row: Row): FarmProduction {
  return {
    id: text(row.id),
    date: text(row.date),
    qty: num(row.qty),
    transferPrice: num(row.transfer_price),
    population: num(row.population),
    productiveCount: num(row.productive_count),
    culledCount: num(row.culled_count),
    mortality: num(row.mortality),
    feedQty: num(row.feed_qty),
    feedCost: num(row.feed_cost),
    notes: text(row.notes),
  };
}

function mapBatch(row: Row): ProductionBatch {
  return {
    id: text(row.id),
    batchNo: text(row.batch_no),
    date: text(row.date),
    qtyInput: num(row.qty_input),
    status: text(row.status) as BatchStatus,
    rawEggCost: num(row.raw_egg_cost),
    saltCost: num(row.salt_cost),
    ashCost: num(row.ash_cost),
    plasticCost: num(row.plastic_cost),
    packagingCost: num(row.packaging_cost),
    laborCost: num(row.labor_cost),
    otherCost: num(row.other_cost),
    totalCost: num(row.total_cost),
    costPerUnit: num(row.cost_per_unit),
    harvestDate: text(row.harvest_date),
    notes: text(row.notes),
  };
}

function mapSale(row: Row): Sale {
  return {
    id: text(row.id),
    date: text(row.date),
    customerId: text(row.customer_id),
    eggType: text(row.egg_type) as EggType,
    qty: num(row.qty),
    pricePerUnit: num(row.price_per_unit),
    discount: num(row.discount),
    shippingCost: num(row.shipping_cost),
    totalRevenue: num(row.total_revenue),
    cogs: num(row.cogs),
    grossProfit: num(row.gross_profit),
    notes: text(row.notes),
  };
}

function mapExpense(row: Row): OperationalCost {
  return { id: text(row.id), date: text(row.date), category: text(row.category), amount: num(row.amount), description: text(row.description) };
}

function mapRawTransaction(row: Row): RawTransaction {
  return {
    id: text(row.id),
    date: text(row.date),
    type: text(row.type) as RawTransaction['type'],
    qty: num(row.qty),
    pricePerUnit: num(row.price_per_unit),
    totalCost: num(row.total_cost),
    afterQty: num(row.after_qty),
    afterAvgCost: num(row.after_avg_cost),
    refId: text(row.ref_id),
    notes: text(row.notes),
  };
}

export class ErpRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  private fail(error: { message: string } | null | undefined) {
    if (error) throw new Error(error.message);
  }

  async getSettings() {
    const { data, error } = await this.supabase.from('settings').select('*').is('deleted_at', null).limit(1).maybeSingle();
    this.fail(error);
    return mapSettings(data as Row | null);
  }

  async saveSettings(value: Settings) {
    const current = await this.supabase.from('settings').select('id').is('deleted_at', null).limit(1).maybeSingle();
    this.fail(current.error);
    const payload = {
      shop_name: value.shopName,
      logo: value.logo,
      currency: value.currency,
      default_transfer_price: value.defaultTransferPrice,
    };
    const result = current.data
      ? await this.supabase.from('settings').update(payload).eq('id', current.data.id)
      : await this.supabase.from('settings').insert(payload);
    this.fail(result.error);
  }

  async getStock(id: 'raw' | 'salted') {
    const { data, error } = await this.supabase.from('stock_states').select('qty,avg_cost').eq('id', id).maybeSingle();
    this.fail(error);
    return stock(data);
  }

  async getMasterData() {
    const [suppliers, customers, categories] = await Promise.all([
      this.supabase.from('suppliers').select('*').is('deleted_at', null).order('name'),
      this.supabase.from('customers').select('*').is('deleted_at', null).order('name'),
      this.supabase.from('expense_categories').select('id,name').is('deleted_at', null).order('name'),
    ]);
    this.fail(suppliers.error ?? customers.error ?? categories.error);
    return {
      suppliers: ((suppliers.data ?? []) as Row[]).map(mapSupplier),
      customers: ((customers.data ?? []) as Row[]).map(mapCustomer),
      categories: ((categories.data ?? []) as Row[]).map((row) => ({ id: text(row.id), name: text(row.name) })),
    };
  }

  async createSupplier(value: Omit<Supplier, 'id'>) {
    const { error } = await this.supabase.rpc('create_supplier', {
      p_name: value.name,
      p_address: value.address || null,
      p_phone: value.phone || null,
      p_notes: value.notes || null,
    });
    this.fail(error);
  }

  async updateSupplier(id: string, value: Omit<Supplier, 'id'>) {
    const { error } = await this.supabase
      .from('suppliers')
      .update({ name: value.name, address: value.address, phone: value.phone, notes: value.notes })
      .eq('id', id);
    this.fail(error);
  }

  async deleteSupplier(id: string) {
    const { error } = await this.supabase.from('suppliers').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    this.fail(error);
  }

  async createCustomer(value: Omit<Customer, 'id'>) {
    const { error } = await this.supabase.rpc('create_customer', {
      p_name: value.name,
      p_type: value.type,
      p_address: value.address || null,
      p_phone: value.phone || null,
      p_notes: value.notes || null,
    });
    this.fail(error);
  }

  async updateCustomer(id: string, value: Omit<Customer, 'id'>) {
    const { error } = await this.supabase
      .from('customers')
      .update({ name: value.name, type: value.type, address: value.address, phone: value.phone, notes: value.notes })
      .eq('id', id);
    this.fail(error);
  }

  async deleteCustomer(id: string) {
    const { error } = await this.supabase.from('customers').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    this.fail(error);
  }

  async createExpenseCategory(name: string) {
    const { error } = await this.supabase.rpc('create_expense_category', { p_name: name });
    this.fail(error);
  }

  async deleteExpenseCategory(id: string) {
    const { error } = await this.supabase.from('expense_categories').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    this.fail(error);
  }

  async getPurchases() {
    const [suppliers, purchases, rawStock] = await Promise.all([
      this.supabase.from('suppliers').select('*').is('deleted_at', null).order('name'),
      this.supabase.from('raw_egg_purchases').select('*').order('date', { ascending: false }),
      this.supabase.from('stock_states').select('qty,avg_cost').eq('id', 'raw').maybeSingle(),
    ]);
    this.fail(suppliers.error ?? purchases.error ?? rawStock.error);
    return {
      suppliers: ((suppliers.data ?? []) as Row[]).map(mapSupplier),
      purchases: ((purchases.data ?? []) as Row[]).map((row) => ({
        id: text(row.id),
        date: text(row.date),
        supplierId: text(row.supplier_id),
        qty: num(row.qty),
        pricePerUnit: num(row.price_per_unit),
        shippingCost: num(row.shipping_cost),
        totalCost: num(row.total_cost),
        notes: text(row.notes),
      })),
      rawStock: stock(rawStock.data),
    };
  }

  async recordPurchase(value: { date: string; supplierId: string; qty: number; pricePerUnit: number; shippingCost: number; notes: string }) {
    const { error } = await this.supabase.rpc('record_raw_egg_purchase', {
      p_date: value.date,
      p_supplier_id: value.supplierId,
      p_qty: value.qty,
      p_price_per_unit: value.pricePerUnit,
      p_shipping_cost: value.shippingCost,
      p_notes: value.notes || null,
    });
    this.fail(error);
  }

  async getFarmProduction() {
    const [settings, rows] = await Promise.all([
      this.getSettings(),
      this.supabase.from('farm_production').select('*').is('deleted_at', null).order('date', { ascending: false }),
    ]);
    this.fail(rows.error);
    return { settings, productions: ((rows.data ?? []) as Row[]).map(mapFarm) };
  }

  async recordFarmProduction(value: Omit<FarmProduction, 'id'>) {
    const { error } = await this.supabase.rpc('record_farm_production', {
      p_date: value.date,
      p_qty: value.qty,
      p_transfer_price: value.transferPrice,
      p_population: value.population,
      p_productive_count: value.productiveCount,
      p_culled_count: value.culledCount,
      p_mortality: value.mortality,
      p_feed_qty: value.feedQty,
      p_feed_cost: value.feedCost,
      p_notes: value.notes || null,
    });
    this.fail(error);
  }

  async getProductionBatches() {
    const [batches, rawStock, saltedStock] = await Promise.all([
      this.supabase.from('production_batches').select('*').is('deleted_at', null).order('date', { ascending: false }),
      this.supabase.from('stock_states').select('qty,avg_cost').eq('id', 'raw').maybeSingle(),
      this.supabase.from('stock_states').select('qty,avg_cost').eq('id', 'salted').maybeSingle(),
    ]);
    this.fail(batches.error ?? rawStock.error ?? saltedStock.error);
    return {
      batches: ((batches.data ?? []) as Row[]).map(mapBatch),
      rawStock: stock(rawStock.data),
      saltedStock: stock(saltedStock.data),
    };
  }

  async createProductionBatch(value: { date: string; qtyInput: number; saltCost: number; ashCost: number; plasticCost: number; packagingCost: number; laborCost: number; otherCost: number; notes: string }) {
    const { error } = await this.supabase.rpc('create_production_batch', {
      p_date: value.date,
      p_qty_input: value.qtyInput,
      p_salt_cost: value.saltCost,
      p_ash_cost: value.ashCost,
      p_plastic_cost: value.plasticCost,
      p_packaging_cost: value.packagingCost,
      p_labor_cost: value.laborCost,
      p_other_cost: value.otherCost,
      p_notes: value.notes || null,
    });
    this.fail(error);
  }

  async transitionBatch(id: string, status: BatchStatus) {
    const { error } = await this.supabase.rpc('transition_production_batch', { p_batch_id: id, p_new_status: status });
    this.fail(error);
  }

  async getSales() {
    const [customers, sales, rawStock, saltedStock] = await Promise.all([
      this.supabase.from('customers').select('*').is('deleted_at', null).order('name'),
      this.supabase.from('sales').select('*').is('deleted_at', null).order('date', { ascending: false }),
      this.supabase.from('stock_states').select('qty,avg_cost').eq('id', 'raw').maybeSingle(),
      this.supabase.from('stock_states').select('qty,avg_cost').eq('id', 'salted').maybeSingle(),
    ]);
    this.fail(customers.error ?? sales.error ?? rawStock.error ?? saltedStock.error);
    return {
      customers: ((customers.data ?? []) as Row[]).map(mapCustomer),
      sales: ((sales.data ?? []) as Row[]).map(mapSale),
      rawStock: stock(rawStock.data),
      saltedStock: stock(saltedStock.data),
    };
  }

  async recordSale(value: { date: string; customerId: string; eggType: EggType; qty: number; pricePerUnit: number; discount: number; shippingCost: number; notes: string }) {
    const { error } = await this.supabase.rpc('record_sale', {
      p_date: value.date,
      p_customer_id: value.customerId,
      p_egg_type: value.eggType,
      p_qty: value.qty,
      p_price_per_unit: value.pricePerUnit,
      p_discount: value.discount,
      p_shipping_cost: value.shippingCost,
      p_notes: value.notes || null,
    });
    this.fail(error);
  }

  async getExpenses() {
    const [categories, expenses] = await Promise.all([
      this.supabase.from('expense_categories').select('name').is('deleted_at', null).order('name'),
      this.supabase.from('operational_costs').select('*').is('deleted_at', null).order('date', { ascending: false }),
    ]);
    this.fail(categories.error ?? expenses.error);
    return {
      categories: ((categories.data ?? []) as Row[]).map((row) => text(row.name)),
      expenses: ((expenses.data ?? []) as Row[]).map(mapExpense),
    };
  }

  async recordExpense(value: { date: string; category: string; amount: number; description: string }) {
    const { error } = await this.supabase.rpc('record_operational_expense', {
      p_date: value.date,
      p_category: value.category,
      p_amount: value.amount,
      p_description: value.description || null,
    });
    this.fail(error);
  }

  async getReports(): Promise<DashboardSnapshot & { rawTransactions: RawTransaction[] }> {
    const [settings, rawStock, saltedStock, sales, expenses, batches, rawTransactions] = await Promise.all([
      this.getSettings(),
      this.getStock('raw'),
      this.getStock('salted'),
      this.supabase.from('sales').select('*').is('deleted_at', null).order('date', { ascending: false }),
      this.supabase.from('operational_costs').select('*').is('deleted_at', null).order('date', { ascending: false }),
      this.supabase.from('production_batches').select('*').is('deleted_at', null).order('date', { ascending: false }),
      this.supabase.from('raw_transactions').select('*').is('deleted_at', null).order('date', { ascending: false }),
    ]);
    this.fail(sales.error ?? expenses.error ?? batches.error ?? rawTransactions.error);
    return {
      settings,
      rawStock,
      saltedStock,
      sales: ((sales.data ?? []) as Row[]).map(mapSale),
      expenses: ((expenses.data ?? []) as Row[]).map(mapExpense),
      batches: ((batches.data ?? []) as Row[]).map(mapBatch),
      rawTransactions: ((rawTransactions.data ?? []) as Row[]).map(mapRawTransaction),
    };
  }

  async getDashboard(): Promise<DashboardSnapshot> {
    const report = await this.getReports();
    return {
      settings: report.settings,
      rawStock: report.rawStock,
      saltedStock: report.saltedStock,
      sales: report.sales.slice(0, 8),
      expenses: report.expenses.slice(0, 8),
      batches: report.batches.slice(0, 8),
    };
  }
}
