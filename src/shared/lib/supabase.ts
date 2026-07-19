import { createClient } from '@supabase/supabase-js';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

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
