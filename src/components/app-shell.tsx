'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { navigationFor } from '@/services/auth-service';
import { logoutAction } from '@/app/(protected)/actions';

type NavItem = ReturnType<typeof navigationFor>[number];

export function AppShell({ children, nav, shopName, userName }: { children: React.ReactNode; nav: NavItem[]; shopName: string; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sidebar = (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-slate-950 text-slate-300">
      <div className="border-b border-slate-800 p-4">
        <div className="text-sm font-extrabold uppercase text-white">{shopName}</div>
        <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-sky-400">ERP Peternakan Bebek</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block border-l-4 px-4 py-2.5 text-xs font-bold transition ${active ? 'border-indigo-500 bg-slate-900 text-indigo-300' : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <form action={logoutAction} className="border-t border-slate-800 p-4">
        <div className="mb-3 truncate text-xs text-slate-500">{userName}</div>
        <button className="w-full rounded-md border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-900">Logout</button>
      </form>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <div className="hidden lg:block">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-50 flex bg-slate-950/60 lg:hidden">
          {sidebar}
          <button className="m-4 h-10 w-10 rounded-md bg-white text-slate-900" onClick={() => setOpen(false)} aria-label="Close navigation">
            <X className="mx-auto h-5 w-5" />
          </button>
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
          <button className="rounded-md border border-slate-200 p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto text-xs font-bold text-slate-500">Server-rendered Supabase session</div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
