import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logServerRedirect } from '@/lib/redirect-log';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = url.searchParams.get('next') ?? '/dashboard';
  const destination = new URL(next.startsWith('/') ? next : '/dashboard', request.url);
  let userId: string | null = null;

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'invite' | 'recovery' | 'email_change' | 'magiclink',
    });
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }

  await logServerRedirect({
    pathname: url.pathname,
    destination: destination.toString(),
    reason: tokenHash && type ? 'auth confirmation verified otp' : 'auth confirmation missing token',
    userId,
  });
  return NextResponse.redirect(destination);
}
