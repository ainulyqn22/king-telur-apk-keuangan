import { percent, money, quantity } from '@/lib/format';
import { PageHeader, Panel, Table, Td, Th } from '@/components/ui';
import { erpRepository } from '@/services/erp-service';
import { requirePermission } from '@/services/auth-service';

function stats(sales: Array<{ date: string; qty: number; totalRevenue: number; grossProfit: number }>, days: number) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  const rows = sales.filter((sale) => {
    const value = new Date(`${sale.date}T00:00:00`).getTime();
    return value >= start.getTime() && value <= end.getTime();
  });
  return {
    qty: rows.reduce((sum, row) => sum + row.qty, 0),
    revenue: rows.reduce((sum, row) => sum + row.totalRevenue, 0),
    profit: rows.reduce((sum, row) => sum + row.grossProfit, 0),
    count: rows.length,
  };
}

export default async function AnalyticsPage() {
  await requirePermission('reports.read');
  const data = await (await erpRepository()).getReports();
  const seven = stats(data.sales, 7);
  const thirty = stats(data.sales, 30);
  const conversion = thirty.revenue > 0 ? (thirty.profit / thirty.revenue) * 100 : 0;
  return (
    <>
      <PageHeader title="Analisis Tren Penjualan" description="Analisis sederhana dihitung saat render dari data penjualan aktual." />
      <div className="grid gap-3 md:grid-cols-3">
        <Panel title="7 Hari Qty"><div className="text-2xl font-extrabold">{quantity(seven.qty)}</div></Panel>
        <Panel title="30 Hari Revenue"><div className="text-2xl font-extrabold">{money(thirty.revenue, data.settings.currency)}</div></Panel>
        <Panel title="Margin 30 Hari"><div className="text-2xl font-extrabold">{percent(conversion)}</div></Panel>
      </div>
      <Panel title="Penjualan Terbaru">
        <Table><thead><tr><Th>Tanggal</Th><Th>Produk</Th><Th>Qty</Th><Th>Revenue</Th><Th>Profit</Th></tr></thead><tbody>
          {data.sales.slice(0, 20).map((row) => <tr key={row.id}><Td>{row.date}</Td><Td>{row.eggType}</Td><Td>{quantity(row.qty)}</Td><Td>{money(row.totalRevenue)}</Td><Td>{money(row.grossProfit)}</Td></tr>)}
        </tbody></Table>
      </Panel>
    </>
  );
}
