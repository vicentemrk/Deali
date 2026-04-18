import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase config');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanJumboFakeOffers() {
  console.log('🧹 Cleaning fake Jumbo offers from database...');

  // Get store ID for Jumbo
  const { data: store, error: storeErr } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', 'jumbo')
    .single();

  if (storeErr || !store) {
    throw new Error('Could not find Jumbo store');
  }

  const storeId = store.id;

  // Get all products for Jumbo
  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('id')
    .eq('store_id', storeId);

  if (fetchErr) {
    throw new Error(`Failed to fetch Jumbo products: ${fetchErr.message}`);
  }

  if (!products || products.length === 0) {
    console.log('✓ No Jumbo products found in database');
    return;
  }

  const productIds = products.map((p) => p.id);
  console.log(`Found ${productIds.length} Jumbo products to delete...`);

  // Delete price_history records
  console.log('Step 1: Deleting price history...');
  const { error: deletePriceErr } = await supabase
    .from('price_history')
    .delete()
    .in('product_id', productIds);

  if (deletePriceErr) {
    console.warn(`⚠ Could not delete price history: ${deletePriceErr.message}`);
  } else {
    console.log('✓ Deleted price history');
  }

  // Delete offers that reference these products
  console.log('Step 2: Deleting offers for these products...');
  const { error: deleteOffersErr } = await supabase
    .from('offers')
    .delete()
    .in('product_id', productIds);

  if (deleteOffersErr) {
    throw new Error(`Failed to delete offers: ${deleteOffersErr.message}`);
  }
  console.log('✓ Deleted offers');

  // Delete products
  console.log('Step 3: Deleting products...');
  const { error: deleteErr } = await supabase
    .from('products')
    .delete()
    .in('id', productIds);

  if (deleteErr) {
    throw new Error(`Failed to delete products: ${deleteErr.message}`);
  }

  console.log(`✓ Deleted ${productIds.length} fake Jumbo products`);
}

cleanJumboFakeOffers()
  .then(() => {
    console.log('✅ Cleanup complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  });
