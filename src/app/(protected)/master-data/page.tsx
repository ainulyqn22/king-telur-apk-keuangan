import { createCustomerAction, createExpenseCategoryAction, createSupplierAction, deleteCustomerAction, deleteExpenseCategoryAction, deleteSupplierAction, updateCustomerAction, updateSupplierAction } from '../actions';
import { DangerButton, Field, Notice, PageHeader, Panel, SubmitButton, Table, Td, Th, inputClass } from '@/components/ui';
import { erpRepository } from '@/services/erp-service';
import { requirePermission } from '@/services/auth-service';

const customerTypes = ['Tengkulak', 'Distributor', 'Reseller', 'Retail', 'Customer Langsung'];

export default async function MasterDataPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission('inventory.manage');
  const params = await searchParams;
  const data = await (await erpRepository()).getMasterData();
  return (
    <>
      <PageHeader title="Master Data" description="Supplier, customer, dan kategori biaya dikelola server-side dengan RLS Supabase." />
      <Notice ok={params.ok} error={params.error} />
      <Panel title="Tambah Supplier">
        <form action={createSupplierAction} className="grid gap-3 md:grid-cols-5">
          <Field label="Nama"><input className={inputClass} name="name" required /></Field>
          <Field label="Alamat"><input className={inputClass} name="address" /></Field>
          <Field label="Telepon"><input className={inputClass} name="phone" /></Field>
          <Field label="Catatan"><input className={inputClass} name="notes" /></Field>
          <div className="self-end"><SubmitButton>Tambah</SubmitButton></div>
        </form>
      </Panel>
      <Panel title="Supplier">
        <Table>
          <thead><tr><Th>Nama</Th><Th>Alamat</Th><Th>Telepon</Th><Th>Catatan</Th><Th>Aksi</Th></tr></thead>
          <tbody>{data.suppliers.map((row) => <tr key={row.id}>
            <Td><form id={`supplier-${row.id}`} action={updateSupplierAction}><input type="hidden" name="id" value={row.id} /><input className={inputClass} name="name" defaultValue={row.name} required /></form></Td>
            <Td><input form={`supplier-${row.id}`} className={inputClass} name="address" defaultValue={row.address} /></Td>
            <Td><input form={`supplier-${row.id}`} className={inputClass} name="phone" defaultValue={row.phone} /></Td>
            <Td><input form={`supplier-${row.id}`} className={inputClass} name="notes" defaultValue={row.notes} /></Td>
            <Td><div className="flex gap-2"><SubmitButton form={`supplier-${row.id}`}>Update</SubmitButton><form action={deleteSupplierAction}><input type="hidden" name="id" value={row.id} /><DangerButton /></form></div></Td>
          </tr>)}</tbody>
        </Table>
      </Panel>
      <Panel title="Tambah Customer">
        <form action={createCustomerAction} className="grid gap-3 md:grid-cols-6">
          <Field label="Nama"><input className={inputClass} name="name" required /></Field>
          <Field label="Tipe"><select className={inputClass} name="type">{customerTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
          <Field label="Alamat"><input className={inputClass} name="address" /></Field>
          <Field label="Telepon"><input className={inputClass} name="phone" /></Field>
          <Field label="Catatan"><input className={inputClass} name="notes" /></Field>
          <div className="self-end"><SubmitButton>Tambah</SubmitButton></div>
        </form>
      </Panel>
      <Panel title="Customer">
        <Table>
          <thead><tr><Th>Nama</Th><Th>Tipe</Th><Th>Alamat</Th><Th>Telepon</Th><Th>Aksi</Th></tr></thead>
          <tbody>{data.customers.map((row) => <tr key={row.id}>
            <Td><form id={`customer-${row.id}`} action={updateCustomerAction}><input type="hidden" name="id" value={row.id} /><input className={inputClass} name="name" defaultValue={row.name} required /></form></Td>
            <Td><select form={`customer-${row.id}`} className={inputClass} name="type" defaultValue={row.type}>{customerTypes.map((type) => <option key={type}>{type}</option>)}</select></Td>
            <Td><input form={`customer-${row.id}`} className={inputClass} name="address" defaultValue={row.address} /></Td>
            <Td><input form={`customer-${row.id}`} className={inputClass} name="phone" defaultValue={row.phone} /></Td>
            <Td><div className="flex gap-2"><SubmitButton form={`customer-${row.id}`}>Update</SubmitButton><form action={deleteCustomerAction}><input type="hidden" name="id" value={row.id} /><DangerButton /></form></div></Td>
          </tr>)}</tbody>
        </Table>
      </Panel>
      <Panel title="Kategori Biaya">
        <form action={createExpenseCategoryAction} className="mb-4 flex max-w-lg gap-2">
          <input className={inputClass} name="name" required />
          <SubmitButton>Tambah</SubmitButton>
        </form>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{data.categories.map((row) => <form key={row.id} action={deleteExpenseCategoryAction} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm"><span>{row.name}</span><input type="hidden" name="id" value={row.id} /><DangerButton /></form>)}</div>
      </Panel>
    </>
  );
}
