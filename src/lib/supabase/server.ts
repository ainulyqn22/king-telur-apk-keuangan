import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { publicSupabaseKey, publicSupabaseUrl } from '@/lib/env';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(publicSupabaseUrl(), publicSupabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; middleware refreshes sessions.
        }
      },
    },
  });
}
