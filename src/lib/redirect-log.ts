import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Role } from '@/types/rbac';

type RedirectLog = {
  pathname?: string;
  destination: string;
  reason: string;
  userId?: string | null;
  profileRole?: Role | 'unknown' | null;
};

async function inferPathname() {
  try {
    const headerStore = await headers();
    const direct = headerStore.get('next-url') ?? headerStore.get('x-next-url') ?? headerStore.get('x-invoke-path') ?? headerStore.get('x-matched-path');
    if (direct) return direct;
    const referer = headerStore.get('referer');
    if (referer) return new URL(referer).pathname;
  } catch {
    return 'unknown';
  }
  return 'unknown';
}

export async function logServerRedirect({ pathname, destination, reason, userId, profileRole }: RedirectLog) {
  let resolvedUserId = userId ?? null;
  let resolvedRole = profileRole ?? null;

  if (!resolvedUserId || !resolvedRole) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getUser();
      resolvedUserId = resolvedUserId ?? data.user?.id ?? null;
      if (!resolvedRole && data.user) {
        const profile = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
        resolvedRole = (profile.data?.role as Role | undefined) ?? 'unknown';
      }
    } catch {
      resolvedRole = resolvedRole ?? 'unknown';
    }
  }

  console.warn(
    '[redirect]',
    JSON.stringify({
      pathname: pathname ?? (await inferPathname()),
      authenticatedUserId: resolvedUserId ?? 'anonymous',
      profileRole: resolvedRole ?? 'unknown',
      destination,
      reason,
    }),
  );
}
