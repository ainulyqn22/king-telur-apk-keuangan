import { saveSettingsAction } from '../actions';
import { Field, Notice, PageHeader, Panel, SubmitButton, inputClass } from '@/components/ui';
import { erpRepository } from '@/services/erp-service';
import { requirePermission } from '@/services/auth-service';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission('settings.manage');
  const params = await searchParams;
  const settings = await (await erpRepository()).getSettings();
  return (
    <>
      <PageHeader title="Pengaturan Sistem" description="Owner dan Admin memiliki akses penuh untuk mengelola pengaturan dan data operasional." />
      <Notice ok={params.ok} error={params.error} />
      <Panel title="Profil Bisnis">
        <form action={saveSettingsAction} className="grid max-w-3xl gap-3 md:grid-cols-2">
          <Field label="Nama Bisnis"><input className={inputClass} name="shopName" defaultValue={settings.shopName} required /></Field>
          <Field label="Mata Uang"><input className={inputClass} name="currency" defaultValue={settings.currency} required /></Field>
          <Field label="Harga Transfer Default"><input className={inputClass} type="number" name="defaultTransferPrice" min="0" defaultValue={settings.defaultTransferPrice} /></Field>
          <Field label="Logo URL/Base64"><input className={inputClass} name="logo" defaultValue={settings.logo} /></Field>
          <div className="self-end"><SubmitButton>Simpan</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
