import React from 'react';
import { OfferCard } from '@/components/OfferCard';
import { Pagination } from '@/components/Pagination';
import { Footer } from '@/components/Footer';
import { CATEGORY_OPTIONS, SORT_OPTIONS } from '@/lib/catalog';
import Link from 'next/link';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { fetchJson, type OfferCardData, type PagedOffersResponse } from '@/lib/siteData';

export const revalidate = 1800; // ISR: regenera la página cada 30 min desde CDN

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: Promise<{ page?: string; category?: string; sort?: string }> | { page?: string; category?: string; sort?: string };
}

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
  const offers: OfferCardData[] = data?.data || [];
  const total = data?.total || 0;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const storeName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');

  function buildHref(targetPage: number): string {
    const p = new URLSearchParams();
    p.set('page', String(targetPage));
    p.set('sort', sort);
    if (category) p.set('category', category);
    return `/supermercado/${slug}?${p.toString()}`;
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 flex flex-col">
      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 flex-1">
        {/* Header */}
        <div className="animate-fade-in-up mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-ink-weak shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:text-teal"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            <h1 className="text-2xl font-bold capitalize text-purple sm:text-3xl lg:text-4xl">{storeName}</h1>
            {total > 0 && (
              <span className="rounded-full bg-purple-light px-3 py-1 text-xs font-bold text-purple">
                {total} ofertas
              </span>
            )}
          </div>

          {/* Filters */}
          <form method="GET" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="page" value="1" />

            <div className="flex items-center gap-1.5 text-sm text-ink-weak">
              <SlidersHorizontal className="h-4 w-4" />
            </div>

            <select id="sort" name="sort" defaultValue={sort} className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition-colors focus:border-purple focus:ring-2 focus:ring-purple/20">
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select id="category" name="category" defaultValue={category} className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition-colors focus:border-purple focus:ring-2 focus:ring-purple/20">
              <option value="">Todas las categorías</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.slug} value={option.slug}>{option.name}</option>
              ))}
            </select>

            <button type="submit" className="rounded-xl bg-purple px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-purple/90 hover:shadow-md hover:shadow-purple/20">
              Aplicar
            </button>
          </form>
        </div>
        
        {offers.length === 0 ? (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-border bg-white/70 p-12 text-center backdrop-blur-sm">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No hay ofertas disponibles</h2>
            <p className="text-gray-500">No se encontraron ofertas activas en esta tienda con los filtros seleccionados.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 stagger-children">
              {offers.map((offer) => (
                <div key={offer.offer_id} className="animate-fade-in-up">
                  <OfferCard offer={offer} />
                </div>
              ))}
            </div>

            <Pagination
              currentPage={pageNumber}
              totalPages={totalPages}
              buildHref={buildHref}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
