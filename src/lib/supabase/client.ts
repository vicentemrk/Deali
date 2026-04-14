import { createBrowserClient as createClientBrowser } from '@supabase/ssr';

/**
 * Creates a configured Supabase client for browser components. Returns null if env vars are missing.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClientBrowser(url, key);
}
