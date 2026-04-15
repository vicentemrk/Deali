# Script de Validación de Calidad de Datos (QA)

Validación de calidad de datos post-scraping para las ofertas de Deali.

## Descripción

El script `validateOfferQuality.ts` realiza un análisis exhaustivo de la calidad de los datos de ofertas almacenados en Supabase. Verifica:

- **Integridad de campos**: Que todos los campos obligatorios estén presentes y sean válidos
- **Validez de precios**: Que los precios sean positivos y lógicamente consistentes
- **Validez de descuentos**: Que los porcentajes de descuento sean razonables (5-80%)
- **Categorías canónicas**: Que todas las ofertas tengan categorías válidas
- **Calidad de URLs**: Que las URLs de producto e imagen sean válidas
- **Calidad de nombres**: Que los nombres de productos sean descriptivos y bien formados

## Instalación y Uso

### Requisitos

```bash
# Asegúrate de tener las dependencias instaladas
npm install
```

### Uso Básico

```bash
# Validar todas las tiendas (100 ofertas, modo relajado)
npx tsx scripts/qa/validateOfferQuality.ts

# Validar una tienda específica
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo
npx tsx scripts/qa/validateOfferQuality.ts --store santa-isabel
npx tsx scripts/qa/validateOfferQuality.ts --store lider
npx tsx scripts/qa/validateOfferQuality.ts --store tottus

# Aumentar el número de ofertas a validar
npx tsx scripts/qa/validateOfferQuality.ts --limit 500
npx tsx scripts/qa/validateOfferQuality.ts --limit 1000

# Modo estricto (reglas más rigurosas)
npx tsx scripts/qa/validateOfferQuality.ts --strict

# Combinar opciones
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo --limit 500 --strict
npx tsx scripts/qa/validateOfferQuality.ts --store santa-isabel --strict
```

## Reglas de Validación

### Modo Relajado (por defecto)
```
minDescuentoPorcentaje:  0%
maxDescuentoPorcentaje:  95%
minPrecioCLP:            10 CLP
maxPrecioCLP:            999,999 CLP
```

### Modo Estricto (--strict)
```
minDescuentoPorcentaje:  5%
maxDescuentoPorcentaje:  80%
minPrecioCLP:            100 CLP
maxPrecioCLP:            500,000 CLP
```

## Validaciones Realizadas

### 1. Campos Obligatorios
- ✅ **Nombre del Producto**: No vacío, entre 5-300 caracteres
- ✅ **URL de Oferta**: Formato HTTP/HTTPS válido
- ✅ **Precios**: Ambos deben ser números positivos
- ✅ **Categoría**: Debe estar en la lista canónica

### 2. Validación de Precios
- ✅ Precio original > 0
- ✅ Precio de oferta > 0
- ✅ Precio original ≥ Precio de oferta
- ✅ Dentro del rango de precios razonable

### 3. Validación de Descuentos
- ⚠️ Descuentos dentro del rango permitido (5-95% o 5-80% en modo estricto)
- ⚠️ Marca descuentos sospechosamente altos o bajos

### 4. Calidad de Datos
- ⚠️ Presencia y formato de URL de imagen
- ℹ️ Información de marca (opcional pero se reporta si falta)
- ⚠️ Calidad del nombre del producto (demasiado corto/largo)

### 5. Categorías Canónicas
```
bebidas-alcoholicas       - Vinos, cervezas, licores
lacteos                   - Leche, queso, yogur
carnes-pescados           - Carnes, aves, pescado
frutas-verduras           - Frutas y verduras frescas
congelados                - Productos congelados
panaderia-pasteleria      - Pan, pasteles
snacks-galletas           - Snacks, galletas, chocolate
cuidado-personal-bebe     - Higiene y cuidado personal
limpieza-hogar            - Productos de limpieza
bebidas                   - Bebidas sin alcohol
mascotas                  - Alimento y productos para mascotas
electrohogar              - Electrodomésticos
bazar-hogar               - Artículos para el hogar
despensa                  - Productos de despensa seca
general                   - Categoría por defecto
```

## Ejemplos de Uso

### Validación Rápida Después de Scraping
```bash
# Validar 100 ofertas de prueba
npx tsx scripts/qa/validateOfferQuality.ts --limit 100
```

### Validación Completa de Tienda
```bash
# Validar todas las ofertas de Jumbo
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo --limit 10000
```

### Validación Estricta Pre-Producción
```bash
# Modo estricto en todas las tiendas
npx tsx scripts/qa/validateOfferQuality.ts --strict --limit 2000
```

### Validación de Tienda Específica con Límite
```bash
# Santa Isabel, 500 ofertas, modo estricto
npx tsx scripts/qa/validateOfferQuality.ts --store santa-isabel --limit 500 --strict
```

## Interpretación del Reporte

### Resumen
```
Total de Ofertas Analizadas:  500
Ofertas Válidas:              485 (97.0%)
Ofertas con Errores:          15
Total de Problemas:           42
Categorías:                   14 (bebidas, lacteos, carnes-pescados, ...)
Descuento Promedio:           23.5%
Rango de Precios:             1,290 - 24,990 CLP
Marcas Faltantes:             45
```

