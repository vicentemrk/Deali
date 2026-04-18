# Guía Rápida - Scripts y Tests

## 🚀 Inicio Rápido

### Instalar Dependencias
```bash
npm install
```

### Ejecutar Todos los Tests
```bash
npm test
```

### Validar Lint
```bash
npm run lint
```

---

## 📋 Tests por Tarea

### Tarea 1: CategoryMapper (24 tests)
Validación del normalizador de categorías.

```bash
npx tsx --test scripts/lib/__tests__/categoryMapper.test.ts
```

**Qué valida:**
- ✅ Detección de 14 categorías diferentes
- ✅ Manejo de acentos y mayúsculas
- ✅ Prioridad de patrones (bebidas alcohólicas antes que bebidas)
- ✅ Normalización de rutas VTEX

---

### Tarea 3: Fixtures de Jumbo y Santa Isabel (14 tests)
Validación de datos realistas para testing.

```bash
npx tsx --test scripts/scrapers/__tests__/jumboSantaIsabel.test.ts
```

**Qué valida:**
- ✅ 24 ofertas de ejemplo por tienda
- ✅ Cobertura de 10+ categorías
- ✅ Estructura de datos válida
- ✅ Precios y descuentos razonables

---

### Tarea 4: Script de QA (14 tests + validación en vivo)

#### Tests Unitarios
```bash
npx tsx --test scripts/qa/__tests__/validateOfferQuality.test.ts
```

#### Ejecutar Validación en BD

```bash
# Validar todas las tiendas (100 ofertas)
npx tsx scripts/qa/validateOfferQuality.ts

# Validar tienda específica
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo
npx tsx scripts/qa/validateOfferQuality.ts --store santa-isabel
npx tsx scripts/qa/validateOfferQuality.ts --store lider
npx tsx scripts/qa/validateOfferQuality.ts --store tottus

# Aumentar muestra
npx tsx scripts/qa/validateOfferQuality.ts --limit 500

# Modo estricto
npx tsx scripts/qa/validateOfferQuality.ts --strict

# Combinadas
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo --limit 500 --strict
```

**Qué valida:**
- ✅ Campos obligatorios presentes
- ✅ Precios positivos y lógicamente consistentes
- ✅ Descuentos razonables (5-80%)
- ✅ Categorías válidas
- ✅ URLs de imagen bien formadas

---

## 🔄 Scripts de Scraping y Cache

### Ejecutar Scraping Completo
```bash
# Scraping de todas las tiendas
npx tsx scripts/scrapeAll.ts

# Scraping de tienda específica
npx tsx scripts/scrapeAll.ts --store tottus
npx tsx scripts/scrapeAll.ts --store jumbo
npx tsx scripts/scrapeAll.ts --store santa-isabel
npx tsx scripts/scrapeAll.ts --store lider
npx tsx scripts/scrapeAll.ts --store unimarc
```

**Qué hace:**
- ✅ Extrae ofertas de cada tienda
- ✅ Normaliza categorías
- ✅ Extrae imágenes de productos
- ✅ Valida precios y descuentos
- ✅ Guarda/actualiza en Supabase
- ℹ️ Mantiene cache de Redis

### Invalidar Cache (Importante después de Scraping)
```bash
# Limpiar cache de ofertas en Redis
npx tsx scripts/invalidateCache.ts
```

**Cuándo usar:**
- Después de scraping para ver cambios inmediatos
- Si el API devuelve datos viejos
- Para testing y validación

**Resultado:**
```
Invalidating offers cache...
✓ Deleted 5 cache keys
```

---

## 📊 Tarea 5: Imágenes de Productos

### Cambios Implementados

#### Tottus (20 productos con imágenes)
```bash
Referer: https://www.tottus.cl/tottus-cl/content/ofertas-tottus?sid=HO_BH_OFE_498
Image Source: mediaUrls API field → /500x500
Example: https://media.falabella.com/tottusCL/21301085_1/public/500x500
```

#### Unimarc (74 productos con imágenes)
```bash
Referer: https://www.unimarc.cl/
Image Source: images[] string array
Example: https://unimarc.vtexassets.com/arquivos/ids/189412/...jpg
```

#### Líder (Referer actualizado)
```bash
Referer: https://super.lider.cl/
(Imágenes existentes mantienen funcionando)
```

#### Cambios de Categoría
```bash
Tottus: Categoría "Electro y Tecnología" removida
```

---

## ⚙️ Configuración

### Variables de Entorno (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dcqmradooboptlijuarc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tu-clave>

# Scraping
SCRAPE_LIMIT=50  # Ofertas por tienda (antes era 10)

# Cookies de sesión (opcional)
TOTTUS_COOKIE=<cookie>

