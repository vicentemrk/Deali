import React from 'react';
import { LiveOfferTicker } from '@/components/LiveOfferTicker';
import { StoreSection } from '@/components/StoreSection';
import { PromotionBanner } from '@/components/PromotionBanner';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { ALCOHOL_CATEGORY_SLUG, PRIMARY_CATEGORIES } from '@/lib/catalog';

const STORE_COLORS: Record<string, string> = {
  jumbo: '#00AA44',
  lider: '#003D82',
  unimarc: '#DC2626',
  acuenta: '#FF8C00',
  tottus: '#00843D',
  'santa-isabel': '#E63946',
};

const DEMO_STORES = [
  { id: '1', name: 'Jumbo', slug: 'jumbo', color_hex: '#00AA44', website_url: 'https://www.jumbo.cl', active_offers_count: 0 },
  { id: '2', name: 'Líder', slug: 'lider', color_hex: '#003D82', website_url: 'https://www.lider.cl', active_offers_count: 0 },
  { id: '3', name: 'Unimarc', slug: 'unimarc', color_hex: '#DC2626', website_url: 'https://www.unimarc.cl', active_offers_count: 0 },
  { id: '4', name: 'aCuenta', slug: 'acuenta', color_hex: '#FF8C00', website_url: 'https://www.acuenta.cl', active_offers_count: 0 },
  { id: '5', name: 'Tottus', slug: 'tottus', color_hex: '#00843D', website_url: 'https://www.tottus.cl', active_offers_count: 0 },
  { id: '6', name: 'Santa Isabel', slug: 'santa-isabel', color_hex: '#E63946', website_url: 'https://www.santaisabel.cl', active_offers_count: 0 },
];

const PRIMARY_STORE_ORDER = ['jumbo', 'lider', 'unimarc', 'tottus', 'santa-isabel', 'acuenta'];

async function safeFetch(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const [offersData, stores, promotions] = await Promise.all([
    safeFetch(`${baseUrl}/api/offers?limit=1000&excludeCategory=${ALCOHOL_CATEGORY_SLUG}`),
    safeFetch(`${baseUrl}/api/stores`),
    safeFetch(`${baseUrl}/api/promotions`),
  ]);

  const activeStores = stores || DEMO_STORES;
  const activeOffers = offersData?.data || [];
  const activePromotions = promotions || [];
  const orderedStores = activeStores.map((store: any) => ({
    ...store,
    offers: activeOffers
      .filter((offer: any) => offer.store_slug === store.slug && offer.category_slug !== ALCOHOL_CATEGORY_SLUG)
      .slice(0, 5),
  }));
  const sortedStores = orderedStores
    .slice()
    .sort((left: any, right: any) => {
      const leftIndex = PRIMARY_STORE_ORDER.indexOf(left.slug);
      const rightIndex = PRIMARY_STORE_ORDER.indexOf(right.slug);

      if (leftIndex === -1 && rightIndex === -1) return left.name.localeCompare(right.name);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    })
    ;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(240,253,250,0.92)_35%,_rgba(244,244,240,0.98)_100%)] font-sans text-gray-900">
      <LiveOfferTicker />


      <main className="container mx-auto px-4 py-10 sm:px-6 sm:py-12">
        {/* Hero */}
        <div className="mb-16 rounded-[2rem] border border-white/60 bg-white/70 px-4 py-10 shadow-[0_20px_80px_-40px_rgba(13,148,136,0.35)] backdrop-blur-sm sm:px-8 sm:py-12 text-center">
          <h1 className="text-4xl font-black mb-6 leading-tight tracking-tight text-gray-900 md:text-6xl">
            Las mejores ofertas,<br />
            <span className="text-purple">sin buscarlas</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-base mb-10 sm:text-lg">
            Comparamos en tiempo real los precios de tus supermercados favoritos para que ahorres en cada compra.
          </p>
          {/* Supermercados Grid */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-left">Supermercados destacados</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
              {activeStores.map((store: any) => (
                <Link
                  key={store.slug}
                  href={`/supermercado/${store.slug}`}
                  className="flex h-full items-center justify-center rounded-2xl border border-gray-50 p-5 shadow-sm transition-all group hover:-translate-y-1 sm:p-6"
                  style={{ backgroundColor: `${store.color_hex}10` }}
                >
                  <span className="text-base font-bold sm:text-lg" style={{ color: store.color_hex }}>
                    {store.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Categorias Grid */}
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-left">Categorias Principales</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {PRIMARY_CATEGORIES.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/categoria/${cat.slug}`}
                  className="flex items-center justify-center p-4 bg-[#F0EEFF] rounded-2xl border border-purple/10 shadow-sm hover:bg-purple hover:shadow transition-all group h-full hover:-translate-y-1"
                >
                  <span className="font-bold text-purple group-hover:text-white text-lg transition-colors">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Promotions */}
        {activePromotions.length > 0 && (
          <div className="mb-16">
            {activePromotions.slice(0, 1).map((promo: any) => (
              <PromotionBanner key={promo.id} promotion={promo} />
            ))}
          </div>
        )}

        {/* Store Sections */}
        {sortedStores.length > 0 ? (
          sortedStores.map((store: any) => (
            <StoreSection key={store.id} store={store} offers={store.offers} />
          ))
        ) : (
          /* Empty state placeholder */
          <div className="text-center py-20 bg-bg-card rounded-2xl border border-border">
            <div className="text-6xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Conecta tu base de datos</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Configura las variables de entorno de Supabase en tu archivo <code className="bg-bg-input px-2 py-0.5 rounded text-sm">.env.local</code> para ver ofertas reales.
            </p>
            <div className="inline-flex gap-4 text-sm">
              <span className="px-4 py-2 bg-teal-light text-teal rounded-lg font-medium">NEXT_PUBLIC_SUPABASE_URL</span>
              <span className="px-4 py-2 bg-purple-light text-purple rounded-lg font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
