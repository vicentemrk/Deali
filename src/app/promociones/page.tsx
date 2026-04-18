import React from 'react';
import { PromotionBanner } from '@/components/PromotionBanner';
import { Footer } from '@/components/Footer';
import { fetchJson, type PromotionSummary } from '@/lib/siteData';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Promociones Bancarias y Ofertas | Deali',
  description: 'Descubre todas las promociones bancarias y ofertas exclusivas de los supermercados en Chile.',
};

export default async function PromocionesPage() {
  const promotions = (await fetchJson<PromotionSummary[]>(`/api/promotions`, { next: { revalidate: 3600 } })) || [];

  return (
    <div className="min-h-screen bg-bg-page font-sans text-gray-900 flex flex-col">
      <main className="container mx-auto px-6 py-12 flex-1">
        <h1 className="text-4xl font-bold mb-4 text-purple">Promociones</h1>
        <p className="text-gray-600 mb-12">Catálogo de promociones especiales y descuentos con medios de pago.</p>
        
        {promotions.length === 0 ? (
          <p className="text-gray-500">No hay promociones activas registradas en este momento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {promotions.map((promo) => (
              <PromotionBanner key={promo.id} promotion={promo} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