# Redis Cache (opcional, pero recomendado)
UPSTASH_REDIS_REST_URL=<url>
UPSTASH_REDIS_REST_TOKEN=<token>
LIDER_COOKIE=<cookie>
```

---

## 📊 Reportes y Salida

### Reporte de QA Típico
```
═══════════════════════════════════════════════════════════════════════
📈 QA Report Summary
═══════════════════════════════════════════════════════════════════════
Total Offers Analyzed:    500
Valid Offers:             485 (97.0%)
Offers with Errors:       15
Total Issues Found:       42
Categories:               14
Avg Discount:             23.5%
Price Range:              1290 - 24990 CLP
Missing Brands:           45
═══════════════════════════════════════════════════════════════════════

❌ ERRORS (6):          <- Deben corregirse
⚠️  WARNINGS (34):      <- Conviene revisar
ℹ️  INFO (2):           <- Solo información

✅ QA PASSED
```

### Códigos de Salida
- `0` = ✅ Validación exitosa
- `1` = ❌ Errores encontrados

---

## 🔧 Tarea 2: SCRAPE_LIMIT

### Cambio Realizado
```diff
.env.local:
- SCRAPE_LIMIT=10
+ SCRAPE_LIMIT=50
```

### Verificación
```bash
Get-Content .env.local | Select-String "SCRAPE_LIMIT"
# Output: SCRAPE_LIMIT=50
```

### Impacto
| Métrica | Antes | Después |
|---------|-------|---------|
| Ofertas/tienda | 10 | 50 |
| Total (6 tiendas) | 60 | 300 |
| Cobertura | ~33% | ~100% |

---

## 📁 Estructura de Archivos

```
Deali/
├── scripts/
│   ├── lib/
│   │   └── __tests__/
│   │       └── categoryMapper.test.ts     ← 24 tests
│   ├── scrapers/
│   │   ├── __fixtures__/
│   │   │   ├── jumboFixtures.ts           ← 24+5 ofertas
│   │   │   └── santaIsabelFixtures.ts     ← 24+5 ofertas
│   │   └── __tests__/
│   │       └── jumboSantaIsabel.test.ts   ← 14 tests
│   └── qa/
│       ├── validateOfferQuality.ts        ← Script principal
│       ├── __tests__/
│       │   └── validateOfferQuality.test.ts ← 14 tests
│       ├── README.md                      ← En inglés
│       └── README_ES.md                   ← En español
├── .env.local                             ← SCRAPE_LIMIT=50
└── DOCUMENTACION_TAREAS.md                ← Documentación completa
```

---

## ✅ Resumen de Cambios

| Tarea | Archivos | Tests | Estado |
|-------|----------|-------|--------|
| CategoryMapper | 1 | 24 | ✅ |
| SCRAPE_LIMIT | 1 | 0 | ✅ |
| Fixtures | 3 | 14 | ✅ |
| QA Script | 3 | 14 | ✅ |
| **TOTAL** | **8** | **52** | **✅** |

---

## 🎯 Próximos Pasos

1. **Ejecutar tests después de cambios en scraper**
   ```bash
   npm test
   ```

2. **Validar calidad de datos regularmente**
   ```bash
   npx tsx scripts/qa/validateOfferQuality.ts --strict
   ```

3. **Monitorear categorías**
   - Revisar reporte de categoryMapper si hay cambios en VTEX

4. **Expandir fixtures**
   - Agregar más ofertas según sea necesario
   - Agregar nuevas categorías cuando se descubran

---

## 📖 Documentación Disponible

- **`DOCUMENTACION_TAREAS.md`** - Documentación completa (este archivo)
- **`scripts/qa/README_ES.md`** - Guía detallada del script QA en español
- **`scripts/qa/README.md`** - Guía del script QA en inglés
- **Tests** - Archivo de tests contiene ejemplos de uso y validaciones

---

## 🆘 Solución de Problemas

### Tests fallando con "cannot find module"
```bash
# Limpiar caché de TypeScript
rm -r .tsx 2>$null || true
rm -r .next 2>$null || true
npm test
```

### Errores de conexión a Supabase en QA
```bash
# Verificar variables de entorno
Get-Content .env.local | Select-String "SUPABASE"

# Verificar credenciales en Supabase dashboard
# https://supabase.com/dashboard
```

### Tests del categoryMapper fallando
- Revisar `/no\s+alcoh|sin\s+alcoh/` en regex
- Verificar orden de RULES (específico antes de genérico)
- Asegurar acentos están capturados: `[aá]`, `[eé]`, etc.

---

## 📞 Contacto

Para preguntas sobre los scripts o tests:
1. Revisar los comentarios en el código
2. Ejecutar tests con `-v` para más detalles
3. Consultar los archivos README específicos
