export type Role = 'Owner' | 'Admin' | 'Employee';

export type Permission =
  | 'dashboard.read'
  | 'inventory.manage'
  | 'purchases.manage'
  | 'production.manage'
  | 'sales.manage'
  | 'expenses.manage'
  | 'reports.read'
  | 'settings.manage'
  | 'users.manage';

export interface Profile {
  id: string;
  fullName: string;
  role: Role;
  permissions: Permission[];
}

export const allPermissions: Permission[] = [
  'dashboard.read',
  'inventory.manage',
  'purchases.manage',
  'production.manage',
  'sales.manage',
  'expenses.manage',
  'reports.read',
  'settings.manage',
  'users.manage',
];

export const operationalPermissions: Permission[] = [
  'dashboard.read',
  'inventory.manage',
  'purchases.manage',
  'production.manage',
  'sales.manage',
  'expenses.manage',
  'reports.read',
];

export const employeeAssignablePermissions: Permission[] = operationalPermissions;

export function normalizeRole(role: string | null | undefined): Role {
  const normalized = String(role ?? '').trim().toLowerCase();
  if (normalized === 'owner') return 'Owner';
  if (normalized === 'admin') return 'Admin';
  return 'Employee';
}

export function rolePermissions(profile: Profile | null): Set<Permission> {
  if (!profile) return new Set();
  if (profile.role === 'Owner') return new Set(allPermissions);
  if (profile.role === 'Admin') return new Set(allPermissions);
  const assignable = new Set(employeeAssignablePermissions);
  return new Set<Permission>(['dashboard.read', ...profile.permissions.filter((permission) => assignable.has(permission))]);
}

export function can(profile: Profile | null, permission: Permission): boolean {
  return rolePermissions(profile).has(permission);
}
