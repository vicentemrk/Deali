import React from 'react';
import { OfferCard } from '@/components/OfferCard';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { SORT_OPTIONS } from '@/lib/catalog';
import { fetchJson, type OfferCardData, type PagedOffersResponse } from '@/lib/siteData';

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: Promise<{ page?: string; sort?: string }> | { page?: string; sort?: string };
}

const CATEGORY_DEMO_OFFERS: OfferCardData[] = [
  {
    offer_id: 'demo-category-1',
    product_name: 'Pack yogurt natural 8u',
    category_name: 'Lacteos',
    original_price: 3290,
    offer_price: 2490,
    discount_pct: 24,
    offer_url: '#',
  },
  {
    offer_id: 'demo-category-2',
    product_name: 'Queso gauda laminado 500g',
    category_name: 'Lacteos',
    original_price: 5390,
    offer_price: 3990,
    discount_pct: 26,
    offer_url: '#',
  },
  {
    offer_id: 'demo-category-3',
    product_name: 'Leche semidescremada 1L x6',
    category_name: 'Lacteos',
    original_price: 6390,
    offer_price: 5190,
    discount_pct: 19,
    offer_url: '#',
  },
  {
    offer_id: 'demo-category-4',
    product_name: 'Mantequilla sin sal 250g',
    category_name: 'Lacteos',
    original_price: 2890,
    offer_price: 2290,
    discount_pct: 21,
    offer_url: '#',
  },
];

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug || 'categoria';
  const catName = slug.replace('-', ' ');
  return {
    title: `Ofertas de ${catName} | Deali`,
    description: `Encuentra las mejores ofertas en la categoría ${catName}.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);

  const slug = resolvedParams?.slug || 'categoria';
  const page = resolvedSearchParams?.page || '1';
  const sort = resolvedSearchParams?.sort || 'discount_desc';
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = 20;
  
  const data = await fetchJson<PagedOffersResponse>(`/api/offers?category=${slug}&page=${page}&limit=${pageSize}&sort=${sort}`, { next: { revalidate: 1800 } });
  const apiOffers = data?.data || [];
  const offers: OfferCardData[] = apiOffers.length > 0 ? apiOffers : CATEGORY_DEMO_OFFERS;
  const total = apiOffers.length > 0 ? data?.total || 0 : CATEGORY_DEMO_OFFERS.length;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = pageNumber > 1;
  const hasNext = pageNumber < totalPages;

  return (
    <div className="min-h-screen bg-bg-page font-sans text-gray-900 flex flex-col">
      <main className="container mx-auto px-6 py-12 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-border shadow-sm hover:shadow text-gray-700">
              Volver
            </Link>
            <h1 className="text-4xl font-bold capitalize text-teal">Categoría: {slug.replaceAll('-', ' ')}</h1>
          </div>

          <form method="GET" className="flex items-center gap-2">
            <input type="hidden" name="page" value={page} />
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">Ordenar por</label>
            <select
              id="sort"
              name="sort"
              defaultValue={sort}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button type="submit" className="bg-teal text-white text-sm rounded-lg px-3 py-2">Aplicar</button>
          </form>
        </div>
        
        {offers.length === 0 ? (
          <p className="text-gray-500">No hay ofertas disponibles en esta categoría.</p>
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
                  href={`/categoria/${slug}?page=${pageNumber - 1}&sort=${encodeURIComponent(sort)}`}
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
                  href={`/categoria/${slug}?page=${pageNumber + 1}&sort=${encodeURIComponent(sort)}`}
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
