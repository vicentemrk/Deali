# Manual de Validación de Calidad (QA) - Deali Scraper

## Introducción

El script `validateOfferQuality.ts` realiza un análisis exhaustivo de la integridad y calidad de los datos de ofertas en Supabase. Es esencial ejecutarlo después de ciclos de scraping para detectar problemas de datos.

## ¿Por Qué es Importante?

**Sin validación:**
- ❌ Ofertas con precios inválidos (0, negativos, invertidos)
- ❌ Nombres de producto truncados o vacíos
- ❌ URLs rotas o mal formadas
- ❌ Categorías no canónicas que rompen búsquedas

**Con validación:**
- ✅ Detectar errores antes que usuarios los vean
- ✅ Mantener consistencia de datos en BD
- ✅ Registrar tendencias de calidad
- ✅ Automatizar controles de producción

## Instalación

### Requisitos Previos
```bash
# Node.js 18+ (recomendado 20+)
node --version

# npm instalado
npm --version
```

### Setup Inicial
```bash
# Clonar/navegar a repositorio
cd Deali

# Instalar dependencias
npm install

# Verificar variables de entorno
cat .env.local | grep SUPABASE
```

## Uso Básico

### Validación Rápida (2-5 segundos)
```bash
npx tsx scripts/qa/validateOfferQuality.ts
```

**Parámetros por defecto:**
- Todas las tiendas
- Primeras 100 ofertas
- Modo relajado

**Salida esperada:**
```
Total Offers Analyzed:    100
Valid Offers:             95 (95.0%)
Offers with Errors:       5
...
✅ QA PASSED
```

### Validación por Tienda (10-30 segundos)
```bash
# Validar solo Jumbo
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo

# Validar Santa Isabel
npx tsx scripts/qa/validateOfferQuality.ts --store santa-isabel

# Validar Lider
npx tsx scripts/qa/validateOfferQuality.ts --store lider

# Validar Tottus
npx tsx scripts/qa/validateOfferQuality.ts --store tottus
```

### Validación Ampliada (30-60 segundos)
```bash
# Validar 500 ofertas
npx tsx scripts/qa/validateOfferQuality.ts --limit 500

# Validar 1000 ofertas
npx tsx scripts/qa/validateOfferQuality.ts --limit 1000

# Validar TODAS (puede tardar minutos)
npx tsx scripts/qa/validateOfferQuality.ts --limit 100000
```

### Validación Estricta (reglas más rigurosas)
```bash
# Modo estricto en todas las tiendas
npx tsx scripts/qa/validateOfferQuality.ts --strict

# Modo estricto en Jumbo solamente
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo --strict

# Modo estricto con muestra grande
npx tsx scripts/qa/validateOfferQuality.ts --limit 500 --strict
```

## Parámetros de Línea de Comandos

| Parámetro | Tipo | Defecto | Descripción |
|-----------|------|---------|-------------|
| `--store` | string | todos | Tienda específica: jumbo, santa-isabel, lider, tottus, unimarc, acuenta |
| `--limit` | number | 100 | Número de ofertas a analizar |
| `--strict` | flag | false | Activar modo estricto (reglas más rigurosas) |

## Interpretación de Resultados

### Encabezado del Reporte
```
═════════════════════════════════════════════════════════════════════════
📈 QA Report Summary
═════════════════════════════════════════════════════════════════════════
```

### Métricas Principales
```
Total Offers Analyzed:    500      ← Ofertas examinadas
Valid Offers:             485      ← Ofertas sin errores
Offers with Errors:       15       ← Ofertas con errores CRÍTICOS
Total Issues Found:       42       ← Total de problemas (errores + advertencias)
Categories:               14       ← Categorías encontradas
Avg Discount:             23.5%    ← Promedio de descuento
Price Range:              1290 - 24990 CLP  ← Rango de precios
Missing Brands:           45       ← Productos sin marca (normal)
```

### Categorías Encontradas
```
Categories: 14 (bebidas, lacteos, carnes-pescados, frutas-verduras, 
congelados, panaderia-pasteleria, snacks-galletas, cuidado-personal-bebe, 
limpieza-hogar, bebidas, mascotas, electrohogar, bazar-hogar, despensa)
```

## Tipos de Problemas

