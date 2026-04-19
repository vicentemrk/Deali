import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testOfferView() {
  console.log('🔍 Probando vista activa_offers_view...\n');

  // Test 1: Count total
  const { count: totalCount } = await supabase
    .from('activa_offers_view')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Total en vista: ${totalCount} ofertas\n`);

  // Test 2: Get by store
  const { data: jumboOffers, error: jumboError } = await supabase
    .from('activa_offers_view')
    .select('*')
    .eq('store_slug', 'jumbo')
    .limit(3);

  if (jumboError) {
    console.error('❌ Error Jumbo:', jumboError);
  } else {
    console.log(`✅ Jumbo: ${jumboOffers?.length} ofertas`);
    if (jumboOffers?.[0]) {
      console.log(`   Ej: ${jumboOffers[0].product_name}`);
    }
  }

  console.log();

  // Test 3: Check all stores
  const stores = ['jumbo', 'lider', 'unimarc', 'acuenta', 'tottus', 'santa-isabel'];
  for (const store of stores) {
    const { count } = await supabase
      .from('activa_offers_view')
      .select('*', { count: 'exact', head: true })
      .eq('store_slug', store);
    console.log(`${store}: ${count} ofertas`);
  }

  // Test 4: Check pagination
  console.log('\n✅ Test paginación (Jumbo, limit=5, page=1):');
  const { data: page1, count: countPage1 } = await supabase
    .from('activa_offers_view')
    .select('*', { count: 'exact' })
    .eq('store_slug', 'jumbo')
    .range(0, 4);

  console.log(`   Retornados: ${page1?.length}`);
  console.log(`   Total: ${countPage1}`);
}

testOfferView().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
