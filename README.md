# Deali

Comparador de ofertas de supermercados en Chile con scrapers automáticos, backend en Next.js y base de datos en Supabase.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Supabase (Postgres + Auth + Realtime)
- Upstash Redis (cache)
- Scrapers mixtos (VTEX API + Playwright fallback)

## Estado actual

- Lint validado en verde.
- Scrapers con resiliencia HTTP y alertas por bajo volumen.
- Jumbo y Santa Isabel priorizan fuentes más estables cuando VTEX público no alcanza.