### ❌ ERRORES (Deben Corregirse)

**MISSING_PRODUCT_NAME**
- Nombre del producto vacío o muy corto
- Causa: Error en parsing o scraping
- Acción: Revisar fuente y re-scrapear

**MISSING_OFFER_URL**
- URL de la oferta no se capturó
- Causa: Elemento no encontrado en HTML
- Acción: Verificar selector CSS en scraper

**INVALID_ORIGINAL_PRICE**
- Precio original ≤ 0 o no es número
- Causa: Parsing fallido de precio
- Acción: Revisar regex de extracción de precio

**INVALID_OFFER_PRICE**
- Precio de oferta ≤ 0 o no es número
- Causa: Parsing fallido de precio con descuento
- Acción: Revisar lógica de precio con descuento

**PRICE_RELATIONSHIP_ERROR**
- Precio original < Precio de oferta (lógicamente imposible)
- Causa: Inversión de precios durante scraping
- Acción: Verificar orden de captura de precios

**INVALID_CATEGORY**
- Categoría no está en lista canónica
- Causa: Fallo del categoryMapper
- Acción: Revisar mapeo de categoría en categoryMapper.ts

### ⚠️ ADVERTENCIAS (Revisar)

**DISCOUNT_TOO_LOW**
- Descuento < 5% en modo estricto (< 0% en relajado)
- Causa: Producto con descuento mínimo
- Acción: Verificar si realmente es una "oferta"

**DISCOUNT_SUSPICIOUS**
- Descuento > 80% en modo estricto (> 95% en relajado)
- Causa: Precio original erróneo o oferta especial
- Acción: Revisar manualmente, ¿es limpieza de inventario?

**PRICE_TOO_LOW**
- Precio < 10 CLP (relajado) o 100 CLP (estricto)
- Causa: Precio unitario o error de captura
- Acción: Revisar si es precio correcto

**PRICE_TOO_HIGH**
- Precio > 999,999 CLP (relajado) o 500,000 CLP (estricto)
- Causa: Producto premium o error de captura
- Acción: Verificar si es electrodoméstico o artículo de lujo

**MISSING_IMAGE_URL**
- Sin URL de imagen
- Causa: Imagen no disponible en fuente
- Acción: Usar imagen genérica de placeholder

**MALFORMED_IMAGE_URL**
- URL de imagen no comienza con http(s)
- Causa: Ruta relativa capturada incorrectamente
- Acción: Convertir rutas relativas a absolutas

**PRODUCT_NAME_TOO_SHORT**
- Nombre < 5 caracteres
- Causa: Fragmento de nombre o abreviación
- Acción: Revisar parsing del nombre

**PRODUCT_NAME_TOO_LONG**
- Nombre > 200 caracteres
- Causa: Captura de texto adicional
- Acción: Ajustar selector o regex de extracción

### ℹ️ INFORMACIÓN (Solo Notas)

**MISSING_BRAND**
- Campo de marca vacío
- Causa: Producto sin marca registrada (normal)
- Acción: Ninguna, es esperado

## Casos de Uso Reales

### Caso 1: Después de Scraping Diario
```bash
# Validación rápida de calidad
npx tsx scripts/qa/validateOfferQuality.ts --limit 200

# Si pasa: continuar
# Si falla: revisar logs del scraper
```

### Caso 2: Auditoría Pre-Producción
```bash
# Validación completa en modo estricto
npx tsx scripts/qa/validateOfferQuality.ts --limit 5000 --strict

# Solo si pasa: deploying a producción
```

### Caso 3: Problema Reportado en Tienda
```bash
# Investigar problema en tienda específica
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo --limit 1000

# Revisar errores y advertencias de esa tienda
```

### Caso 4: Validación Después de Cambios en CategoryMapper
```bash
# Asegurar que categorías siguen siendo válidas
npx tsx scripts/qa/validateOfferQuality.ts --limit 1000 --strict

# Revisar que no aumentaron ofertas con categoría 'general'
```

### Caso 5: Auditoría de Marca
```bash
# Ver cuántos productos no tienen marca
npx tsx scripts/qa/validateOfferQuality.ts --limit 2000

# Analizar el número de "Missing Brands"
# Si es demasiado alto, revisar parsing
```

## Mejores Prácticas

