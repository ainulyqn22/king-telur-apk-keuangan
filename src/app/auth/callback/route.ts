import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logServerRedirect } from '@/lib/redirect-log';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';
  const destination = new URL(next.startsWith('/') ? next : '/dashboard', request.url);
  let userId: string | null = null;

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }

  await logServerRedirect({
    pathname: url.pathname,
    destination: destination.toString(),
    reason: code ? 'auth callback exchanged code for session' : 'auth callback missing code',
    userId,
  });
  return NextResponse.redirect(destination);
}
