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

async function auditOffers() {
  console.log('📊 Auditando ofertas por tienda...\n');

  const stores = ['jumbo', 'lider', 'unimarc', 'acuenta', 'tottus', 'santa-isabel'];

  for (const store of stores) {
    const { data, count } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: false })
      .eq('store_slug', store)
      .neq('product_name', ''); // No vacías

    const totalCount = count || 0;

    // Contar las únicas
    const uniqueProducts = new Set((data || []).map((o: any) => o.product_id));

    console.log(`${store.toUpperCase()}`);
    console.log(`  Total ofertas: ${totalCount}`);
    console.log(`  Productos únicos: ${uniqueProducts.size}`);
    
    // Mostrar primeras 3
    const sample = (data || []).slice(0, 3);
    sample.forEach((o: any) => {
      console.log(`    - ${o.product_name?.substring(0, 40)}`);
    });

    console.log();
  }
}

auditOffers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
