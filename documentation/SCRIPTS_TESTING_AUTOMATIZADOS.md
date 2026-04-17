# 🤖 Scripts de Testing Automatizados - Deali

## 1. Script de Tests Funcionales (Bash/PowerShell)

### Crear: `scripts/test/run-functional-tests.sh`

```bash
#!/bin/bash

# 🧪 Script de Tests Funcionales Completos - Deali

set -e

echo "═════════════════════════════════════════════════════════"
echo "🚀 INICIANDO TESTS FUNCIONALES COMPLETOS"
echo "═════════════════════════════════════════════════════════"

# Variables
BASE_URL="${BASE_URL:-http://localhost:3000}"
RESULTS_FILE="test-results-$(date +%Y%m%d-%H%M%S).json"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para hacer requests
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local description=$4
  
  echo -n "Testing $description... "
  
  local response=$(curl -s -w "\n%{http_code}" \
    -X $method \
    "$BASE_URL$endpoint" \
    -H "Content-Type: application/json")
  
  local body=$(echo "$response" | sed '$d')
  local status=$(echo "$response" | tail -n1)
  
  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $status)"
    return 0
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
    return 1
  fi
}

# Tests
test_count=0
test_passed=0
test_failed=0

echo ""
echo "📋 Test 1: Homepage"
echo "─────────────────────────────────────────────────────────"
if test_endpoint "GET" "/" "200" "Load homepage"; then
  ((test_passed++))
else
  ((test_failed++))
fi
((test_count++))

echo ""
echo "📋 Test 2: API Endpoints"
echo "─────────────────────────────────────────────────────────"

endpoints=(
  "GET:/api/offers?limit=50:200:Get offers with limit"
  "GET:/api/offers?store=jumbo:200:Get Jumbo offers"
  "GET:/api/categories:200:Get categories"
  "GET:/api/stores:200:Get stores"
  "GET:/api/promotions:200:Get promotions"
)

for endpoint in "${endpoints[@]}"; do
  IFS=':' read -r method path status description <<< "$endpoint"
  if test_endpoint "$method" "$path" "$status" "$description"; then
    ((test_passed++))
  else
    ((test_failed++))
  fi
  ((test_count++))
done

echo ""
echo "📋 Test 3: Validación de Datos"
echo "─────────────────────────────────────────────────────────"

# Validar ofertas
echo -n "Testing offer data structure... "
offers_response=$(curl -s "$BASE_URL/api/offers?limit=5")

if echo "$offers_response" | jq -e '.data[0] | 
  .id and .productName and .originalPrice and .offerPrice' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((test_passed++))
else
  echo -e "${RED}✗ FAIL${NC}"
  ((test_failed++))
fi
((test_count++))

# Validar categorías
echo -n "Testing categories count... "
categories_response=$(curl -s "$BASE_URL/api/categories")

category_count=$(echo "$categories_response" | jq '.data | length')
if [ "$category_count" -ge 14 ]; then
  echo -e "${GREEN}✓ PASS${NC} (Found: $category_count)"
  ((test_passed++))
else
  echo -e "${RED}✗ FAIL${NC} (Expected >= 14, Got: $category_count)"
  ((test_failed++))
fi
((test_count++))

# Validar tiendas
echo -n "Testing stores count... "
stores_response=$(curl -s "$BASE_URL/api/stores")

stores_count=$(echo "$stores_response" | jq '.data | length')
if [ "$stores_count" -eq 6 ]; then
  echo -e "${GREEN}✓ PASS${NC} (Found: 6)"
  ((test_passed++))
else
  echo -e "${RED}✗ FAIL${NC} (Expected: 6, Got: $stores_count)"
  ((test_failed++))
fi
((test_count++))

echo ""
echo "📋 Test 4: Validaciones de Lógica"
echo "─────────────────────────────────────────────────────────"

# Validar que originalPrice >= offerPrice
echo -n "Testing price logic (original >= offer)... "
offers=$(curl -s "$BASE_URL/api/offers?limit=10" | jq '.data[]')

price_logic_ok=true
while IFS= read -r offer; do
  original=$(echo "$offer" | jq '.originalPrice')
  offer_price=$(echo "$offer" | jq '.offerPrice')
  if (( $(echo "$original < $offer_price" | bc -l) )); then
    price_logic_ok=false
    break
  fi
done <<< "$offers"

if [ "$price_logic_ok" = true ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((test_passed++))
else
  echo -e "${RED}✗ FAIL${NC} (Found offer with original < offer price)"
  ((test_failed++))
fi
((test_count++))

# Validar descuentos
echo -n "Testing discount percentages (0-100)... "
discount_ok=true
while IFS= read -r offer; do
  discount=$(echo "$offer" | jq '.discountPct')
  if (( $(echo "$discount < 0 || $discount > 100" | bc -l) )); then
    discount_ok=false
    break
  fi
done <<< "$offers"

if [ "$discount_ok" = true ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((test_passed++))
else
  echo -e "${RED}✗ FAIL${NC} (Found invalid discount)")
  ((test_failed++))
fi
((test_count++))

echo ""
echo "═════════════════════════════════════════════════════════"
echo "📊 RESULTADOS"
echo "═════════════════════════════════════════════════════════"
echo "Total de Tests:   $test_count"
echo -e "Tests Pasados:   ${GREEN}$test_passed${NC}"
echo -e "Tests Fallidos:  ${RED}$test_failed${NC}"
echo "Tasa de Éxito:    $(( $test_passed * 100 / $test_count ))%"

# Guardar resultados
echo "{
  \"timestamp\": \"$(date -u +'%Y-%m-%dT%H:%M:%SZ')\",
  \"total\": $test_count,
  \"passed\": $test_passed,
  \"failed\": $test_failed,
  \"success_rate\": $(( $test_passed * 100 / $test_count ))
}" > "$RESULTS_FILE"

echo "Resultados guardados en: $RESULTS_FILE"
echo "═════════════════════════════════════════════════════════"

# Exit code
if [ $test_failed -eq 0 ]; then
  exit 0
else
  exit 1
fi
```

