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

async function checkJumboOffers() {
  console.log('🔍 Analizando ofertas de Jumbo...\n');

  // Get all Jumbo offers via the view
  const { data: jumboOffers } = await supabase
    .from('activa_offers_view')
    .select('offer_id, product_name, product_image_url')
    .eq('store_slug', 'jumbo')
    .order('product_name');

  if (!jumboOffers || jumboOffers.length === 0) {
    console.log('❌ No ofertas encontradas para Jumbo');
    process.exit(1);
  }

  console.log(`✅ Total ofertas Jumbo: ${jumboOffers.length}\n`);

  // Find any with non-standard characters
  const suspicious = jumboOffers.filter((offer: any) => {
    const name = offer.product_name || '';
    const bytes = Buffer.from(name).toString('hex');
    // Look for multi-byte UTF-8 sequences
    return /([c3][a1a9ado])/.test(bytes) || /[c2|c3]/.test(bytes);
  });

  if (suspicious.length > 0) {
    console.log(`⚠️  OFERTAS CON ENCODING SOSPECHOSO: ${suspicious.length}\n`);
    suspicious.slice(0, 20).forEach((offer: any) => {
      const bytes = Buffer.from(offer.product_name).toString('hex');
      console.log(`  • ${offer.product_name}`);
      console.log(`    Hex: ${bytes}`);
    });
  } else {
    console.log('✅ Todas las ofertas están bien codificadas');
    console.log('📊 Muestra de nombres:');
    jumboOffers.slice(0, 5).forEach((offer: any) => {
      console.log(`   • ${offer.product_name}`);
    });
  }
}

checkJumboOffers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

checkJumboOffers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
