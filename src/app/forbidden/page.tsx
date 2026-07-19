import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-extrabold text-slate-950">Access denied</h1>
        <p className="mt-2 text-sm text-slate-500">Your account does not have permission to open this module.</p>
        <Link href="/dashboard" className="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
