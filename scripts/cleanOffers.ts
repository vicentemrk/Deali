import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanOffers() {
  try {
    console.log('🗑️ Eliminando todas las ofertas...');
    
    const { data, error: deleteError } = await supabase
      .from('offers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Borra todas las filas

    if (deleteError) {
      console.error('❌ Error al eliminar ofertas:', deleteError);
      process.exit(1);
    }

    console.log('✅ Todas las ofertas han sido eliminadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

cleanOffers();