### 📋 Checklist Pre-Scraping
- [ ] `.env.local` actualizado con credenciales Supabase
- [ ] `SCRAPE_LIMIT` configurado a valor correcto (50)
- [ ] Últimos tests pasando: `npm test`

### 📋 Checklist Post-Scraping
- [ ] Ejecutar validación rápida: `validateOfferQuality.ts`
- [ ] Si hay errores: revisar logs de scraper
- [ ] Si pasa: ejecutar modo estricto
- [ ] Documentar cualquier advertencia inusual

### 📋 Checklist Pre-Producción
- [ ] Validación estricta en todas las tiendas
- [ ] Documentar cualquier descuento > 70%
- [ ] Revisar categorías no encontradas
- [ ] Última ejecución de tests completa

## Interpretación de Estadísticas

### Descuento Promedio
```
- 15-25%: Normal (ofertas típicas)
- 5-15%: Muy bajo (revisar si son reales descuentos)
- 25-40%: Bueno (oferta significativa)
- >40%: Alto (revisar manualmente)
```

### Rango de Precios
```
- Mínimo: Esperado 100-1000 CLP (snacks, bebidas pequeñas)
- Máximo: Esperado 50000-300000 CLP (electrodomésticos)
- Muy bajo (<10): Probablemente error
- Muy alto (>1M): Probablemente error
```

### Porcentaje de Ofertas Válidas
```
- >95%: Excelente ✅
- 85-95%: Bueno ✅
- 70-85%: Aceptable, revisar ⚠️
- <70%: Problemas críticos ❌
```

## Automatización

### Script Automático Diario
```bash
#!/bin/bash
# validate-daily.sh

echo "🚀 Iniciando validación diaria..."
npx tsx scripts/qa/validateOfferQuality.ts --limit 500 | tee qa-report-$(date +%Y%m%d).log

if [ $? -eq 0 ]; then
  echo "✅ Validación exitosa"
  exit 0
else
  echo "❌ Problemas detectados"
  # Enviar alerta
  exit 1
fi
```

### Ejecutar Vía Cron (Linux/Mac)
```bash
# Cada día a las 6 AM
0 6 * * * cd /path/to/Deali && npx tsx scripts/qa/validateOfferQuality.ts --limit 500
```

### Ejecutar Vía Task Scheduler (Windows)
1. Crear script PowerShell: `validate-qa.ps1`
2. Programar con Task Scheduler para ejecutarse diariamente
3. Registrar salida a archivo para auditoría

## Solución de Problemas

### ❌ "Cannot find module 'supabase-js'"
```bash
npm install @supabase/supabase-js
```

### ❌ "SUPABASE_SERVICE_ROLE_KEY not set"
```bash
# Verificar .env.local
echo $SUPABASE_SERVICE_ROLE_KEY

# Si no aparece, agregar a .env.local
SUPABASE_SERVICE_ROLE_KEY=<tu-clave>
```

### ❌ "No offers found"
```bash
# Verificar si hay ofertas en BD
# Tienda correcta: jumbo, santa-isabel, lider, tottus, unimarc, acuenta

# Aumentar límite
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo --limit 10000
```

### ❌ "Database connection timeout"
```bash
# Verificar conexión a Supabase
# Ir a https://supabase.com/dashboard

# Verificar URLs
grep SUPABASE_URL .env.local
```

## Próximas Mejoras

- [ ] Exportar reportes a CSV/JSON
- [ ] Dashboard web de visualización
- [ ] Alertas automáticas vía Slack/Email
- [ ] Histórico de tendencias de calidad
- [ ] Validación de cambios de precios
- [ ] Detección automática de duplicados

## Referencias

- **Documentación completa**: [DOCUMENTACION_TAREAS.md](../DOCUMENTACION_TAREAS.md)
- **Guía rápida**: [GUIA_RAPIDA.md](../GUIA_RAPIDA.md)
- **Script principal**: [scripts/qa/validateOfferQuality.ts](./validateOfferQuality.ts)
- **Tests**: [scripts/qa/__tests__/validateOfferQuality.test.ts](./__tests__/validateOfferQuality.test.ts)

---

**Última actualización**: Abril 2026
**Versión**: 1.0
**Autor**: Deali Development Team
