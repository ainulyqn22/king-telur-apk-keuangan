import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5 flex flex-col gap-1">
      <h1 className="text-lg font-extrabold tracking-tight text-slate-950">{title}</h1>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

export function Notice({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div className={`mb-4 rounded-md border px-4 py-3 text-sm font-semibold ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
      {error ?? ok}
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5 border-y border-slate-200 bg-white px-5 py-4 shadow-sm sm:rounded-lg sm:border">
      <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

export function SubmitButton({ children = 'Simpan', ...props }: { children?: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className="inline-flex min-h-10 items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700">
      {children}
    </button>
  );
}

export function DangerButton({ children = 'Hapus', ...props }: { children?: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className="inline-flex min-h-9 items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
      {children}
    </button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{children}</div>;
}

export function Table({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-md border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm">{children}</table></div>;
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">{children}</th>;
}

export function Td({ children }: { children: ReactNode }) {
  return <td className="border-b border-slate-100 px-3 py-2 align-top text-slate-700">{children}</td>;
}

export function CardLink({ href, title, value }: { href: string; title: string; value: string }) {
  return (
    <Link href={href} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">{title}</span>
      <span className="mt-2 block text-xl font-extrabold text-slate-950">{value}</span>
    </Link>
  );
}
