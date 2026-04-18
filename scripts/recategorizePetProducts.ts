import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Keywords for pet products
const petKeywords = [
  'snack perro',
  'snack gato',
  'alimento mascota',
  'comida mascota',
  'alimento perro',
  'alimento gato',
  'golosina perro',
  'golosina gato',
  'pet',
  'mascotas',
  'dentastix',
  'pedigree',
  'whiskas',
  'friskies',
];

async function recategorizePetProducts() {
  try {
    console.log('🐾 Iniciando reasignación de productos de mascotas...');

    // Get the Mascotas category
    const { data: mascotasCategory, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'mascotas')
      .single();

    if (catError || !mascotasCategory) {
      console.error('❌ No se encontró la categoría Mascotas:', catError?.message);
      return;
    }

    console.log(`✓ Categoría Mascotas encontrada: ${mascotasCategory.id}`);

    // Find products with pet-related keywords
    const { data: allProducts, error: prodError } = await supabase
      .from('products')
      .select('id, name, category_id')
      .limit(1000);

    if (prodError) {
      console.error('❌ Error fetching products:', prodError.message);
      return;
    }

    const productsToCategorize = allProducts.filter((product: any) => {
      const nameToCheck = product.name.toLowerCase();
      return petKeywords.some((keyword) => nameToCheck.includes(keyword.toLowerCase()));
    });

    console.log(
      `📦 Encontrados ${productsToCategorize.length} productos de mascotas`
    );

    if (productsToCategorize.length === 0) {
      console.log('✓ No hay productos para reasignar');
      return;
    }

    // Update each product
    let updatedCount = 0;
    for (const product of productsToCategorize) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: mascotasCategory.id })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ Error updating ${product.name}:`, updateError.message);
      } else {
        console.log(`✓ ${product.name} → Mascotas`);
        updatedCount++;
      }
    }

    console.log(
      `\n✅ Proceso completado: ${updatedCount}/${productsToCategorize.length} productos reasignados`
    );
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

recategorizePetProducts();
