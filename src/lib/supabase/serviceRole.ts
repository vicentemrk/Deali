import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with the service role key, bypassing RLS. Use ONLY server-side.
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
