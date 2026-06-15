import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * true cuando las variables de entorno están configuradas.
 * Úsalo para mostrar un banner de config en dev.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

/**
 * Cliente Supabase singleton.
 * Si las env vars faltan (dev sin .env.local) usa placeholders para que la
 * app monte correctamente y muestre el banner de configuración.
 */
export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,  // App pública — sin login
      autoRefreshToken: false,
    },
  }
)
