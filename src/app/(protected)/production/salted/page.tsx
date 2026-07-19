import { createProductionBatchAction, transitionBatchAction } from '../../actions';
import { Field, Notice, PageHeader, Panel, SubmitButton, Table, Td, Th, inputClass } from '@/components/ui';
import { money, quantity, todayISO } from '@/lib/format';
import { erpRepository } from '@/services/erp-service';
import { requirePermission } from '@/services/auth-service';
import type { BatchStatus } from '@/types/erp';

function nextStatus(status: BatchStatus) {
  if (status === 'Pemeraman') return 'Siap Panen';
  if (status === 'Siap Panen') return 'Siap Dijual';
  if (status === 'Siap Dijual') return 'Selesai';
  return null;
}

export default async function SaltedProductionPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission('production.manage');
  const params = await searchParams;
  const data = await (await erpRepository()).getProductionBatches();
  return (
    <>
      <PageHeader title="Pemrosesan Telur Asin" description={`Stok segar ${quantity(data.rawStock.qty)}. Stok asin siap jual ${quantity(data.saltedStock.qty)}.`} />
      <Notice ok={params.ok} error={params.error} />
      <Panel title="Buat Batch">
        <form action={createProductionBatchAction} className="grid gap-3 md:grid-cols-5">
          <Field label="Tanggal"><input className={inputClass} type="date" name="date" defaultValue={todayISO()} required /></Field>
          <Field label="Qty Input"><input className={inputClass} type="number" name="qtyInput" min="1" required /></Field>
          <Field label="Garam"><input className={inputClass} type="number" name="saltCost" min="0" defaultValue="0" /></Field>
          <Field label="Abu"><input className={inputClass} type="number" name="ashCost" min="0" defaultValue="0" /></Field>
          <Field label="Plastik"><input className={inputClass} type="number" name="plasticCost" min="0" defaultValue="0" /></Field>
          <Field label="Kemasan"><input className={inputClass} type="number" name="packagingCost" min="0" defaultValue="0" /></Field>
          <Field label="Tenaga Kerja"><input className={inputClass} type="number" name="laborCost" min="0" defaultValue="0" /></Field>
          <Field label="Lainnya"><input className={inputClass} type="number" name="otherCost" min="0" defaultValue="0" /></Field>
          <Field label="Catatan"><input className={inputClass} name="notes" /></Field>
          <div className="self-end"><SubmitButton>Buat Batch</SubmitButton></div>
        </form>
      </Panel>
      <Panel title="Batch Produksi">
        <Table><thead><tr><Th>Batch</Th><Th>Tanggal</Th><Th>Panen</Th><Th>Status</Th><Th>Qty</Th><Th>Total Cost</Th><Th>Aksi</Th></tr></thead><tbody>
          {data.batches.map((row) => {
            const next = nextStatus(row.status);
            return <tr key={row.id}><Td>{row.batchNo}</Td><Td>{row.date}</Td><Td>{row.harvestDate}</Td><Td>{row.status}</Td><Td>{quantity(row.qtyInput)}</Td><Td>{money(row.totalCost)}</Td><Td>{next ? <form action={transitionBatchAction}><input type="hidden" name="id" value={row.id} /><input type="hidden" name="status" value={next} /><SubmitButton>{next}</SubmitButton></form> : 'Selesai'}</Td></tr>;
          })}
        </tbody></Table>
      </Panel>
    </>
  );
}
