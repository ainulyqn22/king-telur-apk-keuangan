import { recordPurchaseAction } from '../actions';
import { Field, Notice, PageHeader, Panel, SubmitButton, Table, Td, Th, inputClass } from '@/components/ui';
import { money, quantity, todayISO } from '@/lib/format';
import { erpRepository } from '@/services/erp-service';
import { requirePermission } from '@/services/auth-service';

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission('purchases.manage');
  const params = await searchParams;
  const data = await (await erpRepository()).getPurchases();
  return (
    <>
      <PageHeader title="Pengadaan Telur Segar" description={`Stok segar saat ini ${quantity(data.rawStock.qty)} dengan HPP rata-rata ${money(data.rawStock.avgCost)}.`} />
      <Notice ok={params.ok} error={params.error} />
      <Panel title="Catat Pembelian">
        <form action={recordPurchaseAction} className="grid gap-3 md:grid-cols-6">
          <Field label="Tanggal"><input className={inputClass} type="date" name="date" defaultValue={todayISO()} required /></Field>
          <Field label="Supplier"><select className={inputClass} name="supplierId" required>{data.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></Field>
          <Field label="Qty"><input className={inputClass} type="number" name="qty" min="1" required /></Field>
          <Field label="Harga/Butir"><input className={inputClass} type="number" name="pricePerUnit" min="1" required /></Field>
          <Field label="Ongkir"><input className={inputClass} type="number" name="shippingCost" min="0" defaultValue="0" /></Field>
          <div className="self-end"><SubmitButton>Catat</SubmitButton></div>
          <Field label="Catatan"><input className={inputClass} name="notes" /></Field>
        </form>
      </Panel>
      <Panel title="Riwayat Pembelian">
        <Table><thead><tr><Th>Tanggal</Th><Th>Supplier</Th><Th>Qty</Th><Th>Harga</Th><Th>Ongkir</Th><Th>Total</Th></tr></thead><tbody>
          {data.purchases.map((row) => <tr key={row.id}><Td>{row.date}</Td><Td>{data.suppliers.find((supplier) => supplier.id === row.supplierId)?.name ?? row.supplierId}</Td><Td>{quantity(row.qty)}</Td><Td>{money(row.pricePerUnit)}</Td><Td>{money(row.shippingCost)}</Td><Td>{money(row.totalCost)}</Td></tr>)}
        </tbody></Table>
      </Panel>
    </>
  );
}
