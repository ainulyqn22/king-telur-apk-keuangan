import { PageHeader, Panel, Table, Td, Th } from '@/components/ui';
import { money, quantity } from '@/lib/format';
import { buildFinancialSummary, erpRepository } from '@/services/erp-service';
import { requirePermission } from '@/services/auth-service';

export default async function ReportsPage() {
  await requirePermission('reports.read');
  const data = await (await erpRepository()).getReports();
  const summary = buildFinancialSummary(data);
  const expensesByCategory = data.expenses.reduce<Record<string, number>>((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + row.amount;
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Laporan Keuangan & Stok" description="Laporan dihitung server-side dari data Supabase terbaru." />
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Panel title="Revenue"><div className="text-2xl font-extrabold">{money(summary.revenue, data.settings.currency)}</div></Panel>
        <Panel title="Gross Profit"><div className="text-2xl font-extrabold">{money(summary.grossProfit, data.settings.currency)}</div></Panel>
        <Panel title="Net Profit"><div className="text-2xl font-extrabold">{money(summary.netProfit, data.settings.currency)}</div></Panel>
      </div>
      <Panel title="Valuasi Stok">
        <Table><thead><tr><Th>Produk</Th><Th>Qty</Th><Th>HPP</Th><Th>Nilai</Th></tr></thead><tbody>
          <tr><Td>Telur Segar</Td><Td>{quantity(data.rawStock.qty)}</Td><Td>{money(data.rawStock.avgCost)}</Td><Td>{money(data.rawStock.qty * data.rawStock.avgCost)}</Td></tr>
          <tr><Td>Telur Asin</Td><Td>{quantity(data.saltedStock.qty)}</Td><Td>{money(data.saltedStock.avgCost)}</Td><Td>{money(data.saltedStock.qty * data.saltedStock.avgCost)}</Td></tr>
        </tbody></Table>
      </Panel>
      <Panel title="Biaya per Kategori">
        <Table><thead><tr><Th>Kategori</Th><Th>Total</Th></tr></thead><tbody>
          {Object.entries(expensesByCategory).map(([category, total]) => <tr key={category}><Td>{category}</Td><Td>{money(total, data.settings.currency)}</Td></tr>)}
        </tbody></Table>
      </Panel>
    </>
  );
}
