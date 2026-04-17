# 🧪 Plan de Testing Completo - Deali Scraper

## Parte 1: Test Funcional Completo de la Aplicación

### 1.1 Verificación de Inicio (Homepage)

#### ✅ Test: Carga de página principal
```bash
Test URL: http://localhost:3000/

Verificar:
✓ Página carga en < 2 segundos
✓ Componentes se renderizan correctamente
✓ Banner de promociones visible
✓ Ticker de ofertas activo
✓ Secciones de tiendas cargadas
✓ Footer presente
✓ Layout responsivo (mobile, tablet, desktop)
✓ Colores de tiendas correctos según BD
```

**Resultado esperado:**
```
- Status 200 OK
- Tiempo de carga: 1.2-1.8 segundos
- Imágenes optimizadas
- CSS cargado correctamente
```

#### 🎯 Notas de Mejora Identificadas:
1. **Lazy loading de imágenes** - Las imágenes pueden cargar bajo demanda
2. **Caché de componentes** - LiveOfferTicker se podría cachear en 5 min
3. **Compresión de respuesta** - Gzip habilitado en Next.js
4. **Crítica del CSS** - Separar estilos críticos del resto

---

### 1.2 Pruebas de API - Offers

#### Test: GET /api/offers
```bash
Endpoint: GET http://localhost:3000/api/offers

Parámetros de prueba:
1. Sin parámetros
   GET /api/offers
   
2. Con límite
   GET /api/offers?limit=50
   
3. Con tienda específica
   GET /api/offers?store=jumbo&limit=20
   
4. Con categoría
   GET /api/offers?category=bebidas-alcoholicas&limit=30
   
5. Excluir categoría
   GET /api/offers?excludeCategory=bebidas-alcoholicas&limit=50
   
6. Paginación
   GET /api/offers?page=1&limit=20
```

**Validaciones esperadas:**
```javascript
{
  "data": [
    {
      "id": "uuid",
      "productName": "string",
      "brand": "string | null",
      "imageUrl": "string",
      "offerUrl": "string",
      "originalPrice": 0-999999,
      "offerPrice": 0-999999,
      "discountPct": 0-100,
      "storeName": "string",
      "storeSlug": "jumbo | lider | santa-isabel | ...",
      "categorySlug": "string (canonical)"
    }
  ],
  "total": number,
  "limit": number,
  "page": number
}

✓ originalPrice >= offerPrice
✓ discountPct = ((originalPrice - offerPrice) / originalPrice) * 100
✓ Todas las categorías en lista canónica
✓ URLs válidas (http/https)
✓ Todas las tiendas en lista de 6 tiendas
```

**Performance esperado:**
```
- Tiempo respuesta: < 500ms
- Con limit=50: < 800ms
- Con filtros múltiples: < 1000ms
- Tamaño payload: < 500KB
```

---

### 1.3 Pruebas de API - Categories

#### Test: GET /api/categories
```bash
GET http://localhost:3000/api/categories
```

**Validar:**
```
✓ 14 categorías exactamente
✓ Todas con slugs únicos
✓ Sin espacios en slugs
✓ Sin acentos en slugs (convertidos a ASCII)
✓ Estructura jerárquica correcta (si aplica)
✓ Nombres en español
```

**Categorías esperadas:**
```
1. bebidas-alcoholicas
2. lacteos
3. carnes-pescados
4. frutas-verduras
5. congelados
6. panaderia-pasteleria
7. snacks-galletas
8. cuidado-personal-bebe
9. limpieza-hogar
10. bebidas
11. mascotas
12. electrohogar
13. bazar-hogar
14. despensa
15. general (fallback)
```

---

### 1.4 Pruebas de API - Stores

#### Test: GET /api/stores
```bash
GET http://localhost:3000/api/stores
```

**Validar:**
```
✓ Exactamente 6 tiendas
✓ Estructura correcta:
  {
    "id": "uuid",
    "name": "string",
    "slug": "string (único)",
    "logo_url": "url | null",
    "website_url": "valid http(s) url",
    "color_hex": "#RRGGBB",
    "active_offers_count": number
  }

✓ Slugs válidos
✓ Colors hex válidos
✓ URLs válidas
✓ active_offers_count >= 0
```

**Tiendas esperadas:**
```
1. Jumbo        (#0D9488)
2. Líder        (#7E6BC4)
3. Unimarc      (#DC2626)
4. aCuenta      (#BA7517)
5. Tottus       (#00843D)
6. Santa Isabel (#E91E63)
```

---

### 1.5 Pruebas de API - Promotions

#### Test: GET /api/promotions
```bash
GET http://localhost:3000/api/promotions
```

**Validar:**
```
✓ Array válido (puede estar vacío)
✓ Cada promoción tiene:
  {
    "id": "uuid",
    "title": "string (no vacío)",
    "description": "string | null",
    "storeId": "uuid",
    "storeName": "string",
    "image_url": "url | null",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "is_active": boolean
  }

✓ start_date <= end_date
✓ Imágenes con URLs válidas
✓ Títulos descriptivos
✓ Solo promociones activas si se aplica
```

