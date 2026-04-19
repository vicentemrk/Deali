import React from 'react';
import { LiveOfferTicker } from '@/components/LiveOfferTicker';
import { StoreSection } from '@/components/StoreSection';
import { PromotionBanner } from '@/components/PromotionBanner';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { ALCOHOL_CATEGORY_SLUG } from '@/lib/catalog';
import { fetchJson, type OfferCardData, type PromotionSummary, type StoreSummary, type PagedOffersResponse } from '@/lib/siteData';

type OfferSummary = OfferCardData & {
  store_slug: string;
  category_slug: string | null;
};

const DEMO_STORES: StoreSummary[] = [
  { id: '1', name: 'Jumbo', slug: 'jumbo', color_hex: '#00AA44', website_url: 'https://www.jumbo.cl', active_offers_count: 0 },
  { id: '2', name: 'Líder', slug: 'lider', color_hex: '#003D82', website_url: 'https://www.lider.cl', active_offers_count: 0 },
  { id: '3', name: 'Unimarc', slug: 'unimarc', color_hex: '#DC2626', website_url: 'https://www.unimarc.cl', active_offers_count: 0 },
  { id: '4', name: 'aCuenta', slug: 'acuenta', color_hex: '#FF8C00', website_url: 'https://www.acuenta.cl', active_offers_count: 0 },
  { id: '5', name: 'Tottus', slug: 'tottus', color_hex: '#00843D', website_url: 'https://www.tottus.cl', active_offers_count: 0 },
  { id: '6', name: 'Santa Isabel', slug: 'santa-isabel', color_hex: '#E63946', website_url: 'https://www.santaisabel.cl', active_offers_count: 0 },
];

const PRIMARY_STORE_ORDER = ['jumbo', 'lider', 'unimarc', 'tottus', 'santa-isabel', 'acuenta'];

export default async function HomePage() {
  const [offersData, stores, promotions] = await Promise.all([
    fetchJson<PagedOffersResponse>(`/api/offers?limit=1000&excludeCategory=${ALCOHOL_CATEGORY_SLUG}`, { cache: 'no-store' }),
    fetchJson<StoreSummary[]>(`/api/stores`, { cache: 'no-store' }),
    fetchJson<PromotionSummary[]>(`/api/promotions`, { cache: 'no-store' }),
  ]);

  const activeStores = stores || DEMO_STORES;
  const activeOffers = (offersData?.data || []) as OfferSummary[];
  const activePromotions = promotions || [];
  const orderedStores = activeStores.map((store) => ({
    ...store,
    offers: activeOffers
      .filter((offer) => offer.store_slug === store.slug && offer.category_slug !== ALCOHOL_CATEGORY_SLUG)
      .slice(0, 5),
  }));
  const sortedStores = orderedStores
    .slice()
    .sort((left, right) => {
      const leftIndex = PRIMARY_STORE_ORDER.indexOf(left.slug);
      const rightIndex = PRIMARY_STORE_ORDER.indexOf(right.slug);
      if (leftIndex === -1 && rightIndex === -1) return left.name.localeCompare(right.name);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });

  const totalOffers = activeOffers.length;
  const totalStores = activeStores.length;

  return (
    <div className="min-h-screen font-sans text-gray-900">
      <LiveOfferTicker />

      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-12">
        {/* ── Hero Section ────────────────────────────────────── */}
        <section className="animate-fade-in-up relative mb-16 overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/80 via-teal-light/30 to-purple-light/40 px-6 py-12 shadow-[0_20px_80px_-40px_rgba(13,148,136,0.25)] backdrop-blur-sm sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-teal/10 blur-3xl" />

          <div className="relative z-10 text-center">
            <h1 className="mx-auto max-w-3xl text-4xl font-black leading-[1.1] tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Las mejores ofertas,<br />
              sin buscarlas
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base text-ink-weak sm:text-lg">
              Comparamos en tiempo real los precios de supermercados para que ahorres en cada compra.
            </p>

            {/* Stats */}
            {totalOffers > 0 && (
              <div className="mx-auto mt-8 flex max-w-sm items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-900 sm:text-3xl">{totalOffers.toLocaleString('es-CL')}</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-ink-weak">Ofertas activas</div>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-900 sm:text-3xl">{totalStores}</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-ink-weak">Supermercados</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Supermercados Grid ───────────────────────────────── */}
        <section className="animate-fade-in-up mb-14" style={{ animationDelay: '100ms' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Supermercados</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6 stagger-children">
            {activeStores.map((store) => (
              <Link
                key={store.slug}
                href={`/supermercado/${store.slug}`}
                className="animate-fade-in-up group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: `linear-gradient(135deg, ${store.color_hex}08, ${store.color_hex}15)` }}
                />
                <span className="relative z-10 text-base font-bold transition-transform duration-300 group-hover:scale-105 sm:text-lg" style={{ color: store.color_hex }}>
                  {store.name}
                </span>
                {store.active_offers_count > 0 && (
                  <span className="relative z-10 rounded-full bg-bg-input px-2.5 py-0.5 text-[10px] font-bold text-ink-weak">
                    {store.active_offers_count} ofertas
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Categorías Grid ─────────────────────────────────── */}
        <section className="animate-fade-in-up mb-14" style={{ animationDelay: '200ms' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Categorías</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 stagger-children">
            {[
              { name: 'Bebidas', slug: 'bebidas' },
              { name: 'Lácteos', slug: 'lacteos' },
              { name: 'Carnes y Pescados', slug: 'carnes-pescados' },
              { name: 'Frutas y Verduras', slug: 'frutas-verduras' },
              { name: 'Congelados', slug: 'congelados' },
              { name: 'Limpieza del Hogar', slug: 'limpieza-hogar' },
              { name: 'Despensa', slug: 'despensa' },
              { name: 'Mascotas', slug: 'mascotas' },
            ].map(cat => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="animate-fade-in-up group flex items-center justify-center rounded-2xl border border-purple/10 bg-gradient-to-br from-purple-light/50 to-purple-light/80 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-purple hover:shadow-lg hover:shadow-purple/15 sm:p-5"
              >
                <span className="text-sm font-bold text-purple transition-colors group-hover:text-white sm:text-base">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Promotions ──────────────────────────────────────── */}
        {activePromotions.length > 0 && (
          <section className="animate-fade-in-up mb-14" style={{ animationDelay: '300ms' }}>
            {activePromotions.slice(0, 1).map((promo) => (
              <PromotionBanner key={promo.id} promotion={promo} />
            ))}
          </section>
        )}

        {/* ── Store Sections with Offers ──────────────────────── */}
        {sortedStores.length > 0 ? (
          <div className="space-y-10">
            {sortedStores.map((store, idx) => (
              <div key={store.id} className="animate-fade-in-up" style={{ animationDelay: `${400 + idx * 80}ms` }}>
                <StoreSection store={store} offers={store.offers} />
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-fade-in-up rounded-2xl border border-border bg-white/70 p-12 text-center shadow-sm backdrop-blur-sm">
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
