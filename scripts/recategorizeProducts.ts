import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Category {
  id: string;
  slug: string;
  name: string;
}

async function recategorizeProducts() {
  try {
    console.log('🔄 Iniciando recategorización de productos...\n');

    // 1. Obtener todas las categorías
    console.log('📂 Cargando categorías...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, slug, name')
      .limit(100);

    if (catError || !categories) {
      console.error('❌ Error cargando categorías:', catError?.message);
      process.exit(1);
    }

    const categoryMap = new Map(categories.map(c => [c.slug, c.id]));
    console.log(`✅ Cargadas ${categories.length} categorías\n`);

    // 2. Recategorizar bebidas no alcohólicas (Canada Dry Zero, Pepsi Zero, etc.)
    console.log('🥤 Buscando bebidas no alcohólicas mal categorizadas...');
    const beveragePatterns = [
      { pattern: '%zero%', hint: 'Bebida Zero' },
      { pattern: '%sin alcohol%', hint: 'Sin Alcohol' },
      { pattern: '%no alcoh%', hint: 'No Alcohólica' },
    ];

    let beveragesUpdated = 0;
    for (const { pattern, hint } of beveragePatterns) {
      const { data: products, error: queryError } = await supabase
        .from('products')
        .select('id, name, category_id')
        .ilike('name', pattern)
        .limit(100);

      if (queryError) {
        console.error(`   ⚠️  Error buscando ${hint}:`, queryError.message);
        continue;
      }

      if (!products || products.length === 0) {
        console.log(`   ℹ️  0 productos encontrados para: ${hint}`);
        continue;
      }

      // Mapear nuevas categorías
      const correctCategoryId = categoryMap.get('bebidas');
      if (!correctCategoryId) {
        console.warn(`   ⚠️  Categoría "bebidas" no encontrada`);
        continue;
      }

      for (const product of products) {
        if (product.category_id !== correctCategoryId) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ category_id: correctCategoryId })
            .eq('id', product.id);

          if (!updateError) {
            beveragesUpdated++;
          }
        }
      }
    }

    if (beveragesUpdated > 0) {
      console.log(`   ✅ ${beveragesUpdated} bebidas recategorizadas a "bebidas"\n`);
    }

    // 3. Recategorizar fiambres/embutidos (Pickle, jamón, salchichas)
    console.log('🍖 Buscando fiambres/embutidos mal categorizados...');
    const meatPatterns = [
      { pattern: '%pickle%', hint: 'Pickles' },
      { pattern: '%jamón%', hint: 'Jamón' },
      { pattern: '%embutido%', hint: 'Embutidos' },
      { pattern: '%salchicha%', hint: 'Salchichas' },
      { pattern: '%fiambre%', hint: 'Fiambres' },
    ];

    let meatsUpdated = 0;
    for (const { pattern, hint } of meatPatterns) {
      const { data: products, error: queryError } = await supabase
        .from('products')
        .select('id, name, category_id')
        .ilike('name', pattern)
        .limit(100);

      if (queryError) {
        console.error(`   ⚠️  Error buscando ${hint}:`, queryError.message);
        continue;
      }

      if (!products || products.length === 0) {
        console.log(`   ℹ️  0 productos encontrados para: ${hint}`);
        continue;
      }

      const correctCategoryId = categoryMap.get('carnes-pescados');
      if (!correctCategoryId) {
        console.warn(`   ⚠️  Categoría "carnes-pescados" no encontrada`);
        continue;
      }

      for (const product of products) {
        if (product.category_id !== correctCategoryId) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ category_id: correctCategoryId })
            .eq('id', product.id);

          if (!updateError) {
            meatsUpdated++;
          }
        }
      }
    }

    if (meatsUpdated > 0) {
      console.log(`   ✅ ${meatsUpdated} fiambres recategorizados a "carnes-pescados"\n`);
    }

    // 4. Resumen
    console.log('📊 Resumen de Recategorización:');
    console.log(`   🥤 Bebidas no alcohólicas actualizadas: ${beveragesUpdated}`);
    console.log(`   🍖 Fiambres/embutidos actualizados: ${meatsUpdated}`);
    console.log(`   📈 Total productos recategorizados: ${beveragesUpdated + meatsUpdated}\n`);

    console.log('✅ Recategorización completada exitosamente!\n');

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

recategorizeProducts();