---

### 1.6 Pruebas de Rutas - Navegación

#### Test: Navegación entre páginas
```bash
✓ / → Carga homepage
✓ /categoria/[slug] → Carga categoría específica
✓ /buscar → Página de búsqueda
✓ /promociones → Página de promociones
✓ /supermercado/[slug] → Página de tienda
✓ /login → Página de login
✓ /admin → Página de admin (debe requerir auth)

Validar para cada ruta:
- Status 200
- Componentes cargan
- Meta tags correctos
- Responsive design
- Imágenes cargan
```

---

### 1.7 Pruebas de Búsqueda

#### Test: Funcionalidad de búsqueda
```bash
GET /buscar?q=leche
GET /buscar?q=vino
GET /buscar?q=yogur&store=jumbo
GET /buscar?q=detergente&category=limpieza-hogar
```

**Validar:**
```
✓ Resultados relevantes
✓ Búsqueda case-insensitive
✓ Acentos no afectan búsqueda
✓ Límite de resultados (máx 100)
✓ Paginación funciona
✓ Filtros por tienda funcionan
✓ Filtros por categoría funcionan
✓ Ordenamiento por descuento funciona
✓ Ordenamiento por precio funciona
```

---

### 1.8 Pruebas de Filtros

#### Test: Filtrados en frontend
```bash
1. Por tienda
   ✓ Seleccionar Jumbo → solo ofertas Jumbo
   ✓ Seleccionar múltiples → ofertas de todas seleccionadas
   
2. Por categoría
   ✓ Seleccionar Lácteos → solo Lácteos
   ✓ Seleccionar múltiples → unión de categorías
   
3. Por rango de precio
   ✓ $1000-$5000 → solo en rango
   ✓ $10000-$20000 → solo en rango
   
4. Por descuento
   ✓ >20% descuento → ofertas con desc > 20%
   ✓ >50% descuento → ofertas con desc > 50%
   
5. Combinados
   ✓ Jumbo + Lácteos + >20% descuento
   ✓ Múltiples tiendas + rango de precio
```

---

### 1.9 Pruebas de Componentes UI

#### Test: LiveOfferTicker
```bash
✓ Se actualiza cada N segundos
✓ Muestra última oferta primero
✓ Transición suave entre ofertas
✓ Información completa visible
✓ Click en oferta abre URL correcta
✓ Scroll automático en mobile
```

#### Test: OfferCard
```bash
✓ Información correcta
✓ Imagen carga correctamente
✓ Descuento se calcula correctamente
✓ Logo de tienda visible
✓ Click en "Ver oferta" abre URL
✓ Hover effects funcionan
✓ Responsive (se adapta a mobile)
```

#### Test: StoreSection
```bash
✓ Color de tienda correcto
✓ Ofertas de tienda se muestran
✓ Cantidad de ofertas exacta
✓ Logo si existe
✓ Link a tienda funciona
```

#### Test: Navbar
```bash
✓ Logo visible
✓ Links de navegación funcionales
✓ Buscador funciona
✓ En mobile, hamburger menu abierto/cerrado
✓ Links activos destacados
✓ Carrito/cuenta visibles (si aplica)
```

---

### 1.10 Pruebas de Responsividad

#### Test: Breakpoints
```bash
Mobile (320px):
✓ Texto legible
✓ Imágenes no se cortan
✓ Botones tocables (mín 44px)
✓ Menú adapta

Tablet (768px):
✓ Layout se adapta
✓ Grid de 2 columnas
✓ Navegación visible

Desktop (1024px+):
✓ Grid de 3+ columnas
✓ Navbar horizontal
✓ Sidebar (si aplica)
```

---

### 1.11 Pruebas de Seguridad Básica

```bash
✓ HTTPS requerido en producción
✓ Headers de seguridad presentes
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security
  
✓ No hay SQL injection en búsqueda
✓ No hay XSS en resultados
✓ CORS configurado correctamente
✓ Rate limiting en APIs
✓ Autenticación admin requerida
✓ Passwords hasheados (bcrypt, argon2)
```

---

## Parte 2: Test Tipo Producción

### 2.1 Load Testing Simulado

#### Test: Concurrencia de usuarios
```bash
Herramienta: Apache JMeter, Locust o Artillery

Escenario 1: Normal
- 100 usuarios simultáneos
- Duración: 5 minutos
- Ramp-up: 1 minuto

Escenario 2: Pico de carga
- 500 usuarios simultáneos
- Duración: 5 minutos
- Ramp-up: 30 segundos

Escenario 3: Stress test
- 1000 usuarios simultáneos
- Duración: 2 minutos
```

