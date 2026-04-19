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

## Produccion en Vercel

### Variables de entorno requeridas

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo server-side)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN` (solo server-side)
- `NEXT_PUBLIC_APP_URL` (dominio publico de Vercel)
- `SCRAPER_EXECUTION_MODE=queue`

Configuralas en Vercel para ambos ambientes:

- Preview
- Production

Ademas, valida que las secret server-side (`SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_TOKEN`) no esten marcadas como publicas.

### Estrategia de scraping en produccion

En Vercel, el endpoint `POST /api/admin/scraper/trigger` encola trabajos en `scrape_jobs`.
La ejecucion real del scraping debe correr en un worker externo (por ejemplo GitHub Actions, VM o proceso dedicado) que consuma esa cola.

Comando del worker (procesa 1 job pendiente):

```bash
npm run worker:scrape-queue
```

El modo `SCRAPER_EXECUTION_MODE=local` existe solo para desarrollo y ejecuta `scripts/scrapeAll.ts` directamente.

### Worker de cola (GitHub Actions)

Se incluye el workflow `Scrape Queue Worker` en [.github/workflows/scrape-queue-worker.yml](.github/workflows/scrape-queue-worker.yml), que corre cada 10 minutos y procesa 1 job pendiente.

Secrets requeridos en GitHub Actions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Flujo recomendado:

1. Admin dispara `POST /api/admin/scraper/trigger`.
2. La API encola un registro en `scrape_jobs`.
3. El workflow `Scrape Queue Worker` toma el job y ejecuta `npm run worker:scrape-queue`.