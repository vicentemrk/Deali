# Deali

Comparador de ofertas de supermercados en Chile con scrapers automáticos, backend en Next.js y base de datos en Supabase.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (Postgres + Auth + Realtime)
- Upstash Redis (cache)
- Scrapers mixtos (VTEX API + Playwright fallback)

## Estado actual

- Lint validado en verde.
- Scrapers con resiliencia HTTP y alertas por bajo volumen.
- Jumbo y Santa Isabel priorizan fuentes más estables cuando VTEX público no alcanza.

## Arranque Rápido

```bash
npm install
npm run lint
npm test
```

## Operación

```bash
# Scraping completo
npx tsx scripts/scrapeAll.ts

# Validación de calidad
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo --strict

# Limpiar cache después de scrape
npx tsx scripts/invalidateCache.ts
```