**Criterios de Aceptación:**
```
Escenario Normal:
✓ 99% de requests < 500ms
✓ 100% de requests < 2s
✓ Error rate < 0.1%

Escenario Pico:
✓ 95% de requests < 1s
✓ 99% de requests < 2s
✓ Error rate < 1%

Stress Test:
✓ Sistema no cae
✓ Error rate < 5%
✓ Recupera cuando baja carga
```

#### Script de Artillery:
```yaml
config:
  target: "https://deali.production.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Normal Load"
    - duration: 300
      arrivalRate: 20
      name: "Ramping Up"
    - duration: 120
      arrivalRate: 100
      name: "Sustained Load"

scenarios:
  - name: "Homepage Browse"
    weight: 50
    flow:
      - get:
          url: "/"
      - delay: 2000
      - get:
          url: "/api/offers?limit=50"
      - delay: 3000
          
  - name: "Search"
    weight: 30
    flow:
      - get:
          url: "/buscar?q=leche"
      - delay: 2000
      
  - name: "Category Browse"
    weight: 20
    flow:
      - get:
          url: "/categoria/lacteos"
```

---

### 2.2 Test de Base de Datos

#### Performance de Queries
```sql
-- Query 1: Ofertas activas
SELECT COUNT(*) FROM offers WHERE is_active = true;
Tiempo esperado: < 100ms
(índice en is_active)

-- Query 2: Ofertas por categoría
SELECT COUNT(*) FROM offers 
JOIN products ON offers.product_id = products.id
WHERE products.category_id = 'uuid'
Tiempo esperado: < 200ms
(índices en product_id y category_id)

-- Query 3: Ofertas por tienda y categoría
SELECT * FROM offers 
JOIN products ON offers.product_id = products.id
WHERE products.store_id = 'uuid' 
AND products.category_id = 'uuid'
LIMIT 50;
Tiempo esperado: < 300ms

-- Query 4: Ofertas próximas a vencer
SELECT * FROM offers 
WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + '7 days'
AND is_active = true
ORDER BY end_date ASC;
Tiempo esperado: < 150ms
(índice en end_date)
```

#### Tamaño de Datos
```
Verificar en producción:
✓ Tabla stores: 6 registros
✓ Tabla categories: 15 registros
✓ Tabla products: >= 5000 registros (después de scraping)
✓ Tabla offers: >= 20000 registros (histórico)
✓ Tabla price_history: >= 50000 registros
✓ Tabla promotions: >= 20 registros (activas)

Índices verificados:
✓ idx_offers_end_date
✓ idx_offers_is_active
✓ idx_products_category_id
✓ idx_products_store_id
```

---

### 2.3 Test de Caching

#### Estrategia de caché actual
```bash
✓ Homepage: ISR cada 1800s
✓ Categorías: Caché en /api (no-store)
✓ Ofertas: Caché en /api (no-store)
✓ Imágenes: Next.js image optimization

Validaciones:
✓ Cache headers correctos
✓ ETags en respuestas API
✓ Invalidación de caché cuando hay nuevos datos
```

---

### 2.4 Monitoreo en Producción

```bash
Métricas a monitorear:
1. API Response Time
   ✓ GET / → < 1s
   ✓ GET /api/offers → < 500ms
   ✓ GET /api/categories → < 200ms
   
2. Error Rates
   ✓ 5xx errors < 0.1%
   ✓ 4xx errors < 1%
   
3. Database
   ✓ Connection pool usage < 80%
   ✓ Query time percentiles (p50, p95, p99)
   ✓ Slow queries log
   
4. Frontend
   ✓ Lighthouse score >= 80
   ✓ Core Web Vitals
     - LCP < 2.5s
     - FID < 100ms
     - CLS < 0.1
     
5. Scraper
   ✓ Ejecuciones exitosas
   ✓ Ofertas nuevas por ciclo
   ✓ Errores y retry counts
```

---

### 2.5 Checklist Pre-Deployments

```bash
Antes de desplegar a producción:

Frontend:
✓ npm run build (sin errores)
✓ npm test (todos pasan)
✓ npx eslint src/ (sin warnings)
✓ Lighthouse audit >= 80
✓ Broken links check

Backend:
✓ Todas las env vars configuradas
✓ Database migrations ejecutadas
✓ RLS policies en Supabase
✓ Backups automáticos habilitados

Scraper:
✓ SCRAPE_LIMIT configurado
✓ Todas las 6 tiendas funcionales
✓ QA validation pasa
✓ Logs registrando correctamente

Seguridad:
✓ HTTPS en producción
✓ Rate limiting habilitado
✓ CORS configurado
✓ Admin panel protegido
✓ Secretos no en git
```

---

## Parte 3: Mejoras Sugeridas para Backend

### 3.1 Optimizaciones de Base de Datos

#### ❌ Problema Actual
```sql
-- Sin índices en muchas consultas frecuentes
-- Algunas queries hacen full table scan
-- No hay particiones para datos históricos
```

