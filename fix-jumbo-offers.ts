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

async function fixJumboOffers() {
  console.log('🧹 Limpiando ofertas de Jumbo...\n');

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

  // Fix the broken Nameko entry
  const { data: allProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, name')
    .eq('store_id', jumboStore.id)
    .ilike('name', '%Nameko%');

  if (fetchError) {
    console.error('Error fetching:', fetchError);
    process.exit(1);
  }

  if (allProducts && allProducts.length > 0) {
    for (const product of allProducts) {
      const correctedName = product.name
        .replace(/ï¿½/g, 'ñ') // Fix broken ñ
        .replace(/Â/g, '') // Remove UTF-8 markers
        .replace(/Ã¡/g, 'á')
        .replace(/Ã©/g, 'é')
        .replace(/Ã­/g, 'í')
        .replace(/Ã³/g, 'ó')
        .replace(/Ã¹/g, 'ú')
        .trim();

      if (correctedName !== product.name) {
        console.log(`Corrigiendo producto: "${product.name}"`);
        console.log(`Nuevo nombre: "${correctedName}"`);

        const { error } = await supabase
          .from('products')
          .update({ name: correctedName })
          .eq('id', product.id);

        if (error) {
          console.error('Error updating:', error);
        } else {
          console.log('✅ Actualizado\n');
        }
      }
    }
  }

  console.log('🎯 Limpieza completada');
}

fixJumboOffers().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
