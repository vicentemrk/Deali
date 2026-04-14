import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CATEGORIES = [
  { name: 'Despensa', slug: 'despensa' },
  { name: 'Bebidas', slug: 'bebidas' },
  { name: 'Lácteos', slug: 'lacteos' },
  { name: 'Limpieza e Higiene', slug: 'aseo' }
];

const MOCK_OFFERS = [
  { storeSlug: 'jumbo', name: 'Leche Descremada Soprole 1L', brand: 'Soprole', categorySlug: 'lacteos', img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80', original: 1200, offer: 990 },
  { storeSlug: 'jumbo', name: 'Queso Gauda Colun Laminado 250g', brand: 'Colun', categorySlug: 'lacteos', img: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=500&q=80', original: 2500, offer: 1990 },
  { storeSlug: 'lider', name: 'Aceite Maravilla Chef 1L', brand: 'Chef', categorySlug: 'despensa', img: 'https://images.unsplash.com/photo-1628188191913-9a3b68051e58?auto=format&fit=crop&w=500&q=80', original: 2990, offer: 2290 },
  { storeSlug: 'lider', name: 'Arroz Tucapel Grano Largo 1Kg', brand: 'Tucapel', categorySlug: 'despensa', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80', original: 1890, offer: 1390 },
  { storeSlug: 'unimarc', name: 'Coca Cola Zero 3L', brand: 'Coca Cola', categorySlug: 'bebidas', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80', original: 3290, offer: 2590 },
  { storeSlug: 'unimarc', name: 'Detergente Omo Matic 3L', brand: 'Omo', categorySlug: 'aseo', img: 'https://images.unsplash.com/photo-1584824486509-112e4181f1ce?auto=format&fit=crop&w=500&q=80', original: 8990, offer: 6990 },
  { storeSlug: 'acuenta', name: 'Papel Higiénico Scott 8 Rollos', brand: 'Scott', categorySlug: 'aseo', img: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=500&q=80', original: 4500, offer: 3500 },
  { storeSlug: 'tottus', name: 'Pack Cerveza Premium 6x330ml', brand: 'Corona', categorySlug: 'bebidas', img: 'https://images.unsplash.com/photo-1605335955627-c83758aeff87?auto=format&fit=crop&w=500&q=80', original: 5990, offer: 4490 },
  { storeSlug: 'santa-isabel', name: 'Café Grano Tostado 250g', brand: 'Nestlé', categorySlug: 'despensa', img: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=500&q=80', original: 4200, offer: 3200 },
  { storeSlug: 'jumbo', name: 'Palta Hass Malla 1Kg', brand: 'Jumbo', categorySlug: 'despensa', img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=500&q=80', original: 4990, offer: 3990 },
  { storeSlug: 'lider', name: 'Pan de Molde Blanco 500g', brand: 'Ideal', categorySlug: 'despensa', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80', original: 1990, offer: 1490 },
  { storeSlug: 'tottus', name: 'Jugos Néctar Durazno 1.5L', brand: 'Andina', categorySlug: 'bebidas', img: 'https://images.unsplash.com/photo-1600271886742-f049cd451b62?auto=format&fit=crop&w=500&q=80', original: 1500, offer: 990 }
];

async function seedMocks() {
  // 0. Update store logos
  const STORE_LOGOS = {
    'jumbo': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Jumbo_Logo.svg',
    'lider': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo_Lider.svg',
    'unimarc': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Unimarc.svg',
    'acuenta': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/SuperBodega_aCuenta_logo.svg',
    'tottus': 'https://upload.wikimedia.org/wikipedia/commons/6/69/Agencia_Tottus.svg',
    'santa-isabel': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Santa_Isabel_logo.svg'
  };
  
  for (const [slug, logo] of Object.entries(STORE_LOGOS)) {
    const { error } = await supabase.from('stores').update({ logo_url: logo }).eq('slug', slug);
    if (error) console.error(`Error updating logo for ${slug}:`, error);
  }

  // 1. Insert categories
  for (const cat of CATEGORIES) {
    await supabase.from('categories').upsert({
      name: cat.name,
      slug: cat.slug
    }, { onConflict: 'slug' }).select('id');
  }

  // 2. Fetch seeded categories to map IDs
  const { data: dbCats } = await supabase.from('categories').select('id, slug');

  for (const item of MOCK_OFFERS) {
    try {
      // Get category ID
      const catId = dbCats?.find(c => c.slug === item.categorySlug)?.id || null;
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', item.storeSlug)
        .single();
        
      if (!store) continue;

      // Unimarc style
      let { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', store.id)
        .eq('name', item.name)
        .single();
      
      if (!product) {
        const res = await supabase.from('products').insert({
          name: item.name,
          brand: item.brand,
          image_url: item.img,
          store_id: store.id,
          category_id: catId
        }).select('id').single();
        
        if (res.error || !res.data) {
          console.error(`Failed to create/fetch product ${item.name}`);
          continue;
        }
        product = res.data;
      }

      const discountPct = ((item.original - item.offer) / item.original) * 100;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const { error: offerError } = await supabase.from('offers').upsert({
        product_id: product.id,
        original_price: item.original,
        offer_price: item.offer,
        discount_pct: discountPct.toFixed(2),
        offer_url: 'https://deali.app/oferta/demo',
        start_date: new Date().toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_active: true,
        scraped_at: new Date().toISOString()
      }, { onConflict: 'product_id' });

      if (offerError) console.error('Offer upsert error:', offerError);
      else console.log(`✅ Inyectada oferta: ${item.name} (${item.storeSlug})`);
    } catch(e) {
      console.error(e);
    }
  }
}

seedMocks();
