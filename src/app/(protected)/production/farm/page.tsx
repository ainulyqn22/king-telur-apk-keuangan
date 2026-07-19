import { recordFarmProductionAction } from '../../actions';
import { Field, Notice, PageHeader, Panel, SubmitButton, Table, Td, Th, inputClass } from '@/components/ui';
import { money, quantity, todayISO } from '@/lib/format';
import { erpRepository } from '@/services/erp-service';
import { requirePermission } from '@/services/auth-service';

export default async function FarmProductionPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission('production.manage');
  const params = await searchParams;
  const data = await (await erpRepository()).getFarmProduction();
  return (
    <>
      <PageHeader title="Produksi Kandang Bebek" description="Produksi kandang menambah stok telur segar memakai harga transfer sebagai HPP masuk." />
      <Notice ok={params.ok} error={params.error} />
      <Panel title="Catat Produksi">
        <form action={recordFarmProductionAction} className="grid gap-3 md:grid-cols-5">
          <Field label="Tanggal"><input className={inputClass} type="date" name="date" defaultValue={todayISO()} required /></Field>
          <Field label="Qty Telur"><input className={inputClass} type="number" name="qty" min="1" required /></Field>
          <Field label="Harga Transfer"><input className={inputClass} type="number" name="transferPrice" min="1" defaultValue={data.settings.defaultTransferPrice} required /></Field>
          <Field label="Populasi"><input className={inputClass} type="number" name="population" min="1" required /></Field>
          <Field label="Produktif"><input className={inputClass} type="number" name="productiveCount" min="0" required /></Field>
          <Field label="Afkir"><input className={inputClass} type="number" name="culledCount" min="0" defaultValue="0" /></Field>
          <Field label="Mortalitas"><input className={inputClass} type="number" name="mortality" min="0" defaultValue="0" /></Field>
          <Field label="Pakan Kg"><input className={inputClass} type="number" name="feedQty" min="0" defaultValue="0" /></Field>
          <Field label="Biaya Pakan"><input className={inputClass} type="number" name="feedCost" min="0" defaultValue="0" /></Field>
          <div className="self-end"><SubmitButton>Catat</SubmitButton></div>
          <Field label="Catatan"><input className={inputClass} name="notes" /></Field>
        </form>
      </Panel>
      <Panel title="Riwayat Produksi">
        <Table><thead><tr><Th>Tanggal</Th><Th>Qty</Th><Th>Harga Transfer</Th><Th>Populasi</Th><Th>Produktif</Th><Th>Pakan</Th></tr></thead><tbody>
          {data.productions.map((row) => <tr key={row.id}><Td>{row.date}</Td><Td>{quantity(row.qty)}</Td><Td>{money(row.transferPrice)}</Td><Td>{row.population}</Td><Td>{row.productiveCount}</Td><Td>{row.feedQty} kg / {money(row.feedCost)}</Td></tr>)}
        </tbody></Table>
      </Panel>
    </>
  );
}
