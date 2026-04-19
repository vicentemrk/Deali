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

async function showNamekoProduct() {
  console.log('🔎 Buscando producto Nameko...\n');

  // Get Jumbo store ID
  const { data: jumboStore } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', 'jumbo')
    .single();

  if (!jumboStore) {
    console.error('❌ Store not found');
    process.exit(1);
  }

  // Get the nameko product
  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('store_id', jumboStore.id);

  const nameko = products?.find((p: any) =>
    p.name.toLowerCase().includes('nameko')
  );

  if (!nameko) {
    console.log('✅ No Nameko product found - issue resolved!');
    process.exit(0);
  }

  console.log(`Found product: "${nameko.name}"`);
  console.log(`ID: ${nameko.id}`);
  console.log(`Length: ${nameko.name.length} chars`);
  console.log(`Hex: ${Buffer.from(nameko.name).toString('hex')}`);
  console.log(`UTF-8 bytes breakdown:`);

  for (let i = 0; i < nameko.name.length; i++) {
    const code = nameko.name.charCodeAt(i);
    const hex = code.toString(16).padStart(2, '0');
    console.log(`  [${i}] '${nameko.name[i]}' = U+${code.toString(16).toUpperCase().padStart(4, '0')} (0x${hex})`);
  }
}

showNamekoProduct().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