#### ✅ Solución Recomendada
```sql
-- 1. Índices adicionales faltantes
CREATE INDEX idx_offers_store_id ON offers(
  SELECT product_id FROM products WHERE store_id = ?
);

CREATE INDEX idx_offers_discount ON offers(discount_pct DESC) 
WHERE is_active = true;

CREATE INDEX idx_products_name ON products(name) 
WITH (fillfactor = 70);

CREATE INDEX idx_price_history_product_date ON price_history(
  product_id, recorded_at DESC
);

-- 2. Particionamiento por fecha (ofertas históricas)
CREATE TABLE offers_archived PARTITION OF offers 
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 3. Materialized View para reports
CREATE MATERIALIZED VIEW offers_by_category_store AS
SELECT 
  c.slug as category,
  s.slug as store,
  COUNT(*) as offer_count,
  AVG(o.discount_pct) as avg_discount,
  COUNT(*) FILTER (WHERE o.is_active) as active_count
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN stores s ON p.store_id = s.id
GROUP BY c.slug, s.slug;

CREATE INDEX idx_mv_offers_by_cat_store ON 
  offers_by_category_store(category, store);

-- Refrescar cada hora
REFRESH MATERIALIZED VIEW CONCURRENTLY offers_by_category_store;

-- 4. Vistas para datos frecuentes
CREATE VIEW active_offers_summary AS
SELECT 
  COUNT(*) as total,
  COUNT(DISTINCT p.store_id) as stores_count,
  COUNT(DISTINCT p.category_id) as categories_count,
  AVG(o.discount_pct) as avg_discount,
  MAX(o.end_date) as last_expiring
FROM offers o
JOIN products p ON o.product_id = p.id
WHERE o.is_active = true;
```

---

### 3.2 API Optimization

#### ❌ Problemas Actuales
```
- Sin paginación en algunos endpoints
- Sin búsqueda full-text
- Sin filtering avanzado
- Sin compresión de payloads
```

#### ✅ Soluciones Recomendadas

```typescript
// 1. Full-text search en PostgreSQL
CREATE INDEX idx_products_search ON products 
USING GIN (to_tsvector('spanish', name || ' ' || COALESCE(brand, '')));

// Query mejorada
const searchOffers = `
  SELECT ... 
  FROM offers o
  JOIN products p ON o.product_id = p.id
  WHERE to_tsvector('spanish', p.name) @@ plainto_tsquery('spanish', $1)
  AND o.is_active = true
  LIMIT $2
`;

// 2. Response pagination mejorada
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  meta: {
    timestamp: string;
    version: string;
    cached: boolean;
    cacheAge: number;
  };
}

// 3. Gzip compression automática
// En next.config.js
compress: true,
poweredByHeader: false,

// 4. JSON minification
const minifyJson = (obj: any) => JSON.stringify(obj);

// 5. Proyección de campos (solo traer lo necesario)
GET /api/offers?fields=name,price,discount
// Solo retorna esos campos
```

---

### 3.3 Caching Avanzado

#### ✅ Implementar
```typescript
// 1. Redis para caché distribuido
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedOffers(storeId: string) {
  const key = `offers:${storeId}`;
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await db.query('SELECT ... FROM offers WHERE ...');
  await redis.setex(key, 300, JSON.stringify(data)); // 5 min TTL
  return data;
}

// 2. Cache warming (pre-cargar datos)
async function warmCache() {
  const stores = await db.query('SELECT slug FROM stores');
  
  for (const store of stores) {
    const offers = await db.query(
      'SELECT * FROM offers WHERE store_id = ?', 
      [store.id]
    );
    await redis.setex(
      `offers:${store.slug}`, 
      300, 
      JSON.stringify(offers)
    );
  }
}

// 3. ETag para validación de caché
import { hashObject } from 'crypto';

const getETag = (data: any) => {
  return `"${hashObject(data)}"`;
};

// En el route handler
const etag = getETag(data);
if (request.headers.get('if-none-match') === etag) {
  return new Response(null, { status: 304 }); // Not Modified
}

response.headers.set('etag', etag);
```

---

### 3.4 Validación y Error Handling

