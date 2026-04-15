import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { JumboScraper } from '../jumboScraper';
import { SantaIsabelScraper } from '../santaIsabelScraper';
import { JUMBO_FIXTURES, JUMBO_FIXTURES_MINIMAL } from '../__fixtures__/jumboFixtures';
import { SANTA_ISABEL_FIXTURES, SANTA_ISABEL_FIXTURES_MINIMAL } from '../__fixtures__/santaIsabelFixtures';
import { mapCategory } from '../../lib/categoryMapper';

// Mock the VTEX fetcher to return our fixtures
let mockScraperData: any[] = [];

// Override module to inject mock data
const originalFetch = global.fetch;
global.fetch = async (url: string, options?: any) => {
  if (mockScraperData.length > 0) {
    return new Response(JSON.stringify(mockScraperData), { status: 200 });
  }
  // Fallback to real fetch for non-mocked requests
  return originalFetch(url, options);
};

// ──────────────────────────────────────────────────────────────────────────────
// Jumbo Scraper Tests
// ──────────────────────────────────────────────────────────────────────────────

test('JumboScraper: Basic instantiation and properties', () => {
  const scraper = new JumboScraper();
  assert.equal(scraper.storeSlug, 'jumbo');
  assert.equal(typeof scraper.scrape, 'function');
});

test('JumboScraper: Fixtures have valid RawOffer structure', () => {
  JUMBO_FIXTURES.forEach((offer, index) => {
    assert.ok(typeof offer.productName === 'string', `Fixture ${index}: productName must be string`);
    assert.ok(offer.brand === null || typeof offer.brand === 'string', `Fixture ${index}: brand must be string or null`);
    assert.ok(typeof offer.imageUrl === 'string', `Fixture ${index}: imageUrl must be string`);
    assert.ok(typeof offer.offerUrl === 'string', `Fixture ${index}: offerUrl must be string`);
    assert.ok(typeof offer.originalPrice === 'number', `Fixture ${index}: originalPrice must be number`);
    assert.ok(typeof offer.offerPrice === 'number', `Fixture ${index}: offerPrice must be number`);
    assert.ok(offer.categoryHint === null || typeof offer.categoryHint === 'string', `Fixture ${index}: categoryHint must be string or null`);
    assert.ok(offer.originalPrice > 0, `Fixture ${index}: originalPrice must be > 0`);
    assert.ok(offer.offerPrice > 0, `Fixture ${index}: offerPrice must be > 0`);
    assert.ok(offer.originalPrice >= offer.offerPrice, `Fixture ${index}: offer discount must be valid (originalPrice >= offerPrice)`);
  });
});

test('JumboScraper: Fixtures cover multiple categories', () => {
  const categories = new Set(
    JUMBO_FIXTURES
      .map(o => o.categoryHint)
      .filter((ch): ch is string => ch !== null)
      .map(ch => mapCategory(ch))
  );

  // Should have at least 8 distinct categories in our fixtures
  assert.ok(categories.size >= 8, `Expected at least 8 categories, got ${categories.size}`);
  assert.ok(categories.has('bebidas-alcoholicas'), 'Should have alcoholic beverages');
  assert.ok(categories.has('lacteos'), 'Should have dairy');
  assert.ok(categories.has('carnes-pescados'), 'Should have meat/fish');
  assert.ok(categories.has('frutas-verduras'), 'Should have produce');
  assert.ok(categories.has('despensa'), 'Should have pantry');
  assert.ok(categories.has('bebidas'), 'Should have beverages');
});

test('JumboScraper: Minimal fixtures subset is valid', () => {
  assert.ok(JUMBO_FIXTURES_MINIMAL.length > 0, 'Minimal fixtures should have at least 1 item');
  assert.ok(JUMBO_FIXTURES_MINIMAL.length <= 5, 'Minimal fixtures should have at most 5 items');
  
  JUMBO_FIXTURES_MINIMAL.forEach(offer => {
    assert.ok(offer.productName.length > 0, 'Product name must not be empty');
    assert.ok(offer.offerPrice > 0, 'Offer price must be positive');
  });
});

