# 📚 Índice de Documentación - Deali Scraper

## Documentación General (En Español)

### 🎯 Punto de Entrada
- **[GUIA_RAPIDA.md](GUIA_RAPIDA.md)** ← **EMPIEZA AQUÍ**
  - Inicio rápido con 5 minutos
  - Cómo ejecutar tests y scripts
  - Configuración básica

### 📖 Documentación Completa
- **[DOCUMENTACION_TAREAS.md](DOCUMENTACION_TAREAS.md)**
  - Descripción detallada de las 4 tareas completadas
  - Problemas encontrados y soluciones
  - Estructura de archivos creados
  - Estadísticas de tests (52 tests, 100% pasando)

---

## Documentación del Script QA

### 📋 Para Usuarios (Operacional)
- **[scripts/qa/MANUAL_QA_ES.md](scripts/qa/MANUAL_QA_ES.md)** ← **MANUAL PRINCIPAL**
  - Guía completa de uso
  - Casos de uso reales
  - Interpretación de reportes
  - Automatización
  - Solución de problemas

### 🔧 Para Desarrolladores (Referencia)
- **[scripts/qa/README_ES.md](scripts/qa/README_ES.md)** 
  - Descripción técnica del script
  - Reglas de validación detalladas
  - Ejemplos de uso para desarrollo
  - Preguntas frecuentes

- **[scripts/qa/README.md](scripts/qa/README.md)** (Inglés)
  - Documentación en inglés del script
  - Misma información que README_ES.md

---

## Tests Documentados

### 📊 CategoryMapper Tests
**Archivo**: `scripts/lib/__tests__/categoryMapper.test.ts`
- 24 tests unitarios
- Validación de normalización de categorías
- Cobertura: todas las 14 categorías canónicas

### 📊 Parser Fixtures Tests
**Archivo**: `scripts/scrapers/__tests__/jumboSantaIsabel.test.ts`
- 14 tests unitarios
- Validación de datos realistas
- Fixtures: Jumbo (24+5) y Santa Isabel (24+5)

### 📊 QA Validation Tests
**Archivo**: `scripts/qa/__tests__/validateOfferQuality.test.ts`
- 14 tests unitarios
- Validación de reglas QA
- Cobertura: precios, descuentos, categorías, URLs

---

## Archivos de Configuración

### 🔐 Secretos (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://dcqmradooboptlijuarc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<clave>
SCRAPE_LIMIT=50  # Antes era 10
TOTTUS_COOKIE=<cookie>
LIDER_COOKIE=<cookie>
```

---

## Estructura de Directorios Creados

```
Deali/
├── DOCUMENTACION_TAREAS.md           📚 Documentación ejecutiva
├── GUIA_RAPIDA.md                    📚 Guía de inicio rápido
│
└── scripts/
    ├── lib/
    │   └── __tests__/
    │       └── categoryMapper.test.ts (24 tests)
    │
    ├── scrapers/
    │   ├── __fixtures__/
    │   │   ├── jumboFixtures.ts       (24 + 5 ofertas)
    │   │   └── santaIsabelFixtures.ts (24 + 5 ofertas)
    │   └── __tests__/
    │       └── jumboSantaIsabel.test.ts (14 tests)
    │
    └── qa/
        ├── validateOfferQuality.ts      (Script principal)
        ├── MANUAL_QA_ES.md              📚 Manual operativo (IMPORTANTE)
        ├── README_ES.md                 📚 Referencia técnica (español)
        ├── README.md                    📚 Referencia técnica (inglés)
        └── __tests__/
            └── validateOfferQuality.test.ts (14 tests)