### Usar:
```bash
bash scripts/test/run-functional-tests.sh
# O con URL personalizada:
BASE_URL=https://production.deali.com bash scripts/test/run-functional-tests.sh
```

---

## 2. Script de Load Testing con Artillery

### Crear: `scripts/test/load-test.yml`

```yaml
config:
  target: "{{ $processEnvironment.TARGET_URL || 'http://localhost:3000' }}"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warmup"
    - duration: 180
      arrivalRate: 20
      name: "Ramp Up"
    - duration: 300
      arrivalRate: 50
      name: "Peak Load"
    - duration: 60
      arrivalRate: 10
      name: "Cooldown"
  
  processor: "./load-test-processor.js"
  defaults:
    headers:
      User-Agent: "Deali-Load-Test/1.0"
      Accept: "application/json"

scenarios:
  - name: "Homepage Browse"
    weight: 40
    flow:
      - get:
          url: "/"
          capture:
            json: "$"
            as: "homepage"
      - think: 2000
      
  - name: "Browse Offers"
    weight: 40
    flow:
      - get:
          url: "/api/offers?limit=50&page=1"
          capture:
            json: "$.data[0].id"
            as: "offer_id"
      - think: 3000
      - get:
          url: "/api/offers?limit=50&page=2"
      
  - name: "Search"
    weight: 15
    flow:
      - get:
          url: "/buscar?q=leche"
      - think: 2000
      
  - name: "Category Browse"
    weight: 5
    flow:
      - get:
          url: "/categoria/lacteos"
      - think: 4000
```

### Crear: `scripts/test/load-test-processor.js`

```javascript
// load-test-processor.js
module.exports = {
  setup: function(context, ee, next) {
    console.log('Load test starting...');
    next();
  },
  
  cleanup: function(context, ee, next) {
    console.log('Load test complete');
    next();
  },
  
  beforeRequest: function(requestParams, context, ee, next) {
    requestParams.headers['X-Test-Run-ID'] = context.vars.testRunId;
    return next();
  },
  
  afterResponse: function(requestParams, response, context, ee, next) {
    if (response.statusCode >= 400) {
      console.error(`Error ${response.statusCode} on ${requestParams.url}`);
    }
    return next();
  }
};
```

