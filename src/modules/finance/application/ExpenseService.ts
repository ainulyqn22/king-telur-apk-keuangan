import{z}from'zod';
import type{ExpenseRepository,RecordExpenseCommand}from'../domain/ExpenseRepository';
const expenseSchema=z.object({date:z.iso.date(),category:z.string().min(1).max(100),amount:z.number().positive(),description:z.string().max(2_000)});
const categorySchema=z.string().trim().min(1).max(100);
export class ExpenseService{constructor(private readonly repository:ExpenseRepository){}getSnapshot(){return this.repository.getSnapshot();}record(command:RecordExpenseCommand){return this.repository.record(expenseSchema.parse(command));}createCategory(name:string){return this.repository.createCategory(categorySchema.parse(name));}}