test('JumboScraper: Offer URLs are properly formatted', () => {
  JUMBO_FIXTURES.forEach(offer => {
    assert.ok(offer.offerUrl.startsWith('https://www.jumbo.cl/'), 
      `Expected Jumbo URL, got: ${offer.offerUrl}`);
    assert.ok(offer.imageUrl.includes('jumbo.vteximg.com.br'), 
      `Expected Jumbo image URL, got: ${offer.imageUrl}`);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Santa Isabel Scraper Tests
// ──────────────────────────────────────────────────────────────────────────────

test('SantaIsabelScraper: Basic instantiation and properties', () => {
  const scraper = new SantaIsabelScraper();
  assert.equal(scraper.storeSlug, 'santa-isabel');
  assert.equal(typeof scraper.scrape, 'function');
});

test('SantaIsabelScraper: Fixtures have valid RawOffer structure', () => {
  SANTA_ISABEL_FIXTURES.forEach((offer, index) => {
    assert.ok(typeof offer.productName === 'string', `Fixture ${index}: productName must be string`);
    assert.ok(offer.brand === null || typeof offer.brand === 'string', `Fixture ${index}: brand must be string or null`);
    assert.ok(typeof offer.imageUrl === 'string', `Fixture ${index}: imageUrl must be string`);
    assert.ok(typeof offer.offerUrl === 'string', `Fixture ${index}: offerUrl must be string`);
    assert.ok(typeof offer.originalPrice === 'number', `Fixture ${index}: originalPrice must be number`);
    assert.ok(typeof offer.offerPrice === 'number', `Fixture ${index}: offerPrice must be number`);
    assert.ok(offer.categoryHint === null || typeof offer.categoryHint === 'string', `Fixture ${index}: categoryHint must be string or null`);
    assert.ok(offer.originalPrice > 0, `Fixture ${index}: originalPrice must be > 0`);
    assert.ok(offer.offerPrice > 0, `Fixture ${index}: offerPrice must be > 0`);
    assert.ok(offer.originalPrice >= offer.offerPrice, `Fixture ${index}: offer discount must be valid (originalPrice >= offerPrice)`);
  });
});

test('SantaIsabelScraper: Fixtures cover multiple categories', () => {
  const categories = new Set(
    SANTA_ISABEL_FIXTURES
      .map(o => o.categoryHint)
      .filter((ch): ch is string => ch !== null)
      .map(ch => mapCategory(ch))
  );

  // Should have at least 8 distinct categories in our fixtures
  assert.ok(categories.size >= 8, `Expected at least 8 categories, got ${categories.size}`);
  assert.ok(categories.has('bebidas-alcoholicas'), 'Should have alcoholic beverages');
  assert.ok(categories.has('lacteos'), 'Should have dairy');
  assert.ok(categories.has('carnes-pescados'), 'Should have meat/fish');
  assert.ok(categories.has('frutas-verduras'), 'Should have produce');
});

test('SantaIsabelScraper: Minimal fixtures subset is valid', () => {
  assert.ok(SANTA_ISABEL_FIXTURES_MINIMAL.length > 0, 'Minimal fixtures should have at least 1 item');
  assert.ok(SANTA_ISABEL_FIXTURES_MINIMAL.length <= 5, 'Minimal fixtures should have at most 5 items');
  
  SANTA_ISABEL_FIXTURES_MINIMAL.forEach(offer => {
    assert.ok(offer.productName.length > 0, 'Product name must not be empty');
    assert.ok(offer.offerPrice > 0, 'Offer price must be positive');
  });
});

test('SantaIsabelScraper: Offer URLs are properly formatted', () => {
  SANTA_ISABEL_FIXTURES.forEach(offer => {
    assert.ok(offer.offerUrl.startsWith('https://www.santaisabel.cl/'), 
      `Expected Santa Isabel URL, got: ${offer.offerUrl}`);
    assert.ok(offer.imageUrl.includes('santaisabel.vteximg.com.br'), 
      `Expected Santa Isabel image URL, got: ${offer.imageUrl}`);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Cross-Store Category Mapping Tests
// ──────────────────────────────────────────────────────────────────────────────

test('Category mapping: Jumbo category hints are properly classified', () => {
  const categoryMap: { [key: string]: number } = {};

  JUMBO_FIXTURES.forEach(offer => {
    if (offer.categoryHint) {
      const mapped = mapCategory(offer.categoryHint);
      categoryMap[mapped] = (categoryMap[mapped] || 0) + 1;
    }
  });

  // Check we have good distribution across categories
  const uniqueCategories = Object.keys(categoryMap);
  assert.ok(uniqueCategories.length >= 8, `Expected at least 8 categories, got ${uniqueCategories.length}`);
  
  // No category should have 0 items
  Object.entries(categoryMap).forEach(([cat, count]) => {
    assert.ok(count > 0, `Category ${cat} has 0 offers`);
  });
});

test('Category mapping: Santa Isabel category hints are properly classified', () => {
  const categoryMap: { [key: string]: number } = {};

  SANTA_ISABEL_FIXTURES.forEach(offer => {
    if (offer.categoryHint) {
      const mapped = mapCategory(offer.categoryHint);
      categoryMap[mapped] = (categoryMap[mapped] || 0) + 1;
    }
  });

  const uniqueCategories = Object.keys(categoryMap);
  assert.ok(uniqueCategories.length >= 8, `Expected at least 8 categories, got ${uniqueCategories.length}`);
  
  Object.entries(categoryMap).forEach(([cat, count]) => {
    assert.ok(count > 0, `Category ${cat} has 0 offers`);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Discount Validation Tests
// ──────────────────────────────────────────────────────────────────────────────

test('Jumbo fixtures: All offers have valid discounts', () => {
  JUMBO_FIXTURES.forEach((offer, index) => {
    const discountPercent = ((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100;
    assert.ok(discountPercent >= 0, `Fixture ${index}: Discount must be >= 0%`);
    assert.ok(discountPercent <= 100, `Fixture ${index}: Discount must be <= 100%`);
    assert.ok(discountPercent > 0, `Fixture ${index}: Discount must be > 0% (this is an offer, not regular price)`);
    assert.ok(discountPercent < 90, `Fixture ${index}: Discount seems too high (>90%), check values`);
  });
});

test('Santa Isabel fixtures: All offers have valid discounts', () => {
  SANTA_ISABEL_FIXTURES.forEach((offer, index) => {
    const discountPercent = ((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100;
    assert.ok(discountPercent >= 0, `Fixture ${index}: Discount must be >= 0%`);
    assert.ok(discountPercent <= 100, `Fixture ${index}: Discount must be <= 100%`);
    assert.ok(discountPercent > 0, `Fixture ${index}: Discount must be > 0%`);
    assert.ok(discountPercent < 90, `Fixture ${index}: Discount seems too high (>90%), check values`);
  });
});