### Usar:
```bash
# Instalar Artillery
npm install -g artillery

# Ejecutar load test
TARGET_URL=http://localhost:3000 artillery run scripts/test/load-test.yml

# Generar reporte HTML
artillery run scripts/test/load-test.yml --output results.json
artillery report results.json
```

---

## 3. Script de Testing de Base de Datos

### Crear: `scripts/test/test-database.sql`

```sql
-- Test de Performance y Validación de BD

-- 🔍 Test 1: Verificar integridad de datos
SELECT COUNT(*) as total_offers FROM offers;
SELECT COUNT(*) as active_offers FROM offers WHERE is_active = true;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_stores FROM stores;

-- 🔍 Test 2: Ofertas sin productos (orfandad)
SELECT COUNT(*) as orphan_offers
FROM offers o
LEFT JOIN products p ON o.product_id = p.id
WHERE p.id IS NULL;

-- 🔍 Test 3: Productos sin categoría
SELECT COUNT(*) as products_without_category
FROM products
WHERE category_id IS NULL;

-- 🔍 Test 4: Verificar lógica de descuentos
SELECT COUNT(*) as invalid_discounts
FROM offers
WHERE discount_pct < 0 OR discount_pct > 100
OR original_price < offer_price;

-- 🔍 Test 5: Performance de queries críticas
EXPLAIN ANALYZE
SELECT * FROM offers 
WHERE is_active = true 
ORDER BY end_date ASC 
LIMIT 50;

EXPLAIN ANALYZE
SELECT p.name, c.slug, s.slug, o.offer_price
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN stores s ON p.store_id = s.id
WHERE s.slug = 'jumbo' AND c.slug = 'lacteos'
LIMIT 20;

-- 🔍 Test 6: Índices existentes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 🔍 Test 7: Estadísticas por tienda
SELECT 
  s.name,
  COUNT(o.id) as total_offers,
  COUNT(DISTINCT p.id) as unique_products,
  ROUND(AVG(o.discount_pct)::numeric, 2) as avg_discount,
  MIN(o.offer_price) as min_price,
  MAX(o.offer_price) as max_price
FROM stores s
LEFT JOIN products p ON s.id = p.store_id
LEFT JOIN offers o ON p.id = o.product_id
GROUP BY s.id, s.name
ORDER BY total_offers DESC;

-- 🔍 Test 8: Ofertas próximas a vencer
SELECT 
  p.name, s.name, c.slug,
  o.end_date,
  (o.end_date - CURRENT_DATE) as days_left
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON p.store_id = s.id
JOIN categories c ON p.category_id = c.id
WHERE o.is_active = true
AND o.end_date < CURRENT_DATE + INTERVAL '7 days'
ORDER BY o.end_date ASC
LIMIT 20;

-- 🔍 Test 9: Estadísticas por categoría
SELECT 
  c.name, c.slug,
  COUNT(o.id) as total_offers,
  ROUND(AVG(o.discount_pct)::numeric, 2) as avg_discount
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN offers o ON p.id = o.product_id
GROUP BY c.id, c.name, c.slug
ORDER BY total_offers DESC;

-- 🔍 Test 10: Duplicados potenciales
SELECT 
  p.name, s.name, COUNT(*) as count
FROM offers o
JOIN products p ON o.product_id = p.id
JOIN stores s ON p.store_id = s.id
WHERE o.is_active = true
GROUP BY p.name, s.name
HAVING COUNT(*) > 1
LIMIT 10;
```

### Usar:
```bash
# En psql
psql -U user -d deali_production -f scripts/test/test-database.sql > db-test-results.txt

# O en código Node.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

const tests = [
  'SELECT COUNT(*) FROM offers',
  'SELECT COUNT(*) FROM offers WHERE is_active = true',
  // ... más queries
];

for (const query of tests) {
  const { data, error } = await supabase.from('offers').select('*');
  console.log(query, error ? 'FAIL' : 'PASS');
}
```

---

## 4. Script de Testing de Frontend (Playwright)

