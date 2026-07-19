function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function publicSupabaseUrl() {
  return required('NEXT_PUBLIC_SUPABASE_URL');
}

export function publicSupabaseKey() {
  return required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}

export function serviceRoleKey() {
  return required('SUPABASE_SERVICE_ROLE_KEY');
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}
