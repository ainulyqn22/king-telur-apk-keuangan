import { loginAction } from './actions';
import { Field, Notice, SubmitButton, inputClass } from '@/components/ui';

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-extrabold text-slate-950">HouseERP Login</h1>
        <p className="mt-1 text-sm text-slate-500">Masuk dengan akun Supabase Auth.</p>
        <Notice ok={params.ok} error={params.error} />
        <form action={loginAction} className="mt-5 grid gap-4">
          <input type="hidden" name="next" value={params.next ?? '/dashboard'} />
          <Field label="Email">
            <input className={inputClass} name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Password">
            <input className={inputClass} name="password" type="password" required minLength={8} autoComplete="current-password" />
          </Field>
          <SubmitButton>Login</SubmitButton>
        </form>
        <a href="/forgot-password" className="mt-4 block text-sm font-bold text-indigo-700">Forgot password?</a>
      </section>
    </main>
  );
}