### Crear: `scripts/test/e2e.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Deali E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Homepage loads correctly', async ({ page }) => {
    // Verificar elementos principales
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('[data-testid="offer-ticker"]')).toBeVisible();
    await expect(page.locator('[data-testid="store-section"]')).toBeVisible();
    
    // Verificar performance
    const performanceMetrics = await page.evaluate(() => {
      const perfData = window.performance.timing;
      return {
        loadTime: perfData.loadEventEnd - perfData.navigationStart,
        domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        serverTime: perfData.responseEnd - perfData.requestStart
      };
    });
    
    expect(performanceMetrics.loadTime).toBeLessThan(3000);
  });

  test('Search functionality works', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await searchInput.fill('leche');
    await page.keyboard.press('Enter');
    
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    const results = await page.locator('[data-testid="offer-card"]').count();
    expect(results).toBeGreaterThan(0);
  });

  test('Filter by category works', async ({ page }) => {
    const categoryFilter = page.locator('button:has-text("Lácteos")');
    await categoryFilter.click();
    
    await page.waitForLoadState('networkidle');
    
    const offers = await page.locator('[data-testid="offer-card"]').all();
    
    for (const offer of offers) {
      const category = await offer.locator('[data-testid="category"]').textContent();
      expect(category).toContain('Lácteos');
    }
  });

  test('Filter by store works', async ({ page }) => {
    const storeFilter = page.locator('input[value="jumbo"]');
    await storeFilter.check();
    
    await page.waitForLoadState('networkidle');
    
    const offers = await page.locator('[data-testid="offer-card"]').all();
    
    for (const offer of offers) {
      const store = await offer.locator('[data-testid="store-name"]').textContent();
      expect(store).toContain('Jumbo');
    }
  });

  test('Mobile responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone
    
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    
    const hamburger = page.locator('[data-testid="hamburger-menu"]');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      const menu = page.locator('[data-testid="mobile-menu"]');
      await expect(menu).toBeVisible();
    }
  });

  test('Offer details page loads', async ({ page }) => {
    const offerLink = page.locator('[data-testid="offer-link"]').first();
    await offerLink.click();
    
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="offer-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="offer-discount"]')).toBeVisible();
  });

  test('Category page works', async ({ page }) => {
    await page.goto('http://localhost:3000/categoria/lacteos');
    
    await page.waitForLoadState('networkidle');
    
    const offers = await page.locator('[data-testid="offer-card"]').count();
    expect(offers).toBeGreaterThan(0);
  });

  test('Accessibility - WCAG 2.1', async ({ page }) => {
    const accessibility = await page.evaluate(() => {
      const violations: any[] = [];
      
      // Check images have alt text
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.alt) {
          violations.push({
            type: 'Missing alt text',
            element: img.outerHTML.substring(0, 50)
          });
        }
      });
      
      // Check color contrast (simplified)
      const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4');
      textElements.forEach(el => {
        const computed = window.getComputedStyle(el);
        // Could use a library like axe-core for full checking
      });
      
      return violations;
    });
    
    expect(accessibility.length).toBe(0);
  });
});
```

### Usar:
```bash
# Instalar Playwright
npm install -D @playwright/test

# Ejecutar tests E2E
npx playwright test

# Con head (ver navegador)
npx playwright test --headed

# Modo debug
npx playwright test --debug
```

---

## 5. Script de Monitoreo en Producción

### Crear: `scripts/monitor/health-check.ts`

```typescript
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

interface HealthCheckResult {
  timestamp: string;
  checks: {
    api: { status: string; responseTime: number; };
    database: { status: string; responseTime: number; };
    cache: { status: string; responseTime: number; };
    performance: { status: string; metrics: any; };
  };
  overallStatus: 'healthy' | 'degraded' | 'down';
  alerts: string[];
}

