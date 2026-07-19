import { inviteUserAction } from '../actions';
import { Field, Notice, PageHeader, Panel, SubmitButton, inputClass } from '@/components/ui';
import { requirePermission } from '@/services/auth-service';
import { employeeAssignablePermissions } from '@/types/rbac';

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission('users.manage');
  const params = await searchParams;
  return (
    <>
      <PageHeader title="User Management" description="Undangan pengguna memakai Supabase Auth Admin API melalui server-only service role key." />
      <Notice ok={params.ok} error={params.error} />
      <Panel title="Invite User">
        <form action={inviteUserAction} className="grid max-w-3xl gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Email"><input className={inputClass} name="email" type="email" required /></Field>
            <Field label="Nama"><input className={inputClass} name="fullName" required /></Field>
            <Field label="Role"><select className={inputClass} name="role"><option>Employee</option><option>Admin</option><option>Owner</option></select></Field>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Employee Permissions</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {employeeAssignablePermissions.map((permission) => (
                <label key={permission} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm">
                  <input type="checkbox" name="permissions" value={permission} />
                  <span>{permission}</span>
                </label>
              ))}
            </div>
          </div>
          <SubmitButton>Kirim Undangan</SubmitButton>
        </form>
      </Panel>
    </>
  );
}
