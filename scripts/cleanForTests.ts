import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KEEP_STORE_SLUG = 'acuenta';
const KEEP_PRODUCTS_LIMIT = 10;
const BATCH_SIZE = 200;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function deleteByProductIds(table: 'offers' | 'price_history', productIds: string[]) {
  for (const batch of chunk(productIds, BATCH_SIZE)) {
    const { error } = await supabase.from(table).delete().in('product_id', batch);
    if (error) throw new Error(`Error deleting from ${table}: ${error.message}`);
  }
}

async function deleteProductsByIds(productIds: string[]) {
  for (const batch of chunk(productIds, BATCH_SIZE)) {
    const { error } = await supabase.from('products').delete().in('id', batch);
    if (error) throw new Error(`Error deleting products: ${error.message}`);
  }
}

async function main() {
  console.log('[cleanForTests] Starting cleanup...');

  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id, slug');

  if (storesError) {
    throw new Error(`Failed to fetch stores: ${storesError.message}`);
  }

  const keepStore = (stores ?? []).find((store) => store.slug === KEEP_STORE_SLUG);
  if (!keepStore) {
    throw new Error(`Store not found: ${KEEP_STORE_SLUG}`);
  }

  const { data: allProducts, error: productsError } = await supabase
    .from('products')
    .select('id, store_id');

  if (productsError) {
    throw new Error(`Failed to fetch products: ${productsError.message}`);
  }

  const keepStoreProducts = (allProducts ?? []).filter((product) => product.store_id === keepStore.id);
  const keepStoreProductIds = keepStoreProducts.map((product) => product.id);

  const otherStoreProductIds = (allProducts ?? [])
    .filter((product) => product.store_id !== keepStore.id)
    .map((product) => product.id);

  if (otherStoreProductIds.length > 0) {
    await deleteByProductIds('offers', otherStoreProductIds);
    await deleteByProductIds('price_history', otherStoreProductIds);
    await deleteProductsByIds(otherStoreProductIds);
    console.log(`[cleanForTests] Removed ${otherStoreProductIds.length} products from non-${KEEP_STORE_SLUG} stores.`);
  }

  let keepIds = new Set<string>();

  if (keepStoreProductIds.length > 0) {
    const { data: keepStoreOffers, error: offersError } = await supabase
      .from('offers')
      .select('product_id, scraped_at')
      .in('product_id', keepStoreProductIds)
      .order('scraped_at', { ascending: false });

    if (offersError) {
      throw new Error(`Failed to fetch ${KEEP_STORE_SLUG} offers: ${offersError.message}`);
    }

    const uniqueProductIds: string[] = [];
    const seen = new Set<string>();

    for (const row of keepStoreOffers ?? []) {
      const productId = row.product_id as string;
      if (seen.has(productId)) continue;
      seen.add(productId);
      uniqueProductIds.push(productId);
      if (uniqueProductIds.length >= KEEP_PRODUCTS_LIMIT) break;
    }

    keepIds = new Set(uniqueProductIds);

    const toDeleteInKeepStore = keepStoreProductIds.filter((id) => !keepIds.has(id));

    if (toDeleteInKeepStore.length > 0) {
      await deleteByProductIds('offers', toDeleteInKeepStore);
      await deleteByProductIds('price_history', toDeleteInKeepStore);
      await deleteProductsByIds(toDeleteInKeepStore);
      console.log(`[cleanForTests] Trimmed ${KEEP_STORE_SLUG} to ${keepIds.size} products with offers.`);
    }
  }

  const { error: promotionsError } = await supabase
    .from('promotions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (promotionsError) {
    throw new Error(`Failed to clean promotions: ${promotionsError.message}`);
  }

  const { count: offersCount, error: c1 } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true });

  const { count: productsCount, error: c2 } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  const { count: historyCount, error: c3 } = await supabase
    .from('price_history')
    .select('*', { count: 'exact', head: true });

  const { count: promosCount, error: c4 } = await supabase
    .from('promotions')
    .select('*', { count: 'exact', head: true });

  if (c1 || c2 || c3 || c4) {
    throw new Error('Failed to read final counts after cleanup.');
  }

  console.log('[cleanForTests] Done. Final counts:');
  console.log(`  products: ${productsCount ?? 0}`);
  console.log(`  offers: ${offersCount ?? 0}`);
  console.log(`  price_history: ${historyCount ?? 0}`);
  console.log(`  promotions: ${promosCount ?? 0}`);
}

main().catch((error) => {
  console.error('[cleanForTests] Error:', error.message || error);
  process.exit(1);
});