#### ✅ Mejorar
```typescript
// 1. Validación con Zod
import { z } from 'zod';

const OffersQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  page: z.coerce.number().min(1).default(1),
  store: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minDiscount: z.coerce.number().min(0).max(100).optional(),
});

type OffersQuery = z.infer<typeof OffersQuerySchema>;

export async function GET(request: Request) {
  try {
    const params = OffersQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    // ...
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Invalid parameters',
        details: error.issues
      }),
      { status: 400 }
    );
  }
}

// 2. Error handling consistente
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string
  ) {
    super(message);
  }
}

const errorHandler = (error: Error) => {
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.code,
        message: error.message,
        statusCode: error.statusCode
      }),
      { status: error.statusCode }
    );
  }
  
  // Log to monitoring service
  console.error('Unexpected error:', error);
  
  return new Response(
    JSON.stringify({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }),
    { status: 500 }
  );
};

// 3. Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

---

### 3.5 Logging y Monitoring

#### ✅ Implementar
```typescript
// 1. Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 2. Performance monitoring
const trackPerformance = (endpointName: string) => {
  return async (request: Request) => {
    const startTime = performance.now();
    
    try {
      const response = await handler(request);
      const duration = performance.now() - startTime;
      
      logger.info('API Request', {
        endpoint: endpointName,
        duration,
        status: response.status,
        timestamp: new Date().toISOString()
      });
      
      response.headers.set('X-Response-Time', `${duration}ms`);
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('API Error', {
        endpoint: endpointName,
        duration,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  };
};

// 3. Métricas (Prometheus)
import { register, Counter, Histogram } from 'prom-client';

const httpRequests = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status']
});

// 4. Error tracking (Sentry)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
});
```

---

## Parte 5: Testing de Imágenes de Productos (Tarea 5)

### 5.1 Validación de Extracción de Imágenes

#### Test: Tottus - Extracción de mediaUrls
```bash
Comando: npx tsx debug-images.ts

Validar:
✓ 20 ofertas extraídas
✓ Todas con imageUrl poblada
✓ URLs tienen formato /500x500
✓ Dominio: media.falabella.com/tottusCL/
✓ Sin errores de TypeScript
```

**Ejemplo esperado:**
```
[TottusScraper] Recommended API total: 20 offers.
Tottus: 20 offers
Sample: Cerveza Budweiser Botella 5° 24 x 330 cc
  imageUrl: "https://media.falabella.com/tottusCL/21301085_1/public/500x500"
  imageUrl empty? false ✓
```

#### Test: Unimarc - Extracción de images array
```bash
Comando: npx tsx debug-images.ts

Validar:
✓ 75 ofertas extraídas
✓ Todas con imageUrl poblada
✓ URLs son strings directos (no objetos)
✓ Dominio: unimarc.vtexassets.com/
✓ Sin errores TypeScript
✓ Type checking: images = Array<string | object>
```

**Ejemplo esperado:**
```
[UnimarcScraper] ✅ Total: 75 offers.
Unimarc: 75 offers
Sample: Pechuga entera de pollo Super Pollo granel 900 g
  imageUrl: "https://unimarc.vtexassets.com/arquivos/ids/189412/...jpg?v=..."
  imageUrl empty? false ✓
```

---

### 5.2 Validación de Guardado en BD

#### Test: Scraping + Guardado
```bash
Comando: npx tsx scripts/scrapeAll.ts

Validar en logs:
✓ [TottusScraper] Recommended API total: 20 offers
✓ scrape.process.start storeSlug=tottus
✓ scrape.process.completed updatedProducts=19
✓ backfill_images count >= 1 (si hay imágenes nuevas)

✓ [UnimarcScraper] ✅ Total: 75 offers
✓ scrape.process.start storeSlug=unimarc
✓ scrape.process.completed updatedProducts=74
✓ scrape.products.backfill_images storeSlug=unimarc count=74
```

#### Test: Verificación en BD
```bash
Comando: npx tsx -e "
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, 
                        process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data} = await sb.from('products')
  .select('name, image_url')
  .eq('store_id', (await sb.from('stores').select('id').eq('slug','tottus')).data[0].id)
  .limit(5);
console.log(JSON.stringify(data, null, 2));"

Validar:
✓ Tottus: image_url poblado con URLs Falabella
✓ Unimarc: image_url poblado con URLs VTEX assets
✓ Santa Isabel: image_url mantiene URLs anteriores
✓ Líder: image_url mantiene URLs anteriores
```

**Formato esperado:**
```json
[
  {
    "name": "Pasta de Dientes Ultra Blanco",
    "image_url": "https://media.falabella.com/tottusCL/20385635_1/public/500x500"
  },
  {
    "name": "Cerveza Budweiser Botella 5° 24 x 330 cc",
    "image_url": "https://media.falabella.com/tottusCL/21301085_1/public/500x500"
  }
]
```

---

### 5.3 Validación de API

#### Test: Cache Invalidation
```bash
Comando: npx tsx scripts/invalidateCache.ts

Validar:
✓ Redis cache limpiado
✓ Output: "✓ Deleted X cache keys"
✓ Siguiente request obtiene datos nuevos
```

#### Test: API Returns Images
```bash
Comando: $r = Invoke-RestMethod "http://localhost:3001/api/offers?store=tottus&limit=3"; 
         $r.data | Select-Object product_name, product_image_url

