# QA Validation Script

Post-scraping data quality validation for Deali offers.

## Usage

```bash
# Check all stores (100 offers, relaxed mode)
npx tsx scripts/qa/validateOfferQuality.ts

# Check specific store
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo

# Check with higher sample size
npx tsx scripts/qa/validateOfferQuality.ts --limit 500

# Strict validation mode (more stringent rules)
npx tsx scripts/qa/validateOfferQuality.ts --strict

# Combine options
npx tsx scripts/qa/validateOfferQuality.ts --store santa-isabel --limit 200 --strict
```

## Validation Rules

### Required Fields
- ✅ Product name (not empty, 5-300 chars)
- ✅ Offer URL (must be valid HTTP/HTTPS)
- ✅ Prices (both positive numbers)
- ✅ Category slug (matches canonical list)

### Price Validation
- ✅ Original price > 0
- ✅ Offer price > 0
- ✅ Original price ≥ Offer price
- ⚠️ Price range: 10-999,999 CLP (relaxed) / 100-500,000 CLP (strict)

### Discount Validation
- ⚠️ Relaxed: 0-95% off
- ⚠️ Strict: 5-80% off
- ✅ Flags unrealistic discounts

### Data Quality
- ⚠️ Image URL presence and format
- ℹ️ Brand information (optional but flagged if missing)
- ⚠️ Product name quality (too short/long)

### Canonical Categories
```
bebidas-alcoholicas, lacteos, carnes-pescados, frutas-verduras,
congelados, panaderia-pasteleria, snacks-galletas, cuidado-personal-bebe,
limpieza-hogar, bebidas, mascotas, electrohogar, bazar-hogar, despensa, general
```

## Report Output

The script generates a comprehensive report including:
- Total offers analyzed
- Valid vs invalid offers
- Issue summary (errors, warnings, info)
- Statistical data (avg discount, price range, categories found)
- Sample issues (if any found)

## Exit Codes

- `0`: QA Passed ✅
- `1`: QA Failed (errors found) ❌

## Examples

### Test with minimal data
```bash
npx tsx scripts/qa/validateOfferQuality.ts --limit 10
```

### Validate all Jumbo offers in strict mode
```bash
npx tsx scripts/qa/validateOfferQuality.ts --store jumbo --strict
```

### Full validation after scraping run
```bash
npx tsx scripts/qa/validateOfferQuality.ts --limit 1000 --strict
```

## Related

- Test fixtures: `scripts/scrapers/__fixtures__/jumboFixtures.ts`
- Fixture tests: `scripts/scrapers/__tests__/jumboSantaIsabel.test.ts`
- QA unit tests: `scripts/qa/__tests__/validateOfferQuality.test.ts`
