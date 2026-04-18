import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const storeColors = [
  { slug: 'jumbo', color_hex: '#00AA44' },
  { slug: 'lider', color_hex: '#003D82' },
  { slug: 'unimarc', color_hex: '#DC2626' },
  { slug: 'acuenta', color_hex: '#FF8C00' },
  { slug: 'tottus', color_hex: '#00843D' },
  { slug: 'santa-isabel', color_hex: '#E63946' },
];

async function updateStoreColors() {
  console.log('🎨 Actualizando colores de supermercados...');

  for (const store of storeColors) {
    const { error } = await supabase
      .from('stores')
      .update({ color_hex: store.color_hex })
      .eq('slug', store.slug);

    if (error) {
      console.log(`❌ Error actualizando ${store.slug}:`, error.message);
    } else {
      console.log(`✓ ${store.slug.toUpperCase()} → ${store.color_hex}`);
    }
  }

  console.log('\n✅ Colores actualizados correctamente');
}

updateStoreColors();
