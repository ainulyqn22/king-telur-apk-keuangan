import { recordExpenseAction } from '../actions';
import { Field, Notice, PageHeader, Panel, SubmitButton, Table, Td, Th, inputClass } from '@/components/ui';
import { money, todayISO } from '@/lib/format';
import { erpRepository } from '@/services/erp-service';
import { requirePermission } from '@/services/auth-service';

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission('expenses.manage');
  const params = await searchParams;
  const data = await (await erpRepository()).getExpenses();
  return (
    <>
      <PageHeader title="Biaya Operasional" description="Biaya dicatat append-only agar laporan dan audit tetap konsisten." />
      <Notice ok={params.ok} error={params.error} />
      <Panel title="Catat Biaya">
        <form action={recordExpenseAction} className="grid gap-3 md:grid-cols-5">
          <Field label="Tanggal"><input className={inputClass} type="date" name="date" defaultValue={todayISO()} required /></Field>
          <Field label="Kategori"><select className={inputClass} name="category">{data.categories.map((category) => <option key={category}>{category}</option>)}</select></Field>
          <Field label="Jumlah"><input className={inputClass} type="number" name="amount" min="1" required /></Field>
          <Field label="Deskripsi"><input className={inputClass} name="description" /></Field>
          <div className="self-end"><SubmitButton>Catat</SubmitButton></div>
        </form>
      </Panel>
      <Panel title="Riwayat Biaya">
        <Table><thead><tr><Th>Tanggal</Th><Th>Kategori</Th><Th>Jumlah</Th><Th>Deskripsi</Th></tr></thead><tbody>
          {data.expenses.map((row) => <tr key={row.id}><Td>{row.date}</Td><Td>{row.category}</Td><Td>{money(row.amount)}</Td><Td>{row.description}</Td></tr>)}
        </tbody></Table>
      </Panel>
    </>
  );
}
