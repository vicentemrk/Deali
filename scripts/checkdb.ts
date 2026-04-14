import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: stores, error: e1 } = await supabase.from('stores').select('*');
  console.log('Stores:', stores?.length, e1);
  
  const { data: offers, error: e2 } = await supabase.from('offers').select('*');
  console.log('Offers:', offers?.length, e2);
  
  const { data: view, error: e3 } = await supabase.from('activa_offers_view').select('*');
  console.log('View:', view?.length, e3);
}

check();
