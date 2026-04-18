import React from 'react';
import { PromotionBanner } from '@/components/PromotionBanner';
import { Footer } from '@/components/Footer';

type Promotion = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  store: {
    name: string;
    color_hex: string;
    website_url: string;
  };
};

export const metadata = {
  title: 'Promociones Bancarias y Ofertas | Deali',
  description: 'Descubre todas las promociones bancarias y ofertas exclusivas de los supermercados en Chile.',
};

export default async function PromocionesPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/promotions`, { next: { revalidate: 3600 } });
  
  let promotions: Promotion[] = [];
  if (res.ok) {
    promotions = (await res.json()) as Promotion[];
  }

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