### Tipos de Problemas

#### ❌ ERRORES (críticos - deben corregirse)
- `MISSING_PRODUCT_NAME` - Nombre del producto vacío
- `MISSING_OFFER_URL` - URL de la oferta faltante
- `INVALID_ORIGINAL_PRICE` - Precio original inválido
- `INVALID_OFFER_PRICE` - Precio de oferta inválido
- `PRICE_RELATIONSHIP_ERROR` - Precio original < Precio de oferta
- `INVALID_CATEGORY` - Categoría no canónica

#### ⚠️ ADVERTENCIAS (conviene revisar)
- `PRICE_TOO_LOW` - Precio por debajo del mínimo razonable
- `PRICE_TOO_HIGH` - Precio por encima del máximo razonable
- `DISCOUNT_TOO_LOW` - Descuento muy bajo para una "oferta"
- `DISCOUNT_SUSPICIOUS` - Descuento sospechosamente alto
- `MISSING_IMAGE_URL` - URL de imagen faltante
- `MALFORMED_IMAGE_URL` - Formato de URL de imagen inválido
- `PRODUCT_NAME_TOO_SHORT` - Nombre de producto muy corto (<5 caracteres)
- `PRODUCT_NAME_TOO_LONG` - Nombre de producto muy largo (>200 caracteres)

#### ℹ️ INFORMACIÓN (notas)
- `MISSING_BRAND` - Campo de marca vacío (común en productos sin marca)

## Códigos de Salida

- **`0`** ✅ Validación exitosa (sin errores críticos)
- **`1`** ❌ Validación fallida (se encontraron errores)

## Archivos Relacionados

- **Script principal**: `scripts/qa/validateOfferQuality.ts`
- **Tests unitarios**: `scripts/qa/__tests__/validateOfferQuality.test.ts`
- **Fixtures de prueba - Jumbo**: `scripts/scrapers/__fixtures__/jumboFixtures.ts`
- **Fixtures de prueba - Santa Isabel**: `scripts/scrapers/__fixtures__/santaIsabelFixtures.ts`
- **Tests de fixtures**: `scripts/scrapers/__tests__/jumboSantaIsabel.test.ts`

## Ejecución de Tests

```bash
# Ejecutar tests del QA
npx tsx --test scripts/qa/__tests__/validateOfferQuality.test.ts

# Ejecutar tests de fixtures
npx tsx --test scripts/scrapers/__tests__/jumboSantaIsabel.test.ts

# Ejecutar todos los tests
npm test
```

## Configuración de Variables de Entorno

El script requiere las siguientes variables en `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://dcqmradooboptlijuarc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tu-clave-aqui>
```

## Casos de Uso Comunes

### 1. Validación Post-Scraping Rápida
```bash
# Después de ejecutar el scraper, validar 200 ofertas
npx tsx scripts/qa/validateOfferQuality.ts --limit 200
```

### 2. Auditoría de Datos Existentes
```bash
# Validación exhaustiva de todas las ofertas en la BD
npx tsx scripts/qa/validateOfferQuality.ts --limit 10000 --strict
```

### 3. Validación por Tienda
```bash
# Auditar Jumbo en modo estricto
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo --strict --limit 5000
```

### 4. Verificación de Integridad
```bash
# Verificación rápida de consistencia
npx tsx scripts/qa/validateOfferQuality.ts --limit 50
```

## Mejoras Futuras

- [ ] Exportar reportes a CSV/JSON para análisis
- [ ] Dashboard de visualización de calidad de datos
- [ ] Alertas automáticas para problemas críticos
- [ ] Historial de tendencias de calidad
- [ ] Validación de actualizaciones de precios
- [ ] Análisis de duplicados de productos

## Preguntas Frecuentes

### ¿Qué significa "Descuento Sospechosamente Alto"?
Cuando el descuento excede el 80% en modo estricto (95% en modo relajado), es probable que:
- El precio original fue ingresado incorrectamente
- El producto tiene un problema de escalado de precio
- Es una oferta especial (clearance) que debe revisarse manualmente

### ¿Por qué falta el campo de marca?
Muchos productos al por mayor o sin marca registrada no tienen campo de marca. Esto es normal y se reporta como información, no como error.

### ¿Qué rango de precios es razonable?
- **Mínimo**: 10 CLP (relajado) / 100 CLP (estricto)
- **Máximo**: 999,999 CLP (relajado) / 500,000 CLP (estricto)

Estos rangos se pueden ajustar según necesidades específicas.

## Soporte

Para problemas o sugerencias sobre el script de QA:
1. Revisar los tests en `scripts/qa/__tests__/validateOfferQuality.test.ts`
2. Consultar la documentación de tipos en `scripts/qa/validateOfferQuality.ts`
3. Ejecutar el script con `--limit 10` para diagnóstico rápido
