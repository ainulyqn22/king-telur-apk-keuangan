import { forgotPasswordAction } from '../login/actions';
import { Field, Notice, SubmitButton, inputClass } from '@/components/ui';

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-extrabold text-slate-950">Reset Password</h1>
        <Notice ok={params.ok} error={params.error} />
        <form action={forgotPasswordAction} className="mt-5 grid gap-4">
          <Field label="Email">
            <input className={inputClass} name="email" type="email" required autoComplete="email" />
          </Field>
          <SubmitButton>Kirim Link Reset</SubmitButton>
        </form>
      </section>
    </main>
  );
}
