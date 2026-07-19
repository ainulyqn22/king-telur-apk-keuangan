import { recordSaleAction } from '../actions';
import { Field, Notice, PageHeader, Panel, SubmitButton, Table, Td, Th, inputClass } from '@/components/ui';
import { money, quantity, todayISO } from '@/lib/format';
import { erpRepository } from '@/services/erp-service';
import { requirePermission } from '@/services/auth-service';

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission('sales.manage');
  const params = await searchParams;
  const data = await (await erpRepository()).getSales();
  return (
    <>
      <PageHeader title="Catat Penjualan" description={`Stok segar ${quantity(data.rawStock.qty)}. Stok asin ${quantity(data.saltedStock.qty)}.`} />
      <Notice ok={params.ok} error={params.error} />
      <Panel title="Transaksi Penjualan">
        <form action={recordSaleAction} className="grid gap-3 md:grid-cols-6">
          <Field label="Tanggal"><input className={inputClass} type="date" name="date" defaultValue={todayISO()} required /></Field>
          <Field label="Customer"><select className={inputClass} name="customerId" required>{data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Produk"><select className={inputClass} name="eggType"><option value="RAW">Telur Segar</option><option value="SALTED">Telur Asin</option></select></Field>
          <Field label="Qty"><input className={inputClass} type="number" name="qty" min="1" required /></Field>
          <Field label="Harga"><input className={inputClass} type="number" name="pricePerUnit" min="1" required /></Field>
          <Field label="Diskon"><input className={inputClass} type="number" name="discount" min="0" defaultValue="0" /></Field>
          <Field label="Ongkir"><input className={inputClass} type="number" name="shippingCost" min="0" defaultValue="0" /></Field>
          <Field label="Catatan"><input className={inputClass} name="notes" /></Field>
          <div className="self-end"><SubmitButton>Catat</SubmitButton></div>
        </form>
      </Panel>
      <Panel title="Riwayat Penjualan">
        <Table><thead><tr><Th>Tanggal</Th><Th>Customer</Th><Th>Produk</Th><Th>Qty</Th><Th>Revenue</Th><Th>COGS</Th><Th>Profit</Th></tr></thead><tbody>
          {data.sales.map((row) => <tr key={row.id}><Td>{row.date}</Td><Td>{data.customers.find((c) => c.id === row.customerId)?.name ?? row.customerId}</Td><Td>{row.eggType}</Td><Td>{quantity(row.qty)}</Td><Td>{money(row.totalRevenue)}</Td><Td>{money(row.cogs)}</Td><Td>{money(row.grossProfit)}</Td></tr>)}
        </tbody></Table>
      </Panel>
    </>
  );
}
