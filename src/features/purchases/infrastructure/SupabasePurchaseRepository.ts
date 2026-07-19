import type { SupabaseClient } from '@supabase/supabase-js';
import type { RawEggTransaction, Supplier } from '@/shared/types';
import type { PurchaseSnapshot, RecordRawEggPurchaseCommand, RecordRawEggPurchaseResult } from '../domain/Purchase';
import type { PurchaseRepository } from '../domain/PurchaseRepository';

interface RpcRow {
  purchase_id: string;
  transaction_id: string;
  stock_qty: number;
  stock_avg_cost: number;
  total_cost: number;
}

export class SupabasePurchaseRepository implements PurchaseRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getSnapshot(): Promise<PurchaseSnapshot> {
    const [supplierResult, transactionResult, stockResult] = await Promise.all([
      this.client.from('suppliers').select('id,name,address,phone,notes').is('deleted_at', null).order('name'),
      this.client.from('raw_egg_purchases').select('*').order('date', { ascending: false }),
      this.client.from('stock_states').select('qty,avg_cost').eq('id', 'raw').maybeSingle(),
    ]);

    const error = supplierResult.error ?? transactionResult.error ?? stockResult.error;
    if (error) throw new Error(error.message);

    const suppliers = (supplierResult.data ?? []) as Supplier[];
    const purchases: RawEggTransaction[] = (transactionResult.data ?? []).map((row) => ({
      id: String(row.id), date: String(row.date), type: 'PURCHASE', qty: Number(row.qty),
      pricePerUnit: Number(row.price_per_unit), totalCost: Number(row.total_cost),
      afterQty: 0, afterAvgCost: 0,
      refId: String(row.supplier_id), notes: String(row.notes ?? ''),
    }));

    return {
      suppliers,
      purchases,
      stock: { qty: Number(stockResult.data?.qty ?? 0), avgCost: Number(stockResult.data?.avg_cost ?? 0) },
    };
  }

  async recordRawEggPurchase(command: RecordRawEggPurchaseCommand): Promise<RecordRawEggPurchaseResult> {
    const { data, error } = await this.client.rpc('record_raw_egg_purchase', {
      p_date: command.date,
      p_supplier_id: command.supplierId,
      p_qty: command.qty,
      p_price_per_unit: command.pricePerUnit,
      p_shipping_cost: command.shippingCost,
      p_notes: command.notes || null,
    });
    if (error) throw new Error(error.message);
    const row = (data as RpcRow[] | null)?.[0];
    if (!row) throw new Error('Database did not return the recorded purchase');
    return {
      purchaseId: row.purchase_id,
      transactionId: row.transaction_id,
      stock: { qty: Number(row.stock_qty), avgCost: Number(row.stock_avg_cost) },
      totalCost: Number(row.total_cost),
    };
  }
}