Validar:
✓ product_image_url presente en todas las ofertas
✓ URLs válidas (https://media.falabella.com o https://unimarc.vtexassets.com)
✓ Sin valores null/empty
✓ Performance < 500ms
```

**Formato esperado:**
```
product_name                              product_image_url
------------                              -----------------
Pasta de Dientes Ultra Blanco             https://media.falabella.com/tottusCL/...
Cerveza Budweiser Botella 5° 24 x 330 cc https://media.falabella.com/tottusCL/...
Agua Purificada Con Gas Benedictino 3 L   https://media.falabella.com/tottusCL/...
```

---

### 5.4 Validación en Frontend

#### Test: Rendering de Imágenes (OfferCard)
```bash
URL: http://localhost:3000/

Validar:
✓ Imágenes de Tottus renderean correctamente
✓ Imágenes de Unimarc renderean correctamente
✓ Fallback a iniciales si no hay imagen (mostrar iniciales)
✓ Hover effect funciona
✓ Loading lazy carga bajo demanda
✓ Aspect ratio correcto (cuadrado)
✓ Sin quebrase el layout si imagen falla
```

#### Test: Búsqueda con Imágenes
```bash
URL: http://localhost:3000/buscar?q=leche

Validar:
✓ Resultados muestran imágenes
✓ Imágenes de Tottus visibles
✓ Imágenes de Unimarc visibles
✓ Performance acceptable (carga < 2s)
✓ Lazy loading funciona al scroll
```

#### Test: Página de Supermercado
```bash
URL: http://localhost:3000/supermercado/tottus

Validar:
✓ Todas las ofertas de Tottus muestran imágenes
✓ Imágenes cargadas completamente
✓ Scroll y paginación funcionan
✓ Responsive en mobile/tablet/desktop
```

---

### 5.5 Validación de Referers

#### Test: Referer Headers
```bash
Usar Network Tab en DevTools o Fiddler:

Validar requests de scrapers:
✓ Tottus: Referer = https://www.tottus.cl/tottus-cl/content/ofertas-tottus?sid=HO_BH_OFE_498
✓ Líder: Referer = https://super.lider.cl/
✓ Santa Isabel: Referer = https://www.santaisabel.cl/ (o similar)
✓ Jumbo: Referer válido (VTEX API)
✓ Unimarc: Referer válido

Verificar en logs del scraper:
✓ Sin errores 403 Forbidden
✓ Sin errores 401 Unauthorized
✓ Rate limiting no alcanzado
```

---

### 5.6 Validación de Cambios de Categoría

#### Test: Electro y Tecnología Removida de Tottus
```bash
Validar en script:
✓ CATG27088 removido de tottusScraper.ts
✓ Sin ofertas de "Electro y Tecnología" en resultados
✓ Scraping completa sin errores

Comando: npx tsx scripts/scrapeAll.ts --store tottus

Validar en BD:
SELECT DISTINCT category_hint FROM offers 
  WHERE store_id = (SELECT id FROM stores WHERE slug = 'tottus')
  ORDER BY category_hint;

✗ No debe aparecer "electro" ni "tecnologia"
✓ Debe mostrar solo: bebidas, lacteos, carnes, etc
```

---

### 5.7 Resumen de Cambios

| Componente | Antes | Después | Status |
|------------|-------|---------|--------|
| Tottus Imágenes | ❌ Vacío | ✅ 20 productos | Done |
| Unimarc Imágenes | ❌ Vacío | ✅ 74 productos | Done |
| Tottus Referer | ❌ Incorrecto | ✅ ofertas-tottus URL | Done |
| Líder Referer | ❌ /supermercado/ofertas | ✅ super.lider.cl | Done |
| Electro Tottus | ❌ Scrapeado | ✅ Removido | Done |
| Tipo Unimarc | ⚠️ Parcial | ✅ string \| object | Done |
| Cache invalidación | ❌ No había | ✅ Script creado | Done |

---

### 5.8 Checklist Final

```
✅ Código compila sin errores TypeScript
✅ Scrapers extraen imágenes correctamente
✅ Imágenes guardadas en BD (products.image_url)
✅ API devuelve product_image_url
✅ Frontend renderiza imágenes sin fallbacks
✅ Referers validados y funcionando
✅ Categoría Electro removida de Tottus
✅ Cache invalidation script disponible
✅ Todos los tests pasan
✅ Performance acceptable (< 1s)
✅ Documentación actualizada
```

---



### 4.1 Schema Improvements

#### ❌ Problemas Actuales
```sql
-- Ofertas sin control de duplicados
-- Sin auditoría de cambios
-- Sin campos de estado explícito
-- Sin soporte para ofertas "bundle"
```

#### ✅ Soluciones

```sql
-- 1. Tabla de deduplicación
CREATE TABLE offer_deduplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_offer_id UUID NOT NULL REFERENCES offers(id),
  duplicate_offer_id UUID NOT NULL REFERENCES offers(id),
  similarity_score NUMERIC(5,2), -- 0-100%
  detected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(original_offer_id, duplicate_offer_id)
);

-- 2. Auditoría de cambios
CREATE TABLE offer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE offers_audit AS
SELECT *, current_timestamp as updated_at
FROM offers;

