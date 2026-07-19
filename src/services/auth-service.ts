import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Profile, Role, Permission } from '@/types/rbac';
import { can, normalizeRole, rolePermissions } from '@/types/rbac';
import { logServerRedirect } from '@/lib/redirect-log';

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
  permissions?: string[] | null;
};

const validPermissions = new Set<Permission>([
  'dashboard.read',
  'inventory.manage',
  'purchases.manage',
  'production.manage',
  'sales.manage',
  'expenses.manage',
  'reports.read',
  'settings.manage',
  'users.manage',
]);

function normalizePermissions(permissions: string[] | null | undefined): Permission[] {
  return (permissions ?? []).filter((permission): permission is Permission => validPermissions.has(permission as Permission));
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name ?? '',
    role: normalizeRole(row.role),
    permissions: normalizePermissions(row.permissions),
  };
}

function fallbackProfile(user: { id: string; email?: string | null }): Profile {
  return {
    id: user.id,
    fullName: user.email ?? '',
    role: 'Employee',
    permissions: ['dashboard.read'],
  };
}

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,role,permissions')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) {
    console.warn(
      '[auth-profile-fallback]',
      JSON.stringify({
        userId: user.id,
        reason: error ? `profile query failed: ${error.message}` : 'profile row missing',
        fallbackRole: 'Employee',
        fallbackPermissions: ['dashboard.read'],
      }),
    );
    return fallbackProfile(user);
  }
  return mapProfile(data);
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    await logServerRedirect({
      destination: '/login',
      reason: 'requireUser found no authenticated user',
      userId: null,
      profileRole: 'unknown',
    });
    redirect('/login');
  }
  return user;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) {
    await logServerRedirect({
      destination: '/login',
      reason: 'requireProfile found no authenticated user',
      userId: null,
      profileRole: 'unknown',
    });
    redirect('/login');
  }
  return profile;
}

export async function requirePermission(permission: Permission) {
  const profile = await requireProfile();
  if (!can(profile, permission)) {
    await logServerRedirect({
      destination: '/forbidden',
      reason: `missing permission: ${permission}`,
      userId: profile.id,
      profileRole: profile.role,
    });
    redirect('/forbidden');
  }
  return profile;
}

export function navigationFor(profile: Profile) {
  const allowed = rolePermissions(profile);
  return [
    { href: '/dashboard', label: 'Dashboard', permission: 'dashboard.read' as const },
    { href: '/master-data', label: 'Master Data', permission: 'inventory.manage' as const },
    { href: '/purchases', label: 'Purchases', permission: 'purchases.manage' as const },
    { href: '/production/farm', label: 'Farm Production', permission: 'production.manage' as const },
    { href: '/production/salted', label: 'Salted Production', permission: 'production.manage' as const },
    { href: '/sales', label: 'Sales', permission: 'sales.manage' as const },
    { href: '/expenses', label: 'Expenses', permission: 'expenses.manage' as const },
    { href: '/reports', label: 'Reports', permission: 'reports.read' as const },
    { href: '/settings', label: 'Settings', permission: 'settings.manage' as const },
    { href: '/users', label: 'Users', permission: 'users.manage' as const },
  ].filter((item) => allowed.has(item.permission));
}
