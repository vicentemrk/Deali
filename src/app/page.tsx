import Link from 'next/link';
import { LiveOfferTicker } from '@/components/LiveOfferTicker';
import { StoreSection } from '@/components/StoreSection';
import { PromotionBanner } from '@/components/PromotionBanner';
import { Footer } from '@/components/Footer';
import { CATEGORY_OPTIONS, ALCOHOL_CATEGORY_SLUG } from '@/lib/catalog';

// ─── Colores por tienda ──────────────────────────────────────────────────────
const STORE_COLORS: Record<string, string> = {
  jumbo:          '#0D9488',
  lider:          '#7E6BC4',
  unimarc:        '#DC2626',
  acuenta:        '#BA7517',
  tottus:         '#00843D',
  'santa-isabel': '#E91E63',
};

const DEMO_STORES = [
  { id: '1', name: 'Jumbo',        slug: 'jumbo',        color_hex: '#0D9488', website_url: 'https://www.jumbo.cl' },
  { id: '2', name: 'Líder',        slug: 'lider',        color_hex: '#7E6BC4', website_url: 'https://www.lider.cl' },
  { id: '3', name: 'Unimarc',      slug: 'unimarc',      color_hex: '#DC2626', website_url: 'https://www.unimarc.cl' },
  { id: '4', name: 'aCuenta',      slug: 'acuenta',      color_hex: '#BA7517', website_url: 'https://www.acuenta.cl' },
  { id: '5', name: 'Tottus',       slug: 'tottus',       color_hex: '#00843D', website_url: 'https://www.tottus.cl' },
  { id: '6', name: 'Santa Isabel', slug: 'santa-isabel', color_hex: '#E91E63', website_url: 'https://www.santaisabel.cl' },
];