-- 3. Ofertas bundle
CREATE TABLE offer_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  bundle_discount NUMERIC(5,2), -- descuento adicional
  store_id UUID NOT NULL REFERENCES stores(id),
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES offer_bundles(id),
  offer_id UUID NOT NULL REFERENCES offers(id),
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Campos adicionales a offers
ALTER TABLE offers ADD COLUMN (
  restock_date DATE,
  supplier TEXT,
  source_url TEXT,
  manually_verified BOOLEAN DEFAULT false,
  quality_score NUMERIC(3,2), -- 0-1 (confidence)
  last_price_change TIMESTAMPTZ
);

-- 5. Tabla de prefers/wishlist del usuario
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  offer_id UUID REFERENCES offers(id),
  added_at TIMESTAMPTZ DEFAULT now(),
  preference_type VARCHAR(50) -- 'wishlist', 'ignored', 'favorites'
);

-- 6. Tabla de notificaciones de precio
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  product_id UUID REFERENCES products(id),
  target_price NUMERIC(10,2),
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- 7. Índices de performance
CREATE INDEX idx_offer_bundles_store_active 
ON offer_bundles(store_id, is_active) 
WHERE is_active = true;

CREATE INDEX idx_bundle_items_bundle_id 
ON bundle_items(bundle_id);

CREATE INDEX idx_price_alerts_user_product 
ON price_alerts(user_id, product_id);

CREATE INDEX idx_offer_deduplicates_score 
ON offer_deduplicates(similarity_score DESC);
```

---

### 4.2 Query Performance Enhancements

```sql
-- 1. Vistas materializadas para reportes
CREATE MATERIALIZED VIEW offer_statistics AS
SELECT 
  DATE_TRUNC('day', o.scraped_at) as date,
  s.slug as store,
  c.slug as category,
  COUNT(*) as offer_count,
  COUNT(DISTINCT p.id) as unique_products,
  ROUND(AVG(o.discount_pct), 2) as avg_discount,
  MIN(o.offer_price) as min_price,
  MAX(o.offer_price) as max_price,
  ROUND(AVG(o.offer_price), 2) as avg_price
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN stores s ON p.store_id = s.id
WHERE o.is_active = true
GROUP BY date, store, category;

-- 2. Vista para ofertas expirando pronto
CREATE VIEW expiring_soon_offers AS
SELECT 
  o.id, p.name, s.slug as store, c.slug as category,
  o.offer_price, o.discount_pct, o.end_date,
  (o.end_date - CURRENT_DATE) as days_left
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON p.store_id = s.id
JOIN categories c ON p.category_id = c.id
WHERE o.is_active = true
AND o.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY o.end_date ASC;

-- 3. Vista para productos sin precio histórico
CREATE VIEW products_without_history AS
SELECT p.id, p.name, s.slug as store, 
  MAX(ph.recorded_at) as last_history_date,
  EXTRACT(DAY FROM NOW() - MAX(ph.recorded_at)) as days_without_history
FROM products p
LEFT JOIN price_history ph ON p.id = ph.product_id
JOIN stores s ON p.store_id = s.id
GROUP BY p.id, p.name, s.slug
HAVING MAX(ph.recorded_at) IS NULL 
  OR EXTRACT(DAY FROM NOW() - MAX(ph.recorded_at)) > 30;
```

---

### 4.3 Data Integrity Improvements

```sql
-- 1. Constraints adicionales
ALTER TABLE offers ADD CONSTRAINT check_prices_valid
CHECK (offer_price > 0 AND original_price > 0);

ALTER TABLE offers ADD CONSTRAINT check_price_logic
CHECK (original_price >= offer_price);

ALTER TABLE offers ADD CONSTRAINT check_discount_valid
CHECK (discount_pct >= 0 AND discount_pct <= 100);

ALTER TABLE offers ADD CONSTRAINT check_dates_valid
CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);

