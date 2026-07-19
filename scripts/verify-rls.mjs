import { readFileSync } from 'node:fs';

const migrationPath = new URL('../supabase/migrations/20260717000010_row_level_security.sql', import.meta.url);
const sql = readFileSync(migrationPath, 'utf8');

const tables = [
  'profiles',
  'settings',
  'suppliers',
  'customers',
  'expense_categories',
  'stock_states',
  'farm_production',
  'raw_transactions',
  'production_batches',
  'production_transactions',
  'sales',
  'operational_costs',
  'activity_logs',
  'audit_logs',
  'users',
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
  'sessions',
  'refresh_tokens',
  'login_history',
  'password_reset_tokens',
  'email_verifications',
];

const failures = [];

for (const table of tables) {
  const statement = `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`;
  if (!sql.includes(statement)) {
    failures.push(`RLS is not enabled for public.${table}`);
  }
}

const executableSql = sql
  .split('\n')
  .filter((line) => !line.trimStart().startsWith('--'))
  .join('\n');

if (/\banon\b/i.test(executableSql)) {
  failures.push('The policy migration grants or references the anon role');
}

const clientAuditWritePolicy = /CREATE\s+POLICY[\s\S]*?ON\s+public\.audit_logs\s+FOR\s+(?:INSERT|UPDATE|DELETE|ALL)\b/i;
if (clientAuditWritePolicy.test(executableSql)) {
  failures.push('audit_logs has a client write policy');
}

const allPolicies = [...executableSql.matchAll(/CREATE\s+POLICY\s+"[^"]+"([\s\S]*?);/gi)];
for (const [, body] of allPolicies) {
  if (/\sFOR\s+ALL\s/i.test(body) && !/\sWITH\s+CHECK\s*\(/i.test(body)) {
    failures.push(`FOR ALL policy is missing WITH CHECK:${body.split('\n')[0]}`);
  }
}

if (!/REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.check_user_role\(text\[\]\)\s+FROM\s+PUBLIC/i.test(executableSql)) {
  failures.push('check_user_role remains executable by PUBLIC');
}

if (failures.length > 0) {
  console.error('RLS verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`RLS verification passed for ${tables.length} tables.`);
