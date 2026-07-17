import type { SupabaseClient } from '@supabase/supabase-js';
import type { BatchStatus, ProductionBatch } from '../../../types';
import type { CreateProductionBatchCommand, ProductionBatchRepository, ProductionBatchSnapshot } from '../domain/ProductionBatchRepository';

function mapBatch(row: Record<string, unknown>): ProductionBatch {
  return { id:String(row.id),batchNo:String(row.batch_no),date:String(row.date),qtyInput:Number(row.qty_input),
    status:row.status as BatchStatus,rawEggCost:Number(row.raw_egg_cost),saltCost:Number(row.salt_cost),
    ashCost:Number(row.ash_cost),plasticCost:Number(row.plastic_cost),packagingCost:Number(row.packaging_cost),
    laborCost:Number(row.labor_cost),otherCost:Number(row.other_cost),totalCost:Number(row.total_cost),
    costPerUnit:Number(row.cost_per_unit),harvestDate:String(row.harvest_date),notes:typeof row.notes==='string'?row.notes:'' };
}
export class SupabaseProductionBatchRepository implements ProductionBatchRepository {
  constructor(private readonly client: SupabaseClient) {}
  async getSnapshot(): Promise<ProductionBatchSnapshot> {
    const [batches,stock]=await Promise.all([
      this.client.from('production_batches').select('*').is('deleted_at',null).order('date',{ascending:false}),
      this.client.from('stock_states').select('qty,avg_cost').eq('id','raw').maybeSingle(),
    ]);
    const error=batches.error??stock.error; if(error) throw new Error(error.message);
    return { batches:(batches.data??[]).map(mapBatch), rawStock:{qty:Number(stock.data?.qty??0),avgCost:Number(stock.data?.avg_cost??0)} };
  }
  async create(command: CreateProductionBatchCommand): Promise<ProductionBatch> {
    const {data,error}=await this.client.rpc('create_production_batch',{
      p_date:command.date,p_qty_input:command.qtyInput,p_salt_cost:command.saltCost,p_ash_cost:command.ashCost,
      p_plastic_cost:command.plasticCost,p_packaging_cost:command.packagingCost,p_labor_cost:command.laborCost,
      p_other_cost:command.otherCost,p_notes:command.notes||null,
    });
    if(error) throw new Error(error.message); const row=(data as Record<string,unknown>[]|null)?.[0];
    if(!row) throw new Error('Database did not return the production batch'); return mapBatch(row);
  }
  async transition(id: string,status: BatchStatus): Promise<ProductionBatch> {
    const {data,error}=await this.client.rpc('transition_production_batch',{p_batch_id:id,p_new_status:status});
    if(error) throw new Error(error.message); const row=(data as Record<string,unknown>[]|null)?.[0];
    if(!row) throw new Error('Database did not return the production batch'); return mapBatch(row);
  }
}