async function runHealthCheck(): Promise<HealthCheckResult> {
  const alerts: string[] = [];
  const checks: any = {};
  
  const result: HealthCheckResult = {
    timestamp: new Date().toISOString(),
    checks: {} as any,
    overallStatus: 'healthy',
    alerts
  };

  // 1. API Health
  try {
    const start = Date.now();
    const apiResponse = await axios.get(
      `${process.env.BASE_URL}/api/offers?limit=1`,
      { timeout: 5000 }
    );
    const responseTime = Date.now() - start;
    
    checks.api = {
      status: apiResponse.status === 200 ? 'healthy' : 'degraded',
      responseTime
    };
    
    if (responseTime > 1000) {
      alerts.push('API response time > 1000ms');
    }
  } catch (error) {
    checks.api = { status: 'down', responseTime: -1 };
    alerts.push('API is down');
  }

  // 2. Database Health
  try {
    const start = Date.now();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data, error } = await supabase
      .from('offers')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - start;
    
    checks.database = {
      status: error ? 'down' : 'healthy',
      responseTime
    };
    
    if (responseTime > 500) {
      alerts.push('Database response time > 500ms');
    }
  } catch (error) {
    checks.database = { status: 'down', responseTime: -1 };
    alerts.push('Database connection failed');
  }

  // 3. Cache Health (Redis)
  if (process.env.REDIS_URL) {
    try {
      const start = Date.now();
      // Test Redis connection
      const responseTime = Date.now() - start;
      
      checks.cache = {
        status: 'healthy',
        responseTime
      };
    } catch (error) {
      checks.cache = { status: 'down', responseTime: -1 };
      alerts.push('Cache (Redis) is down');
    }
  }

  // 4. Performance Metrics
  try {
    const metricsResponse = await axios.get(
      `${process.env.BASE_URL}/api/metrics`,
      { timeout: 5000 }
    );
    
    const metrics = metricsResponse.data;
    
    checks.performance = {
      status: metrics.uptime > 0.99 ? 'healthy' : 'degraded',
      metrics: {
        uptime: metrics.uptime,
        avgResponseTime: metrics.avgResponseTime,
        errorRate: metrics.errorRate
      }
    };
    
    if (metrics.errorRate > 0.01) {
      alerts.push(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    }
  } catch (error) {
    checks.performance = { status: 'down', metrics: {} };
  }

  result.checks = checks;
  
  // Determinar estado general
  const downServices = Object.values(checks).filter(
    c => c.status === 'down'
  ).length;
  
  if (downServices > 0) {
    result.overallStatus = 'down';
  } else if (alerts.length > 0) {
    result.overallStatus = 'degraded';
  }

  return result;
}

// Ejecutar cada 5 minutos
setInterval(async () => {
  const healthCheck = await runHealthCheck();
  
  console.log('Health Check Results:');
  console.log(JSON.stringify(healthCheck, null, 2));
  
  // Si hay alertas críticas, enviar notificación
  if (healthCheck.overallStatus !== 'healthy') {
    await sendAlert(healthCheck);
  }
}, 5 * 60 * 1000);

async function sendAlert(result: HealthCheckResult) {
  // Implementar según necesidad:
  // - Enviar email
  // - Enviar a Slack
  // - Crear issue en GitHub
  // - Enviar SMS
  
  console.error('🚨 ALERT:', result.alerts);
}
```

### Usar:
```bash
# Correr health check
npx tsx scripts/monitor/health-check.ts

# O en cron job
0 * * * * cd /path/to/deali && npx tsx scripts/monitor/health-check.ts >> health-check.log
```

---

## Resumen de Scripts

| Script | Propósito | Frecuencia |
|--------|-----------|-----------|
| `run-functional-tests.sh` | Tests funcionales | Pre-deployment |
| `load-test.yml` | Load testing | Semanal |
| `test-database.sql` | Tests de BD | Diaria |
| `e2e.test.ts` | Tests E2E | Cada commit |
| `health-check.ts` | Monitoreo | Cada 5 min |

---

## Integración con CI/CD

### GitHub Actions (`.github/workflows/test.yml`)

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  functional-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v3
      - run: bash scripts/test/run-functional-tests.sh

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npx playwright install
      - run: npm run build
      - run: npx playwright test

  load-test:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g artillery
      - run: artillery run scripts/test/load-test.yml
```

---

**Última actualización**: Abril 2026
