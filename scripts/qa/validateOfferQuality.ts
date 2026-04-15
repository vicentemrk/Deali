/**
 * scripts/qa/validateOfferQuality.ts
 *
 * Post-scraping data quality validation script.
 * Analyzes offers from Supabase and reports:
 * - Data completeness (required fields present)
 * - Price validity (positive, logical relationships)
 * - Discount reasonableness (5-80% range)
 * - Category accuracy (matches canonical slugs)
 * - Image URL integrity
 * - Brand and product name quality
 *
 * Usage:
 *   npx tsx scripts/qa/validateOfferQuality.ts [--store STORE] [--limit N] [--strict]
 *
 * Examples:
 *   npx tsx scripts/qa/validateOfferQuality.ts                 # All stores, 100 offers
 *   npx tsx scripts/qa/validateOfferQuality.ts --store jumbo   # Jumbo only, 100 offers
 *   npx tsx scripts/qa/validateOfferQuality.ts --limit 500     # All stores, 500 offers
 *   npx tsx scripts/qa/validateOfferQuality.ts --strict        # Stricter validation rules
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface QAIssue {
  offerId: string;
  productName: string;
  storeSlug: string;
  category: string;
  severity: 'error' | 'warning' | 'info';
  type: string;
  message: string;
  value?: any;
  expected?: any;
}

interface QAReport {
  timestamp: string;
  storeSlug?: string;
  totalOffers: number;
  validOffers: number;
  invalidOffers: number;
  issues: QAIssue[];
  statistics: {
    avgDiscountPercent: number;
    minOriginalPrice: number;
    maxOriginalPrice: number;
    categoriesFound: string[];
    brandsWithMissing: number;
    imagesWithErrors: number;
  };
}

interface Offer {
  id: string;
  product_name: string;
  brand: string | null;
  image_url: string;
  offer_url: string;
  original_price: number;
  offer_price: number;
  category_slug: string;
  store_slug: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const CANONICAL_CATEGORIES = new Set([
  'bebidas-alcoholicas', 'lacteos', 'carnes-pescados', 'frutas-verduras',
  'congelados', 'panaderia-pasteleria', 'snacks-galletas', 'cuidado-personal-bebe',
  'limpieza-hogar', 'bebidas', 'mascotas', 'electrohogar', 'bazar-hogar', 'despensa', 'general'
]);

const VALIDATION_RULES = {
  strict: {
    minDiscountPercent: 5,
    maxDiscountPercent: 80,
    minPriceClp: 100,
    maxPriceClp: 500000,
    requireBrand: false,
    requireImage: true,
  },
  relaxed: {
    minDiscountPercent: 0,
    maxDiscountPercent: 95,
    minPriceClp: 10,
    maxPriceClp: 999999,
    requireBrand: false,
    requireImage: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Validation Functions
// ─────────────────────────────────────────────────────────────────────────────

function validateOffer(offer: Offer, rules: typeof VALIDATION_RULES['relaxed'], strict = false): QAIssue[] {
  const issues: QAIssue[] = [];
  const ruleset = strict ? VALIDATION_RULES.strict : rules;

  // 1. Required fields
  if (!offer.product_name || offer.product_name.trim().length === 0) {
    issues.push({
      offerId: offer.id,
      productName: '[MISSING]',
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'error',
      type: 'MISSING_PRODUCT_NAME',
      message: 'Product name is empty or missing',
    });
  }

  if (!offer.offer_url || offer.offer_url.trim().length === 0) {
    issues.push({
      offerId: offer.id,
      productName: offer.product_name,
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'error',
      type: 'MISSING_OFFER_URL',
      message: 'Offer URL is empty or missing',
    });
  }

  // 2. Price validation
  if (!offer.original_price || offer.original_price <= 0) {
    issues.push({
      offerId: offer.id,
      productName: offer.product_name,
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'error',
      type: 'INVALID_ORIGINAL_PRICE',
      message: 'Original price must be positive',
      value: offer.original_price,
      expected: `> 0`,
    });
  }

  if (!offer.offer_price || offer.offer_price <= 0) {
    issues.push({
      offerId: offer.id,
      productName: offer.product_name,
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'error',
      type: 'INVALID_OFFER_PRICE',
      message: 'Offer price must be positive',
      value: offer.offer_price,
      expected: `> 0`,
    });
  }

  if (offer.original_price && offer.offer_price && offer.original_price < offer.offer_price) {
    issues.push({
      offerId: offer.id,
      productName: offer.product_name,
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'error',
      type: 'PRICE_RELATIONSHIP_ERROR',
      message: 'Original price must be >= offer price',
      value: `Original: ${offer.original_price}, Offer: ${offer.offer_price}`,
      expected: `Original >= Offer`,
    });
  }

  // 3. Price range validation
  if (offer.original_price && offer.original_price < ruleset.minPriceClp) {
    issues.push({
      offerId: offer.id,
      productName: offer.product_name,
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'warning',
      type: 'PRICE_TOO_LOW',
      message: `Original price below reasonable minimum (${ruleset.minPriceClp} CLP)`,
      value: offer.original_price,
    });
  }

  if (offer.original_price && offer.original_price > ruleset.maxPriceClp) {
    issues.push({
      offerId: offer.id,
      productName: offer.product_name,
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'warning',
      type: 'PRICE_TOO_HIGH',
      message: `Original price exceeds reasonable maximum (${ruleset.maxPriceClp} CLP)`,
      value: offer.original_price,
    });
  }

  // 4. Discount validation
  if (offer.original_price && offer.offer_price) {
    const discountPercent = ((offer.original_price - offer.offer_price) / offer.original_price) * 100;

    if (discountPercent < ruleset.minDiscountPercent) {
      issues.push({
        offerId: offer.id,
        productName: offer.product_name,
        storeSlug: offer.store_slug,
        category: offer.category_slug,
        severity: 'warning',
        type: 'DISCOUNT_TOO_LOW',
        message: `Discount too low (${discountPercent.toFixed(1)}% < ${ruleset.minDiscountPercent}%)`,
        value: discountPercent.toFixed(1),
      });
    }

    if (discountPercent > ruleset.maxDiscountPercent) {
      issues.push({
        offerId: offer.id,
        productName: offer.product_name,
        storeSlug: offer.store_slug,
        category: offer.category_slug,
        severity: 'warning',
        type: 'DISCOUNT_SUSPICIOUS',
        message: `Discount suspiciously high (${discountPercent.toFixed(1)}% > ${ruleset.maxDiscountPercent}%)`,
        value: discountPercent.toFixed(1),
      });
    }
  }

  // 5. Category validation
  if (!CANONICAL_CATEGORIES.has(offer.category_slug)) {
    issues.push({
      offerId: offer.id,
      productName: offer.product_name,
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'error',
      type: 'INVALID_CATEGORY',
      message: 'Category slug not in canonical list',
      value: offer.category_slug,
      expected: `One of: ${Array.from(CANONICAL_CATEGORIES).join(', ')}`,
    });
  }

  // 6. Image URL validation
  if (ruleset.requireImage && (!offer.image_url || offer.image_url.trim().length === 0)) {
    issues.push({
      offerId: offer.id,
      productName: offer.product_name,
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'warning',
      type: 'MISSING_IMAGE_URL',
      message: 'Image URL is empty or missing',
    });
  }

  if (offer.image_url && offer.image_url.trim().length > 0) {
    if (!offer.image_url.startsWith('http')) {
      issues.push({
        offerId: offer.id,
        productName: offer.product_name,
        storeSlug: offer.store_slug,
        category: offer.category_slug,
        severity: 'warning',
        type: 'MALFORMED_IMAGE_URL',
        message: 'Image URL should start with http(s)',
        value: offer.image_url.substring(0, 50),
      });
    }
  }

  // 7. Brand validation
  if (ruleset.requireBrand && (!offer.brand || offer.brand.trim().length === 0)) {
    issues.push({
      offerId: offer.id,
      productName: offer.product_name,
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'info',
      type: 'MISSING_BRAND',
      message: 'Brand field is empty (common for unbranded products)',
    });
  }

  // 8. Product name quality
  if (offer.product_name && offer.product_name.length < 5) {
    issues.push({
      offerId: offer.id,
      productName: offer.product_name,
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'warning',
      type: 'PRODUCT_NAME_TOO_SHORT',
      message: 'Product name is very short (may indicate parsing error)',
      value: offer.product_name,
    });
  }

  if (offer.product_name && offer.product_name.length > 200) {
    issues.push({
      offerId: offer.id,
      productName: offer.product_name.substring(0, 50) + '...',
      storeSlug: offer.store_slug,
      category: offer.category_slug,
      severity: 'warning',
      type: 'PRODUCT_NAME_TOO_LONG',
      message: 'Product name is very long (>200 chars)',
      value: offer.product_name.length,
    });
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main QA Function
// ─────────────────────────────────────────────────────────────────────────────

async function runQA(storeSlug?: string, limit: number = 100, strict: boolean = false): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL not set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log(`\n📊 Starting QA validation${storeSlug ? ` for ${storeSlug}` : ' for all stores'}...`);
  console.log(`   Mode: ${strict ? 'STRICT' : 'RELAXED'} | Limit: ${limit} offers\n`);

  // Fetch offers
  let query = supabase.from('offers').select('*');
  
  if (storeSlug) {
    query = query.eq('store_slug', storeSlug);
  }

  const { data: offers, error } = await query.limit(limit);

  if (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }

  if (!offers || offers.length === 0) {
    console.error(`❌ No offers found${storeSlug ? ` for store: ${storeSlug}` : ''}`);
    process.exit(1);
  }

  // Run QA on all offers
  const allIssues: QAIssue[] = [];
  const ruleset = strict ? VALIDATION_RULES.strict : VALIDATION_RULES.relaxed;
  
  offers.forEach(offer => {
    const issues = validateOffer(offer, ruleset, strict);
    allIssues.push(...issues);
  });

  // Calculate statistics
  const validOffers = offers.length - new Set(allIssues.map(i => i.offerId)).size;
  const categories = new Set(offers.map(o => o.category_slug));
  const missingBrands = offers.filter(o => !o.brand).length;

  let imagesWithErrors = 0;
  allIssues
    .filter(i => i.type === 'MISSING_IMAGE_URL' || i.type === 'MALFORMED_IMAGE_URL')
    .forEach(i => {
      const id = i.offerId;
      if (!imagesWithErrors || imagesWithErrors < id) imagesWithErrors++;
    });

  const discounts = offers
    .map(o => ((o.original_price - o.offer_price) / o.original_price) * 100)
    .filter(d => !isNaN(d) && isFinite(d));

  const report: QAReport = {
    timestamp: new Date().toISOString(),
    storeSlug: storeSlug,
    totalOffers: offers.length,
    validOffers,
    invalidOffers: new Set(allIssues.filter(i => i.severity === 'error').map(i => i.offerId)).size,
    issues: allIssues,
    statistics: {
      avgDiscountPercent: discounts.length > 0 ? discounts.reduce((a, b) => a + b, 0) / discounts.length : 0,
      minOriginalPrice: Math.min(...offers.map(o => o.original_price)),
      maxOriginalPrice: Math.max(...offers.map(o => o.original_price)),
      categoriesFound: Array.from(categories),
      brandsWithMissing: missingBrands,
      imagesWithErrors,
    },
  };

  // Print summary
  console.log('═'.repeat(80));
  console.log(`📈 QA Report Summary`);
  console.log('═'.repeat(80));
  console.log(`Total Offers Analyzed:    ${report.totalOffers}`);
  console.log(`Valid Offers:             ${report.validOffers} (${((report.validOffers / report.totalOffers) * 100).toFixed(1)}%)`);
  console.log(`Offers with Errors:       ${report.invalidOffers}`);
  console.log(`Total Issues Found:       ${report.issues.length}`);
  console.log(`Categories:               ${report.statistics.categoriesFound.length} (${report.statistics.categoriesFound.join(', ')})`);
  console.log(`Avg Discount:             ${report.statistics.avgDiscountPercent.toFixed(1)}%`);
  console.log(`Price Range:              ${report.statistics.minOriginalPrice} - ${report.statistics.maxOriginalPrice} CLP`);
  console.log(`Missing Brands:           ${report.statistics.brandsWithMissing}`);
  console.log('═'.repeat(80));

  // Group issues by severity
  const errorIssues = report.issues.filter(i => i.severity === 'error');
  const warningIssues = report.issues.filter(i => i.severity === 'warning');
  const infoIssues = report.issues.filter(i => i.severity === 'info');

  if (errorIssues.length > 0) {
    console.log(`\n❌ ERRORS (${errorIssues.length}):`);
    const grouped: { [key: string]: number } = {};
    errorIssues.forEach(i => {
      grouped[i.type] = (grouped[i.type] || 0) + 1;
    });
    Object.entries(grouped).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }

  if (warningIssues.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warningIssues.length}):`);
    const grouped: { [key: string]: number } = {};
    warningIssues.forEach(i => {
      grouped[i.type] = (grouped[i.type] || 0) + 1;
    });
    Object.entries(grouped).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }

  if (infoIssues.length > 0 && !strict) {
    console.log(`\nℹ️  INFO (${infoIssues.length}):`);
    const grouped: { [key: string]: number } = {};
    infoIssues.forEach(i => {
      grouped[i.type] = (grouped[i.type] || 0) + 1;
    });
    Object.entries(grouped).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }

  // Show sample issues if any
  if (report.issues.length > 0 && report.issues.length <= 10) {
    console.log(`\n🔍 Sample Issues:`);
    report.issues.slice(0, 5).forEach(issue => {
      console.log(`   [${issue.severity.toUpperCase()}] ${issue.type}`);
      console.log(`      Product: ${issue.productName.substring(0, 60)}`);
      console.log(`      Message: ${issue.message}`);
    });
  }

  // Exit with appropriate code
  const hasErrors = errorIssues.length > 0;
  const hasWarnings = warningIssues.length > 0;

  if (hasErrors) {
    console.log('\n❌ QA FAILED: Data quality issues found (errors present)');
    process.exit(1);
  } else if (hasWarnings && strict) {
    console.log('\n⚠️  QA PASSED WITH WARNINGS: Consider fixing these issues');
    process.exit(0);
  } else {
    console.log('\n✅ QA PASSED: Data quality is acceptable');
    process.exit(0);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let storeSlug: string | undefined;
let limit = 100;
let strict = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--store' && args[i + 1]) {
    storeSlug = args[++i];
  } else if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[++i], 10);
  } else if (args[i] === '--strict') {
    strict = true;
  }
}

runQA(storeSlug, limit, strict);
