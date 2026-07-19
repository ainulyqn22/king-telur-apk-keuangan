import type { SupabaseClient } from '@supabase/supabase-js';
import type { Sale } from '@/shared/types';
import type { RecordSaleCommand, SalesRepository, SalesSnapshot } from '../domain/SalesRepository';
function mapSale(row:Record<string,unknown>):Sale{return{id:String(row.id),date:String(row.date),customerId:String(row.customer_id),eggType:row.egg_type as 'RAW'|'SALTED',qty:Number(row.qty),pricePerUnit:Number(row.price_per_unit),discount:Number(row.discount),shippingCost:Number(row.shipping_cost),totalRevenue:Number(row.total_revenue),cogs:Number(row.cogs),grossProfit:Number(row.gross_profit),notes:typeof row.notes==='string'?row.notes:''};}
export class SupabaseSalesRepository implements SalesRepository{
  constructor(private readonly client:SupabaseClient){}
  async getSnapshot():Promise<SalesSnapshot>{
    const [customers,sales,stocks]=await Promise.all([
      this.client.from('customers').select('id,name,type,address,phone,notes').is('deleted_at',null).order('name'),
      this.client.from('sales').select('*').is('deleted_at',null).order('date',{ascending:false}),
      this.client.from('stock_states').select('id,qty,avg_cost').in('id',['raw','salted']).is('deleted_at',null),
    ]);const error=customers.error??sales.error??stocks.error;if(error)throw new Error(error.message);
    const stock=(id:string)=>{const row=(stocks.data??[]).find(value=>value.id===id);return{qty:Number(row?.qty??0),avgCost:Number(row?.avg_cost??0)};};
    return{customers:customers.data??[],sales:(sales.data??[]).map(mapSale),rawStock:stock('raw'),saltedStock:stock('salted')};
  }
  async record(command:RecordSaleCommand):Promise<Sale>{const{data,error}=await this.client.rpc('record_sale',{p_date:command.date,p_customer_id:command.customerId,p_egg_type:command.eggType,p_qty:command.qty,p_price_per_unit:command.pricePerUnit,p_discount:command.discount,p_shipping_cost:command.shippingCost,p_notes:command.notes||null});if(error)throw new Error(error.message);const row=(data as Record<string,unknown>[]|null)?.[0];if(!row)throw new Error('Database did not return the sale');return mapSale(row);}
}