-- 2. Triggers para mantener coherencia
CREATE OR REPLACE FUNCTION update_discount_pct()
RETURNS TRIGGER AS $$
BEGIN
  NEW.discount_pct := ROUND(
    ((NEW.original_price - NEW.offer_price) / NEW.original_price) * 100, 2
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_discount_pct
BEFORE INSERT OR UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION update_discount_pct();

-- 3. Trigger para auditoría automática
CREATE OR REPLACE FUNCTION audit_offer_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.discount_pct != OLD.discount_pct THEN
      INSERT INTO offer_audit_log(offer_id, field_name, old_value, new_value)
      VALUES (NEW.id, 'discount_pct', OLD.discount_pct::TEXT, NEW.discount_pct::TEXT);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_audit_offers
AFTER UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION audit_offer_changes();

-- 4. Verificación de integridad referencial
-- Asegurar que no hay orfandades
SELECT COUNT(*) FROM offers o
LEFT JOIN products p ON o.product_id = p.id
WHERE p.id IS NULL;

SELECT COUNT(*) FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE c.id IS NULL AND p.category_id IS NOT NULL;

SELECT COUNT(*) FROM products p
LEFT JOIN stores s ON p.store_id = s.id
WHERE s.id IS NULL;
```

---

### 4.4 Backup & Recovery

```sql
-- 1. Backup automático con WAL archiving
-- En postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/wal_archive/%f'
archive_timeout = 300 -- cada 5 minutos

-- 2. Replicas de lectura para reportes
-- Crear standby server
pg_basebackup -h primary -D /backups/replica -U replication

-- 3. Vacuum y análisis automático
ALTER DATABASE deali SET autovacuum = on;
ALTER DATABASE deali SET autovacuum_vacuum_scale_factor = 0.01;
ALTER DATABASE deali SET analyze_scale_factor = 0.005;

-- 4. Table partitioning para históricos
CREATE TABLE offer_archive PARTITION OF offers
FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

-- 5. Políticas de retención
DELETE FROM price_history 
WHERE recorded_at < CURRENT_DATE - INTERVAL '365 days'
AND product_id IN (
  SELECT id FROM products WHERE is_active = false
);
```

---

## Parte 5: Mejoras a Frontend

### 5.1 Performance

```typescript
// 1. Image optimization
import Image from 'next/image';

<Image
  src={offer.imageUrl}
  alt={offer.productName}
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL="data:image/jpeg,/9j/4AAQSkZJRg..." // LQIP
  priority={false}
  quality={85}
/>

// 2. Code splitting
const OfferCard = dynamic(() => import('./OfferCard'), {
  loading: () => <CardSkeleton />,
  ssr: false
});

// 3. Virtual scrolling para listas grandes
import { FixedSizeList } from 'react-window';

// 4. Prefetch de datos
<Link
  href="/categoria/lacteos"
  prefetch={true}
>
  Lácteos
</Link>

// 5. Service Worker para offline
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### 5.2 UX Improvements

```typescript
// 1. Skeleton loaders
const CardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 h-40 rounded mb-4" />
    <div className="bg-gray-200 h-4 rounded mb-2" />
    <div className="bg-gray-200 h-4 rounded w-5/6" />
  </div>
);

// 2. Infinite scroll
import { useIntersection } from 'react-use';

const [ref, isVisible] = useIntersection();

useEffect(() => {
  if (isVisible && hasMore) {
    loadMore();
  }
}, [isVisible]);

// 3. Progressive enhancement
<button onClick={handleFilter} className="...">
  {loadingFilter ? <Spinner /> : 'Filter'}
</button>

// 4. Toast notifications
import { toast } from 'react-hot-toast';

toast.success('Filtrado aplicado');
toast.error('Error en la búsqueda');

// 5. Confirmaciones
<AlertDialog>
  <AlertDialogTrigger>Delete</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
    <AlertDialogAction onClick={handleDelete}>
      Confirmar
    </AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

---

## Parte 6: Mejoras al Scraper

### 6.1 Robustez

```typescript
// 1. Retry automático con backoff exponencial
async function scrapeWithRetry(
  scraper: StoreScraper,
  maxRetries = 3
): Promise<RawOffer[]> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await scraper.scrape();
    } catch (error) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
}

// 2. Circuit breaker pattern
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime! > 60000) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount > 3) {
      this.state = 'OPEN';
    }
  }
}

// 3. Validación con schema
const RawOfferSchema = z.object({
  productName: z.string().min(1).max(300),
  brand: z.string().nullable(),
  imageUrl: z.string().url(),
  offerUrl: z.string().url(),
  originalPrice: z.number().positive(),
  offerPrice: z.number().positive(),
  categoryHint: z.string().nullable(),
});

// 4. Deduplicación inteligente
function deduplicateOffers(offers: RawOffer[]): RawOffer[] {
  const seen = new Map<string, RawOffer>();
  
  for (const offer of offers) {
    const key = `${offer.offerUrl}`;
    
    if (!seen.has(key)) {
      seen.set(key, offer);
    } else {
      // Actualizar si el precio es más bajo
      const existing = seen.get(key)!;
      if (offer.offerPrice < existing.offerPrice) {
        seen.set(key, offer);
      }
    }
  }
  
  return Array.from(seen.values());
}
```

---

## Resumen de Prioridades

### 🔴 Crítico (Implementar inmediatamente)
1. Índices en base de datos (búsqueda por store, categoría)
2. Rate limiting en APIs
3. Validación de inputs
4. Error handling consistente
5. Logging estructurado

### 🟠 Alto (Próximas 2 semanas)
1. Caché distribuido (Redis)
2. Load testing y monitoring
3. Full-text search
4. Retry logic en scraper
5. Deduplicación de ofertas

### 🟡 Medio (Próximo mes)
1. Materialized views para reportes
2. Virtual scrolling en frontend
3. Service workers
4. Circuit breaker en scraper
5. Auditoría de cambios

### 🟢 Bajo (Mejoras futuras)
1. Ofertas bundle
2. Price alerts
3. Wishlist de usuario
4. Análisis predictivo
5. Mobile app

---

**Última actualización**: Abril 2026
**Versión**: 1.0
**Audiencia**: Development & QA Team
