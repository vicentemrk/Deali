import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import { isSupabaseConfigured } from './lib/supabase'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: false,
    },
  },
})

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el elemento #root')

createRoot(container).render(
  <StrictMode>
    {/* Banner de configuración — solo visible en dev sin .env.local */}
    {!isSupabaseConfigured && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#f59e0b', color: '#000', textAlign: 'center',
        padding: '8px 16px', fontSize: '13px', fontFamily: 'monospace',
      }}>
        ⚠️ Falta <code>frontend/.env.local</code> — copia{' '}
        <code>.env.example</code> y agrega tus claves de Supabase.
        Los datos no cargarán hasta configurarlo.
      </div>
    )}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
