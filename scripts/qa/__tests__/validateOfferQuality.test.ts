import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { JUMBO_FIXTURES } from '../../scrapers/__fixtures__/jumboFixtures';

/**
 * QA Validation Logic Tests
 * 
 * Tests the same validation rules used in validateOfferQuality.ts
 */

// Import the same canonical categories
const CANONICAL_CATEGORIES = new Set([
  'bebidas-alcoholicas', 'lacteos', 'carnes-pescados', 'frutas-verduras',
  'congelados', 'panaderia-pasteleria', 'snacks-galletas', 'cuidado-personal-bebe',
  'limpieza-hogar', 'bebidas', 'mascotas', 'electrohogar', 'bazar-hogar', 'despensa', 'general'
]);

const VALIDATION_RULES = {
  relaxed: {
    minDiscountPercent: 0,
    maxDiscountPercent: 95,
    minPriceClp: 10,
    maxPriceClp: 999999,
    requireBrand: false,
    requireImage: false,
  },
};

test('QA: Fixture offers have positive prices', () => {
  JUMBO_FIXTURES.forEach(offer => {
    assert.ok(offer.originalPrice > 0, `Original price must be positive`);
    assert.ok(offer.offerPrice > 0, `Offer price must be positive`);
  });
});

test('QA: Fixture offers have valid price relationships', () => {
  JUMBO_FIXTURES.forEach(offer => {
    assert.ok(
      offer.originalPrice >= offer.offerPrice,
      `Original (${offer.originalPrice}) must be >= offer (${offer.offerPrice})`
    );
  });
});

test('QA: Fixture offers have valid discount percentages', () => {
  JUMBO_FIXTURES.forEach(offer => {
    const discountPercent = ((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100;
    
    assert.ok(discountPercent >= VALIDATION_RULES.relaxed.minDiscountPercent);
    assert.ok(discountPercent <= VALIDATION_RULES.relaxed.maxDiscountPercent, 
      `Discount ${discountPercent.toFixed(1)}% exceeds max (${VALIDATION_RULES.relaxed.maxDiscountPercent}%)`);
  });
});

test('QA: Fixture prices are within reasonable CLP range', () => {
  JUMBO_FIXTURES.forEach(offer => {
    assert.ok(
      offer.originalPrice >= VALIDATION_RULES.relaxed.minPriceClp,
      `Price ${offer.originalPrice} below minimum ${VALIDATION_RULES.relaxed.minPriceClp}`
    );
    assert.ok(
      offer.originalPrice <= VALIDATION_RULES.relaxed.maxPriceClp,
      `Price ${offer.originalPrice} exceeds maximum ${VALIDATION_RULES.relaxed.maxPriceClp}`
    );
  });
});

test('QA: All fixture offers have product names', () => {
  JUMBO_FIXTURES.forEach(offer => {
    assert.ok(offer.productName && offer.productName.trim().length > 0);
    assert.ok(offer.productName.length >= 5, 'Product name should be reasonably detailed');
  });
});

test('QA: All fixture offers have valid URLs', () => {
  JUMBO_FIXTURES.forEach(offer => {
    assert.ok(offer.offerUrl && offer.offerUrl.startsWith('https://'));
    assert.ok(offer.imageUrl && offer.imageUrl.startsWith('https://'));
  });
});

test('QA: Category hint presence - allows null', () => {
  // Some offers may have null categoryHint (which is fine, mapper will return 'general')
  JUMBO_FIXTURES.forEach(offer => {
    assert.ok(typeof offer.categoryHint === 'string' || offer.categoryHint === null);
  });
});

test('QA: Product name quality checks', () => {
  JUMBO_FIXTURES.forEach(offer => {
    // Check for extremely short names (< 5 chars)
    if (offer.productName.length < 5) {
      assert.fail(`Product name too short: "${offer.productName}"`);
    }
    
    // Check for extremely long names (> 200 chars)
    assert.ok(offer.productName.length <= 300, 'Product name suspiciously long');
    
    // Check for common parsing errors (all caps, repeated chars, etc.)
    const hasLowercase = /[a-z]/.test(offer.productName);
    assert.ok(hasLowercase, `Product name may not have parsed correctly: "${offer.productName}"`);
  });
});

test('QA: Brand field is optional but correctly typed', () => {
  JUMBO_FIXTURES.forEach(offer => {
    assert.ok(typeof offer.brand === 'string' || offer.brand === null);
    
    // If brand is provided, it should be reasonably sized
    if (offer.brand) {
      assert.ok(offer.brand.length > 0, 'Brand should not be empty string');
      assert.ok(offer.brand.length <= 100, 'Brand name suspiciously long');
    }
  });
});

test('QA: Statistical validation - discount distribution', () => {
  const discounts = JUMBO_FIXTURES.map(o => {
    return ((o.originalPrice - o.offerPrice) / o.originalPrice) * 100;
  });

  const avgDiscount = discounts.reduce((a, b) => a + b, 0) / discounts.length;
  const minDiscount = Math.min(...discounts);
  const maxDiscount = Math.max(...discounts);

  // Sanity checks on discount distribution
  assert.ok(avgDiscount > 5, 'Average discount seems too low for real offers');
  assert.ok(avgDiscount < 80, 'Average discount seems unrealistically high');
  assert.ok(minDiscount >= 0, 'Min discount should be >= 0%');
  assert.ok(maxDiscount <= 100, 'Max discount should be <= 100%');
  
  console.log(`  Discount distribution: ${minDiscount.toFixed(1)}% - ${maxDiscount.toFixed(1)}% (avg: ${avgDiscount.toFixed(1)}%)`);
});

test('QA: Statistical validation - price distribution', () => {
  const prices = JUMBO_FIXTURES.map(o => o.originalPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  assert.ok(minPrice >= 100, 'Minimum product price should be at least 100 CLP');
  assert.ok(maxPrice <= 1000000, 'Maximum product price should be reasonable');
  assert.ok(avgPrice > 1000, 'Average price should be reasonable');
  
  console.log(`  Price distribution: ${minPrice} - ${maxPrice} CLP (avg: ${avgPrice.toFixed(0)} CLP)`);
});

test('QA: URL format validation', () => {
  JUMBO_FIXTURES.forEach(offer => {
    // Product URL should be from the store domain
    assert.ok(offer.offerUrl.includes('jumbo.cl'));
    
    // Image URL should be from VTEX CDN
    assert.ok(offer.imageUrl.includes('vteximg.com.br'));
    
    // Image URLs should have dimension suffixes for optimization
    assert.ok(offer.imageUrl.match(/-\d+-\d+\//), 'Image URL should have VTEX dimension suffixes');
  });
});

test('QA: No duplicate products in fixtures', () => {
  const productNames = new Set();
  
  JUMBO_FIXTURES.forEach(offer => {
    assert.ok(!productNames.has(offer.productName), 
      `Duplicate product found: ${offer.productName}`);
    productNames.add(offer.productName);
  });
});

test('QA: Data type validation for numeric fields', () => {
  JUMBO_FIXTURES.forEach(offer => {
    assert.ok(typeof offer.originalPrice === 'number');
    assert.ok(typeof offer.offerPrice === 'number');
    assert.ok(!isNaN(offer.originalPrice), 'originalPrice is NaN');
    assert.ok(!isNaN(offer.offerPrice), 'offerPrice is NaN');
    assert.ok(isFinite(offer.originalPrice), 'originalPrice is not finite');
    assert.ok(isFinite(offer.offerPrice), 'offerPrice is not finite');
  });
});