```

---

## Tareas Completadas

### ✅ Tarea 1: CategoryMapper Unit Tests
- **Ubicación**: `scripts/lib/__tests__/categoryMapper.test.ts`
- **Tests**: 24 (todos pasando)
- **Cobertura**: 14 categorías + edge cases

### ✅ Tarea 2: SCRAPE_LIMIT → 50
- **Cambio**: `.env.local` `SCRAPE_LIMIT=10` → `SCRAPE_LIMIT=50`
- **Impacto**: 5x más ofertas por tienda (60 → 300 total/ciclo)

### ✅ Tarea 3: Parser Fixtures
- **Ubicación**: `scripts/scrapers/__fixtures__/` y `__tests__/`
- **Tests**: 14 (todos pasando)
- **Fixtures**: 48 ofertas realistas (Jumbo + Santa Isabel)

### ✅ Tarea 4: QA Script
- **Ubicación**: `scripts/qa/`
- **Tests**: 14 (todos pasando)
- **Validaciones**: 14 reglas de integridad de datos

---

## Flujo de Trabajo Recomendado

### 1. Primer Uso (5 minutos)
```
1. Leer: GUIA_RAPIDA.md
2. Ejecutar: npm test
3. Revisar salida
```

### 2. Uso Diario (2-3 minutos)
```
1. Post-scraping: npx tsx scripts/qa/validateOfferQuality.ts
2. Si hay errores: revisar MANUAL_QA_ES.md
3. Continuar con siguiente ciclo
```

### 3. Investigación (5-15 minutos)
```
1. Consultar: DOCUMENTACION_TAREAS.md
2. Revisar tests específicos
3. Ajustar parámetros de QA script
```

### 4. Troubleshooting (10-20 minutos)
```
1. Revisar: MANUAL_QA_ES.md sección "Solución de Problemas"
2. Ejecutar tests de la sección específica
3. Revisar logs del scraper
```

---

## Referencia Rápida de Comandos

### Tests
```bash
# Todos los tests
npm test

# Tests específicos
npx tsx --test scripts/lib/__tests__/categoryMapper.test.ts
npx tsx --test scripts/scrapers/__tests__/jumboSantaIsabel.test.ts
npx tsx --test scripts/qa/__tests__/validateOfferQuality.test.ts
```

### QA Script
```bash
# Validación rápida
npx tsx scripts/qa/validateOfferQuality.ts

# Por tienda
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo

# Con limite
npx tsx scripts/qa/validateOfferQuality.ts --limit 500

# Modo estricto
npx tsx scripts/qa/validateOfferQuality.ts --strict

# Combinado
npx tsx scripts/qa/validateOfferQuality.ts --store santa-isabel --limit 1000 --strict
```

---

## Preguntas Frecuentes

### ¿Por dónde empiezo?
→ Leer [GUIA_RAPIDA.md](GUIA_RAPIDA.md)

### ¿Cómo funciona el script QA?
→ Leer [MANUAL_QA_ES.md](scripts/qa/MANUAL_QA_ES.md)

### ¿Qué categorías son válidas?
→ Ver [scripts/qa/README_ES.md](scripts/qa/README_ES.md) sección "Categorías Canónicas"

### ¿Qué significan los errores QA?
→ Ver [MANUAL_QA_ES.md](scripts/qa/MANUAL_QA_ES.md) sección "Tipos de Problemas"

### ¿Cómo automatizar QA?
→ Ver [MANUAL_QA_ES.md](scripts/qa/MANUAL_QA_ES.md) sección "Automatización"

### ¿Cuáles son las 14 categorías?
```
bebidas-alcoholicas, lacteos, carnes-pescados, frutas-verduras,
congelados, panaderia-pasteleria, snacks-galletas, cuidado-personal-bebe,
limpieza-hogar, bebidas, mascotas, electrohogar, bazar-hogar, despensa
```

---

## Estadísticas Generales

| Métrica | Valor |
|---------|-------|
| Tests Totales | 52 |
| Tests Pasando | 52 (100%) |
| Líneas de Código de Tests | ~1,200 |
| Líneas de Documentación | ~1,500 |
| Archivos Creados | 12 |
| Archivos Modificados | 1 (.env.local) |
| Tiempos de Ejecución de Tests | ~1.5 segundos |

---

## Mejoras Futuras

- [ ] Dashboard web para visualizar QA reports
- [ ] Exportar reportes a CSV/JSON/PDF
- [ ] Alertas automáticas vía Slack/Email
- [ ] Histórico de tendencias de calidad
- [ ] Validación de cambios de precios
- [ ] Detección automática de duplicados
- [ ] Métricas de velocidad de scraping

---

## Información de Contacto

**Proyecto**: Deali Scraper
**Tecnologías**: Node.js, TypeScript, Supabase, Next.js
**Repositorio**: https://github.com/vicentemrk/Deali
**Versión**: 1.0 (Abril 2026)

---

## 🔗 Enlaces Importantes

- [Documentación Supabase](https://supabase.com/docs)
- [Documentación Next.js](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Test Runner](https://nodejs.org/api/test.html)

---

**Última actualización**: Abril 2026
**Estado**: Completa ✅
**Disponible en**: Español 🇪🇸
