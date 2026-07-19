import { createClient } from '@supabase/supabase-js';
import { publicSupabaseUrl, serviceRoleKey } from '@/lib/env';

export function createSupabaseAdminClient() {
  return createClient(publicSupabaseUrl(), serviceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
