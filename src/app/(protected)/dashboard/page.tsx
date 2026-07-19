import { CardLink, PageHeader, Panel, Table, Td, Th } from '@/components/ui';
import { money, quantity } from '@/lib/format';
import { erpRepository, buildFinancialSummary } from '@/services/erp-service';
import { requirePermission } from '@/services/auth-service';

export default async function DashboardPage() {
  await requirePermission('dashboard.read');
  const data = await (await erpRepository()).getDashboard();
  const summary = buildFinancialSummary(data);

  return (
    <>
      <PageHeader title="Dashboard" description="Ringkasan stok, produksi, penjualan, dan profit dari database Supabase terbaru." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CardLink href="/purchases" title="Stok Telur Segar" value={quantity(data.rawStock.qty)} />
        <CardLink href="/production/salted" title="Stok Telur Asin" value={quantity(data.saltedStock.qty)} />
        <CardLink href="/reports" title="Revenue" value={money(summary.revenue, data.settings.currency)} />
        <CardLink href="/reports" title="Net Profit" value={money(summary.netProfit, data.settings.currency)} />
      </div>
      <Panel title="Batch Produksi Terbaru">
        <Table>
          <thead><tr><Th>Batch</Th><Th>Tanggal</Th><Th>Status</Th><Th>Qty</Th><Th>HPP</Th></tr></thead>
          <tbody>
            {data.batches.map((row) => (
              <tr key={row.id}><Td>{row.batchNo}</Td><Td>{row.date}</Td><Td>{row.status}</Td><Td>{quantity(row.qtyInput)}</Td><Td>{money(row.costPerUnit, data.settings.currency)}</Td></tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
