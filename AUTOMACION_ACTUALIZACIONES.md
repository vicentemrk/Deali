# 🤖 Automatización de Actualizaciones - Deali

## Estado Actual

La plataforma está **100% automatizada**. Las ofertas se actualizan sin intervención manual.

---

## 📅 Programación Automática

### 1. **Scraper API (Jumbo, Líder, Santa Isabel, Tottus)**
- **Frecuencia**: Cada 3 horas
- **Ubicación**: `.github/workflows/scraper-api.yml`
- **Qué hace**: 
  - Ejecuta `npx tsx scripts/scrapeAll.ts` con scrapers VTEX API
  - Recolecta 100+ ofertas por tienda
  - Guarda en tabla `products` y `offers` de Supabase
  - Invalida caché Redis para mostrar datos frescos
- **Tiempo**: ~2-3 minutos por ejecución

### 2. **Scraper Playwright (Unimarc)**
- **Frecuencia**: Cada 6 horas
- **Ubicación**: `.github/workflows/scraper-browser.yml`
- **Qué hace**:
  - Ejecuta navegador Playwright para scraping dinámico
  - Extrae ofertas de sitios con JavaScript renderizado
  - Guarda en Supabase igual que API scrapers
- **Tiempo**: ~5-10 minutos por ejecución (más lento)

### 3. **Scrape Queue Worker**
- **Frecuencia**: Cada 10 minutos
- **Ubicación**: `.github/workflows/scrape-queue-worker.yml`
- **Qué hace**:
  - Busca jobs pendientes en tabla `scrape_jobs`
  - Procesa jobs en order FIFO (primero en entrar, primero en salir)
  - Se detiene cuando no hay más jobs pending
- **Tiempo**: ~1-2 minutos por job

---

## 🔄 Flujo Automático Completo

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions (Workflows) Ejecutan en Horarios Fijos      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    [API]       [Playwright]  [Queue]
  (cada 3h)     (cada 6h)    (cada 10m)
        │            │            │
        └────────────┴────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Supabase Database   │
          │  - products          │
          │  - offers            │
          │  - scrape_jobs       │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Upstash Redis Cache │
          │  (invalidation)      │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Vercel Frontend     │
          │  (revalida ISR)      │
          └──────────────────────┘
```

---

## 🕒 Horario Próximas Ejecuciones (Aproximado)

**Hoy (19/04/2026 - 01:45)**

| Servicio | Próxima ejecución | Diferencia |
|----------|-------------------|-----------|
| Scraper API | 04:00 | ~2h 15min |
| Scraper Playwright | 06:00 | ~4h 15min |
| Queue Worker | 01:50 | ~5min |

---

## ✅ Cómo Verificar que Está Funcionando

### 1. **Ver ejecuciones recientes**
```
GitHub Repo → Actions → [Workflow Name] → See all runs
```

### 2. **Monitorear ofertas nuevas**
```bash
# Query en Supabase
SELECT COUNT(*), store_slug 
FROM offers 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY store_slug;
```

### 3. **Ver jobs en cola**
```bash
SELECT * FROM scrape_jobs 
ORDER BY requested_at DESC 
LIMIT 10;
```

### 4. **Chequear logs**
```bash
npm run monitor:db:watch  # Terminal real-time
```

---

## 🔐 Variables de Entorno Requeridas

Todas configuradas en **GitHub Actions Secrets**:

```
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ UPSTASH_REDIS_REST_URL
✅ UPSTASH_REDIS_REST_TOKEN
```

Y en **Vercel Environment Variables**:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ UPSTASH_REDIS_REST_URL
✅ UPSTASH_REDIS_REST_TOKEN
✅ NEXT_PUBLIC_APP_URL
✅ SCRAPER_EXECUTION_MODE = "queue"
```

---

## 💡 Cómo Pausar/Reanudar

### Pausar temporalmente
1. Ir a `.github/workflows/scraper-api.yml` en main branch
2. Cambiar `cron: '0 */3 * * *'` a `cron: '0 0 32 * *'` (nunca)
3. Commit y push

### Reanudar
1. Volver al cron original
2. Commit y push

---

## 🐛 Si Algo Se Rompe

1. **Las ofertas no actualizan**: Chequear GitHub Actions logs
2. **Caché no se invalida**: Revisar Upstash Redis connection
3. **Job se queda en "processing"**: Resetearlo manualmente en Supabase:
   ```sql
   UPDATE scrape_jobs 
   SET status = 'failed', error = 'Manual reset' 
   WHERE id = 'job-uuid' AND status = 'processing';
   ```

---

## 📊 Estadísticas

- **Total scrapers activos**: 5 (Jumbo, Líder, Unimarc, Tottus, Santa Isabel)
- **Ofertas objetivo por tienda**: 100+
- **Actualizaciones por semana**: ~168 (cada 10 min × 24h)
- **Downtime esperado**: 0% (sistemas distribuidos, sin SPOF)

---

**Última actualización**: 19/04/2026 01:45  
**Mantenedor**: GitHub Actions (100% automático)  
**Sin intervención manual requerida** ✅
