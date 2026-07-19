import { z } from 'zod';
import type { RecordSaleCommand, SalesRepository } from '../domain/SalesRepository';
const schema=z.object({date:z.iso.date(),customerId:z.string().min(1),eggType:z.enum(['RAW','SALTED']),qty:z.number().positive(),pricePerUnit:z.number().positive(),discount:z.number().nonnegative(),shippingCost:z.number().nonnegative(),notes:z.string().max(2_000)}).refine(value=>value.discount<=value.qty*value.pricePerUnit+value.shippingCost,{message:'Discount exceeds sale value',path:['discount']});
export class SalesService { constructor(private readonly repository:SalesRepository){} getSnapshot(){return this.repository.getSnapshot();} record(command:RecordSaleCommand){return this.repository.record(schema.parse(command));} }
