import { createClient } from '@supabase/supabase-js';

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = String(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes('your-public-anon-key'),
);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-houseerp.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);
