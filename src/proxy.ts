import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';
import type { Permission, Role } from '@/types/rbac';
import { can, normalizeRole } from '@/types/rbac';

const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/auth/callback', '/auth/confirm'];

const protectedPrefixes: Array<{ prefix: string; permission: Permission }> = [
  { prefix: '/master-data', permission: 'inventory.manage' },
  { prefix: '/purchases', permission: 'purchases.manage' },
  { prefix: '/production', permission: 'production.manage' },
  { prefix: '/sales', permission: 'sales.manage' },
  { prefix: '/expenses', permission: 'expenses.manage' },
  { prefix: '/reports', permission: 'reports.read' },
  { prefix: '/analytics', permission: 'reports.read' },
  { prefix: '/settings', permission: 'settings.manage' },
  { prefix: '/users', permission: 'users.manage' },
  { prefix: '/api', permission: 'dashboard.read' },
];

function logProxyRedirect(input: {
  pathname: string;
  destination: URL;
  reason: string;
  userId?: string | null;
  profileRole?: string | null;
}) {
  console.warn(
    '[redirect]',
    JSON.stringify({
      pathname: input.pathname,
      authenticatedUserId: input.userId ?? 'anonymous',
      profileRole: input.profileRole ?? 'unknown',
      destination: input.destination.toString(),
      reason: input.reason,
    }),
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const { supabase, response } = createSupabaseMiddlewareClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let profileRole: string | null = null;
  let profilePermissions: Permission[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role,permissions')
      .eq('id', user.id)
      .maybeSingle();
    profileRole = String(profile?.role ?? 'Employee');
    profilePermissions = (profile?.permissions ?? []) as Permission[];
  }

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    if (user && pathname === '/login') {
      const destination = new URL('/dashboard', request.url);
      logProxyRedirect({
        pathname,
        destination,
        reason: 'authenticated user requested login page',
        userId: user.id,
        profileRole,
      });
      return NextResponse.redirect(destination);
    }
    return response();
  }

  if (!user) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    logProxyRedirect({
      pathname,
      destination: url,
      reason: 'protected route requested without authenticated user',
      userId: null,
      profileRole: 'unknown',
    });
    return NextResponse.redirect(url);
  }

  const required = protectedPrefixes.find((item) => pathname.startsWith(item.prefix));
  if (required) {
    const allowed = can(
      {
        id: user.id,
        fullName: '',
        role: normalizeRole(profileRole),
        permissions: profilePermissions,
      },
      required.permission,
    );
    if (!allowed) {
      const destination = new URL('/forbidden', request.url);
      logProxyRedirect({
        pathname,
        destination,
        reason: `missing permission: ${required.permission}`,
        userId: user.id,
        profileRole,
      });
      return NextResponse.redirect(destination);
    }
  }

  return response();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
