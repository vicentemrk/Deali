import React from 'react';
import { OfferCard } from '@/components/OfferCard';
import { Footer } from '@/components/Footer';
import { CATEGORY_OPTIONS, SORT_OPTIONS } from '@/lib/catalog';
import Link from 'next/link';
import { fetchJson, type OfferCardData, type PagedOffersResponse } from '@/lib/siteData';

export const revalidate = 1800; // ISR: regenera la página cada 30 min desde CDN

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: Promise<{ page?: string; category?: string; sort?: string }> | { page?: string; category?: string; sort?: string };
}

const STORE_DEMO_OFFERS: OfferCardData[] = [
  {
    offer_id: 'demo-store-1',
    product_name: 'Detergente ropa liquido 3L',
    category_name: 'Limpieza del Hogar',
    original_price: 8990,
    offer_price: 6290,
    discount_pct: 30,
    offer_url: '#',
  },
  {
    offer_id: 'demo-store-2',
    product_name: 'Arroz grado 1 1kg',
    category_name: 'Despensa',
    original_price: 1790,
    offer_price: 1290,
    discount_pct: 28,
    offer_url: '#',
  },
  {
    offer_id: 'demo-store-3',
    product_name: 'Atun lomitos en agua 170g',
    category_name: 'Despensa',
    original_price: 1590,
    offer_price: 1190,
    discount_pct: 25,
    offer_url: '#',
  },
  {
    offer_id: 'demo-store-4',
    product_name: 'Pechuga de pollo bandeja 1kg',
    category_name: 'Carnes y Pescados',
    original_price: 6890,
    offer_price: 5290,
    discount_pct: 23,
    offer_url: '#',
  },
];

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug || 'tienda';
  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: `Ofertas en ${storeName} | Deali`,
    description: `Encuentra las mejores ofertas de ${storeName} actualizadas en tiempo real.`,
  };
}

export default async function SupermercadoPage({ params, searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);

  const slug = resolvedParams?.slug || 'tienda';
  const page = resolvedSearchParams?.page || '1';
  const category = resolvedSearchParams?.category || '';
  const sort = resolvedSearchParams?.sort || 'discount_desc';
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = 20;

  const query = new URLSearchParams({ page, limit: String(pageSize), sort });
  if (category) query.set('category', category);
  
  const data = await fetchJson<PagedOffersResponse>(`/api/stores/${slug}/offers?${query.toString()}`, { next: { revalidate: 1800 } });
  const apiOffers = data?.data || [];
  const offers: OfferCardData[] = apiOffers.length > 0 ? apiOffers : STORE_DEMO_OFFERS;
  const total = apiOffers.length > 0 ? data?.total || 0 : STORE_DEMO_OFFERS.length;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = pageNumber > 1;
  const hasNext = pageNumber < totalPages;

  const prevParams = new URLSearchParams();
  prevParams.set('page', String(pageNumber - 1));
  prevParams.set('sort', sort);
  if (category) prevParams.set('category', category);

  const nextParams = new URLSearchParams();
  nextParams.set('page', String(pageNumber + 1));
  nextParams.set('sort', sort);
  if (category) nextParams.set('category', category);

  return (
    <div className="min-h-screen bg-bg-page font-sans text-gray-900 flex flex-col">
      <main className="container mx-auto px-6 py-12 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-border shadow-sm hover:shadow text-gray-700">
              Volver
            </Link>
            <h1 className="text-4xl font-bold capitalize text-purple m-0">Ofertas en {slug}</h1>
          </div>

          <form method="GET" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="page" value={page} />

            <label htmlFor="sort" className="text-sm font-medium text-gray-700">Ordenar</label>
            <select id="sort" name="sort" defaultValue={sort} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <label htmlFor="category" className="text-sm font-medium text-gray-700">Categoría</label>
            <select id="category" name="category" defaultValue={category} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Todas</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.slug} value={option.slug}>{option.name}</option>
              ))}
            </select>

            <button type="submit" className="bg-purple text-white text-sm rounded-lg px-3 py-2">Aplicar</button>
          </form>
        </div>
        
        {offers.length === 0 ? (
          <p className="text-gray-500">No hay ofertas activas en esta tienda.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {offers.map((offer) => (
                <OfferCard key={offer.offer_id} offer={offer} />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              {hasPrev ? (
                <Link
                  href={`/supermercado/${slug}?${prevParams.toString()}`}
                  className="bg-white px-4 py-2 rounded-full border border-border shadow-sm hover:shadow text-gray-700"
                >
                  Anterior
                </Link>
              ) : (
                <span className="px-4 py-2 rounded-full border border-border text-gray-400">Anterior</span>
              )}

              <span className="text-sm text-gray-600">Pagina {pageNumber} de {totalPages}</span>

              {hasNext ? (
                <Link
                  href={`/supermercado/${slug}?${nextParams.toString()}`}
                  className="bg-white px-4 py-2 rounded-full border border-border shadow-sm hover:shadow text-gray-700"
                >
                  Siguiente
                </Link>
              ) : (
                <span className="px-4 py-2 rounded-full border border-border text-gray-400">Siguiente</span>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
