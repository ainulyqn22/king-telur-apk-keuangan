import type{OperationalCost}from'@/shared/types';
export interface RecordExpenseCommand{date:string;category:string;amount:number;description:string;}
export interface ExpenseSnapshot{categories:string[];expenses:OperationalCost[];}
export interface ExpenseRepository{getSnapshot():Promise<ExpenseSnapshot>;record(command:RecordExpenseCommand):Promise<OperationalCost>;createCategory(name:string):Promise<string>;}
