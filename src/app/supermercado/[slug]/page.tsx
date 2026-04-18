import React from 'react';
import { OfferCard } from '@/components/OfferCard';
import { Footer } from '@/components/Footer';
import { CATEGORY_OPTIONS, SORT_OPTIONS } from '@/lib/catalog';
import Link from 'next/link';

export const revalidate = 1800; // ISR: regenera la página cada 30 min desde CDN


interface PageProps {
  params: { slug: string };
  searchParams: { page?: string; category?: string; sort?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const storeName = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
  return {
    title: `Ofertas en ${storeName} | Deali`,
    description: `Encuentra las mejores ofertas de ${storeName} actualizadas en tiempo real.`,
  }
}

type StoreOffer = {
  offer_id: string;
  [key: string]: unknown;
};

type StoreResponse = {
  data: StoreOffer[];
  total: number;
};

export default async function SupermercadoPage({ params, searchParams }: PageProps) {
  const page = searchParams.page || '1';
  const category = searchParams.category || '';
  const sort = searchParams.sort || 'discount_desc';
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = 20;

  const query = new URLSearchParams({ page, limit: String(pageSize), sort });
  if (category) query.set('category', category);
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stores/${params.slug}/offers?${query.toString()}`, { next: { revalidate: 1800 } });
  
    let offers: StoreOffer[] = [];
    let total = 0;
  if (res.ok) {
    const data = (await res.json()) as StoreResponse;
    offers = data.data;
    total = data.total || 0;
  }

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
            <h1 className="text-4xl font-bold capitalize text-purple m-0">Ofertas en {params.slug}</h1>
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
                  href={`/supermercado/${params.slug}?${prevParams.toString()}`}
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
                  href={`/supermercado/${params.slug}?${nextParams.toString()}`}
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
