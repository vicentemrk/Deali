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

async function fixProduct() {
  console.log('🔧 Corrigiendo producto específico...\n');

  // Get Jumbo store ID
  const { data: jumboStore } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', 'jumbo')
    .single();

  if (!jumboStore) {
    console.error('❌ Jumbo store not found');
    process.exit(1);
  }

  // Find the product
  const { data: product, error: fetchError } = await supabase
    .from('products')
    .select('id, name')
    .eq('store_id', jumboStore.id)
    .ilike('name', '%Nameko%')
    .single();

  if (fetchError || !product) {
    console.log('Producto no encontrado o ya fue corregido');
    process.exit(0);
  }

  console.log(`📝 Producto actual: "${product.name}"`);
  console.log(`   Bytes: ${Buffer.from(product.name).toString('hex')}`);

  // Standard correct name
  const correctedName = 'Champiñón Nameko Bella Contadina 180 g';

  const { error: updateError } = await supabase
    .from('products')
    .update({ name: correctedName })
    .eq('id', product.id);

  if (updateError) {
    console.error('❌ Error:', updateError);
    process.exit(1);
  }

  console.log(`✅ Corregido a: "${correctedName}"`);
}

fixProduct().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
