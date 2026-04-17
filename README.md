## Deali

Comparador de ofertas de supermercados en Chile con scrapers automáticos, backend en Next.js y base de datos en Supabase.

### Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth)
- Upstash Redis (cache y rate limit)
- Playwright (fallback para scrapers)

### Requisitos

- Node.js 20+
- npm 10+
- Variables de entorno configuradas (ver `.env.example`)

### Instalación

```bash
npm install
```

### Variables de entorno mínimas

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Opcionales:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `TOTTUS_COOKIE`
- `SCRAPE_LIMIT`

### Desarrollo local

```bash
npm run dev
```

App: `http://localhost:3000`

### Scripts útiles

- `npm run dev`: desarrollo
- `npm run build`: build producción
- `npm run start`: correr build
- `npm run lint`: lint
- `npx tsx scripts/scrapeAll.ts`: ejecutar scraping completo
- `npx tsx scripts/scrapeAll.ts --store jumbo`: scraping de una tienda

### Estructura principal

- `src/app/api`: endpoints públicos y admin
- `src/app/admin`: panel de administración
- `src/components`: componentes UI
- `scripts/scrapers`: scrapers por tienda
- `supabase/migrations`: migraciones SQL

### Seguridad y operación

- Las rutas `/api/admin/*` y `/admin/*` requieren sesión.
- Las APIs públicas tienen rate limiting por IP.
- Los handlers API devuelven error controlado si Supabase no inicializa.
- El trigger de scrapers valida `storeSlug` con lista blanca estricta.

### Testing

Hay tests de utilidades y QA en:

- `scripts/lib/__tests__`
- `scripts/qa/__tests__`
- `scripts/scrapers/__tests__`

Ejemplo:

```bash
npx tsx --test scripts/lib/__tests__/categoryMapper.test.ts
```

### Deploy

Se recomienda Vercel para frontend/API y Supabase para datos. Asegura que las variables de entorno estén definidas en el entorno remoto antes del primer deploy.

