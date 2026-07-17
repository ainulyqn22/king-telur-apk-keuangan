import type { Customer, Sale, StockState } from '../../../types';
export interface RecordSaleCommand { date:string;customerId:string;eggType:'RAW'|'SALTED';qty:number;pricePerUnit:number;discount:number;shippingCost:number;notes:string; }
export interface SalesSnapshot { customers:Customer[];sales:Sale[];rawStock:StockState;saltedStock:StockState; }
export interface SalesRepository { getSnapshot():Promise<SalesSnapshot>;record(command:RecordSaleCommand):Promise<Sale>; }