// Emojis para categorías — ayudan a escanear rápido sin imagen
const CATEGORY_ICONS: Record<string, string> = {
  'bebidas':              '🥤',
  'bebidas-alcoholicas':  '🍺',
  'carnes-pescados':      '🥩',
  'frutas-verduras':      '🥦',
  'congelados':           '❄️',
  'panaderia-pasteleria': '🍞',
  'snacks-galletas':      '🍪',
  'cuidado-personal-bebe':'🧴',
  'limpieza-hogar':       '🧹',
  'mascotas':             '🐾',
  'despensa':             '🛒',
  'electrohogar':         '📺',
};

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
    safeFetch(`${baseUrl}/api/offers?limit=60&excludeCategory=${ALCOHOL_CATEGORY_SLUG}`),
    safeFetch(`${baseUrl}/api/stores`),
    safeFetch(`${baseUrl}/api/promotions`),
  ]);

  const activeStores   = stores        || DEMO_STORES;
  const activeOffers   = offersData?.data || [];
  const activePromotions = promotions  || [];

  // Total de ofertas para mostrar en el hero
  const totalOffers = offersData?.total ?? 0;

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <LiveOfferTicker />

      <main className="container mx-auto px-4 md:px-6 pb-16">

        {/* ─── HERO ─────────────────────────────────────────────────── */}
        <section className="hero-glow relative py-20 md:py-28 text-center">

          {/* Pill badge de "en tiempo real" */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border text-sm font-medium"
               style={{ borderColor: 'var(--teal)', color: 'var(--teal)', backgroundColor: 'var(--teal-light)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--teal)' }}/>
            Precios actualizados en tiempo real
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6"
              style={{ color: 'var(--text-primary)' }}>
            Las mejores ofertas,<br />
            <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, var(--teal) 0%, var(--purple) 100%)' }}>
              sin buscarlas
            </span>
          </h1>

          <p className="text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
             style={{ color: 'var(--text-muted)' }}>
            Comparamos en tiempo real los precios de tus supermercados favoritos
            para que ahorres en cada compra.
          </p>

          {/* Stats */}
          {totalOffers > 0 && (
            <div className="inline-flex items-center gap-8 px-8 py-4 rounded-2xl mb-10"
                 style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-center">
                <div className="text-3xl font-black" style={{ color: 'var(--teal)' }}>
                  {totalOffers}
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest mt-0.5"
                     style={{ color: 'var(--text-muted)' }}>
                  Ofertas activas
                </div>
              </div>
              <div className="w-px h-10" style={{ backgroundColor: 'var(--border)' }}/>
              <div className="text-center">
                <div className="text-3xl font-black" style={{ color: 'var(--purple)' }}>
                  {activeStores.length}
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest mt-0.5"
                     style={{ color: 'var(--text-muted)' }}>
                  Supermercados
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/buscar"
              className="px-6 py-3 rounded-xl font-bold text-white text-sm shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ background: 'linear-gradient(135deg, var(--teal) 0%, var(--purple) 100%)' }}
            >
              Ver todas las ofertas →
            </Link>
            <Link
              href="/categoria/despensa"
              className="px-6 py-3 rounded-xl font-bold text-sm border hover:-translate-y-0.5 transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}
            >
              Explorar categorías
            </Link>
          </div>
        </section>

        {/* ─── SUPERMERCADOS ────────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Supermercados
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {activeStores.map((store: any) => {
              const color = store.color_hex || STORE_COLORS[store.slug] || '#6B7280';
              return (
                <Link
                  key={store.slug}
                  href={`/supermercado/${store.slug}`}
                  className="store-card flex flex-col items-center justify-center p-5 text-center min-h-[90px] group"
                >
                  <div
                    className="w-3 h-3 rounded-full mb-3 group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-bold text-sm" style={{ color: color }}>
                    {store.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ─── CATEGORÍAS ───────────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Categorías
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORY_OPTIONS
              .filter(cat => cat.slug !== ALCOHOL_CATEGORY_SLUG)
              .slice(0, 12)
              .map(cat => (
                <Link
                  key={cat.slug}
                  href={`/categoria/${cat.slug}`}
                  className="store-card flex flex-col items-center justify-center p-4 text-center min-h-[80px] group hover:border-purple/40"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="text-3xl mb-2">
                    {CATEGORY_ICONS[cat.slug] || '📦'}
                  </div>
                  <span className="font-bold text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {cat.name}
                  </span>
                </Link>
              ))}
          </div>
        </section>

        {/* ─── PROMOTIONS ───────────────────────────────────────────── */}
        {activePromotions.length > 0 && (
          <div className="mb-16">
            {activePromotions.slice(0, 1).map((promo: any) => (
              <PromotionBanner key={promo.id} promotion={promo} />
            ))}
          </div>
        )}

        {/* ─── OFFERS POR TIENDA ────────────────────────────────────── */}
        {activeOffers.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
              Ofertas destacadas
            </h2>
            {activeStores.map((store: any) => {
              const storeOffers = activeOffers
                .filter((o: any) =>
                  o.store_slug === store.slug &&
                  o.category_slug !== ALCOHOL_CATEGORY_SLUG
                )
                .slice(0, 5);
              return (
                <StoreSection key={store.id} store={store} offers={storeOffers} />
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-24 rounded-2xl"
               style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-6xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Conecta tu base de datos
            </h2>
            <p className="max-w-md mx-auto mb-8 text-sm leading-relaxed"
               style={{ color: 'var(--text-muted)' }}>
              Configura las variables de entorno de Supabase en tu archivo{' '}
              <code className="px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--teal)' }}>
                .env.local
              </code>{' '}
              para ver ofertas reales.
            </p>
            <div className="inline-flex flex-wrap gap-3 text-xs justify-center">
              <span className="px-4 py-2 rounded-lg font-medium"
                    style={{ backgroundColor: 'var(--teal-light)', color: 'var(--teal)' }}>
                NEXT_PUBLIC_SUPABASE_URL
              </span>
              <span className="px-4 py-2 rounded-lg font-medium"
                    style={{ backgroundColor: 'var(--purple-light)', color: 'var(--purple)' }}>
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
