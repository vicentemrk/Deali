import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
  try {
    console.log('🔄 Iniciando limpieza de datos...\n');

    // 1. Log inicial
    console.log('📝 Registrando inicio de operación...');
    const { error: logError1 } = await supabase
      .from('scrape_logs')
      .insert({
        store_slug: 'system',
        status: 'info',
        message: 'Starting cleanup: removing slug-named products and low prices',
        metadata: {
          operation: 'cleanup_slugs_and_low_prices',
          timestamp: new Date().toISOString(),
        },
      });

    if (logError1) console.warn('⚠️  Advertencia:', logError1.message);
    else console.log('✅ Log registrado\n');

    // 2. Primero obtener IDs de productos con nombres tipo slug
    console.log('🗑️  Buscando productos con nombres en formato slug...');
    
    const { data: productsToDelete, error: queryError } = await supabase
      .from('products')
      .select('id, name')
      .limit(10000);

    if (queryError) {
      console.error('❌ Error consultando productos:', queryError.message);
      throw queryError;
    }

    // Filtrar productos que tengan el patrón slug
    const slugPatternRegex = /^[a-z0-9]+(-[a-z0-9]+){3,}\d{5,}$/;
    const productsToDeleteFiltered = productsToDelete?.filter(p => 
      slugPatternRegex.test(p.name)
    ) || [];

    console.log(`📊 Encontrados ${productsToDeleteFiltered.length} productos con patrón slug\n`);

    // 3. Eliminar ofertas de esos productos primero
    if (productsToDeleteFiltered.length > 0) {
      const idsToDelete = productsToDeleteFiltered.map(p => p.id);
      
      console.log('🗑️  Eliminando price_history de productos slug...');
      const { error: priceHistoryError, count: priceHistoryCount } = await supabase
        .from('price_history')
        .delete()
        .in('product_id', idsToDelete);

      if (priceHistoryError) {
        console.error('❌ Error eliminando price_history:', priceHistoryError.message);
        throw priceHistoryError;
      }
      console.log(`✅ ${priceHistoryCount || 0} registros de price_history eliminados\n`);

      console.log('🗑️  Eliminando ofertas de productos slug...');
      const { error: offersError, count: offersCount } = await supabase
        .from('offers')
        .delete()
        .in('product_id', idsToDelete);

      if (offersError) {
        console.error('❌ Error eliminando ofertas:', offersError.message);
        throw offersError;
      }
      console.log(`✅ ${offersCount || 0} ofertas eliminadas\n`);

      // 4. Ahora eliminar los productos
      console.log('🗑️  Eliminando productos...');
      const { error: deleteError, count } = await supabase
        .from('products')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('❌ Error eliminando productos:', deleteError.message);
        throw deleteError;
      }
      console.log(`✅ ${count || 0} productos eliminados\n`);
    } else {
      console.log('✅ 0 productos con patrón slug encontrados\n');
    }

    // 5. Eliminar ofertas con precio < 100
    console.log('🗑️  Eliminando ofertas restantes con precio < $100...');
    const { error: offersError2, count: offersCount2 } = await supabase
      .from('offers')
      .delete()
      .lt('offer_price', 100);

    if (offersError2) {
      console.error('❌ Error eliminando ofertas bajas:', offersError2.message);
      throw offersError2;
    }
    console.log(`✅ ${offersCount2 || 0} ofertas bajas eliminadas\n`);

    // 4. Log final
    console.log('📝 Registrando finalización de operación...');
    const { error: logError2 } = await supabase
      .from('scrape_logs')
      .insert({
        store_slug: 'system',
        status: 'info',
        message: 'Completed cleanup: removed slug-named products and low-price offers',
        metadata: {
          operation: 'cleanup_slugs_and_low_prices',
          timestamp: new Date().toISOString(),
        },
      });

    if (logError2) console.warn('⚠️  Advertencia:', logError2.message);
    else console.log('✅ Log registrado\n');

    console.log('✅ ¡Limpieza completada exitosamente!\n');
    return true;
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

runMigration();
