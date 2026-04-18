import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const categories = [
  { name: 'Electrohogar', slug: 'electrohogar' },
  { name: 'Mascotas', slug: 'mascotas' }
];

async function createCategories() {
  for (const cat of categories) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', cat.slug)
      .single();
    
    if (!existing) {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: cat.name, slug: cat.slug }])
        .select('id');
      
      if (error) {
        console.log(`❌ Error al crear ${cat.name}:`, error.message);
      } else {
        console.log(`✓ Categoría ${cat.name} creada`);
      }
    } else {
      console.log(`✓ Categoría ${cat.name} ya existe`);
    }
  }
}

createCategories();
