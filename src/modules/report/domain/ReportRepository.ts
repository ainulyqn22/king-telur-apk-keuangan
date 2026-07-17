import type{Customer,FarmProduction,OperationalCost,ProductionBatch,RawEggTransaction,Sale,SaltedEggTransaction,Settings,StockState,Supplier}from'../../../types';
export interface ReportSnapshot{settings:Settings;suppliers:Supplier[];customers:Customer[];rawTransactions:RawEggTransaction[];saltedTransactions:SaltedEggTransaction[];farmProductions:FarmProduction[];batches:ProductionBatch[];sales:Sale[];expenses:OperationalCost[];rawStock:StockState;saltedStock:StockState;}
export interface ReportRepository{getSnapshot():Promise<ReportSnapshot>;}
export type ReportPeriod='today'|'yesterday'|'week'|'month'|'year'|'custom';
export interface ReportQuery{period:ReportPeriod;customRange?:{start:string;end:string};supplierId:string;customerId:string;}
