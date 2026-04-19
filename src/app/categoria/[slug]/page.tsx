import React from 'react';
import { OfferCard } from '@/components/OfferCard';
import { Pagination } from '@/components/Pagination';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, SlidersHorizontal, Tag } from 'lucide-react';
import { SORT_OPTIONS } from '@/lib/catalog';
import { fetchJson, type OfferCardData, type PagedOffersResponse } from '@/lib/siteData';

export const revalidate = 1800;

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: Promise<{ page?: string; sort?: string }> | { page?: string; sort?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug || 'categoria';
  const catName = slug.replace(/-/g, ' ');
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
  const offers: OfferCardData[] = data?.data || [];
  const total = data?.total || 0;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const displayName = slug.replace(/-/g, ' ');

  function buildHref(targetPage: number): string {
    const p = new URLSearchParams();
    p.set('page', String(targetPage));
    p.set('sort', sort);
    return `/categoria/${slug}?${p.toString()}`;
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
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-teal" />
              <h1 className="text-2xl font-bold capitalize text-teal sm:text-3xl lg:text-4xl">{displayName}</h1>
            </div>
            {total > 0 && (
              <span className="rounded-full bg-teal-light px-3 py-1 text-xs font-bold text-teal">
                {total} ofertas
              </span>
            )}
          </div>

          {/* Sort */}
          <form method="GET" className="flex items-center gap-2">
            <input type="hidden" name="page" value="1" />
            <SlidersHorizontal className="h-4 w-4 text-ink-weak" />
            <select
              id="sort"
              name="sort"
              defaultValue={sort}
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button type="submit" className="rounded-xl bg-teal px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal/90 hover:shadow-md">
              Aplicar
            </button>
          </form>
        </div>

        {offers.length === 0 ? (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-border bg-white/70 p-12 text-center backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">No hay ofertas en esta categoría</h2>
            <p className="text-gray-500">Las ofertas se actualizan cada 3 horas. Vuelve pronto.</p>
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
