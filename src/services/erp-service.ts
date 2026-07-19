import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ErpRepository } from '@/repositories/erp-repository';

export async function erpRepository() {
  noStore();
  return new ErpRepository(await createSupabaseServerClient());
}

export function buildFinancialSummary(data: {
  sales: Array<{ qty: number; totalRevenue: number; cogs: number; grossProfit: number }>;
  expenses: Array<{ amount: number; category: string }>;
  rawStock: { qty: number; avgCost: number };
  saltedStock: { qty: number; avgCost: number };
}) {
  const revenue = data.sales.reduce((sum, row) => sum + row.totalRevenue, 0);
  const cogs = data.sales.reduce((sum, row) => sum + row.cogs, 0);
  const grossProfit = revenue - cogs;
  const expenses = data.expenses.reduce((sum, row) => sum + row.amount, 0);
  const rawValue = data.rawStock.qty * data.rawStock.avgCost;
  const saltedValue = data.saltedStock.qty * data.saltedStock.avgCost;

  return {
    revenue,
    cogs,
    grossProfit,
    expenses,
    netProfit: grossProfit - expenses,
    inventoryValue: rawValue + saltedValue,
  };
}
