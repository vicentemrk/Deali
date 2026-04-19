import React from 'react';
import { OfferCard } from '@/components/OfferCard';
import { Pagination } from '@/components/Pagination';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { fetchJson, type OfferCardData, type PagedOffersResponse } from '@/lib/siteData';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }> | { q?: string; page?: string };
}

export async function generateMetadata({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const query = resolvedSearchParams.q || '';
  return {
    title: `Resultados para "${query}" | Deali`,
    description: `Ofertas encontradas para ${query} en supermercados chilenos.`,
  };
}

export default async function BuscarPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const query = resolvedSearchParams.q || '';
  const page = resolvedSearchParams.page || '1';
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = 20;

  const data = await fetchJson<PagedOffersResponse>(`/api/offers?q=${encodeURIComponent(query)}&page=${page}&limit=${pageSize}`, { next: { revalidate: 300 } });

  const offers: OfferCardData[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildHref(targetPage: number): string {
    return `/buscar?q=${encodeURIComponent(query)}&page=${targetPage}`;
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
              <Search className="h-5 w-5 text-purple" />
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Resultados</h1>
            </div>
          </div>
          <p className="text-base text-ink-weak">
            Buscando: <span className="rounded-lg bg-purple-light px-2.5 py-1 font-bold text-purple">&quot;{query}&quot;</span>
            {total > 0 && <span className="ml-2 text-sm text-ink-weak">({total} resultados)</span>}
          </p>
        </div>

        {offers.length === 0 ? (
          <div className="animate-fade-in-up rounded-2xl border border-dashed border-border bg-white/70 p-12 text-center backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">No encontramos resultados</h2>
            <p className="text-gray-500 max-w-md mx-auto">Intenta buscar con otras palabras clave o navega por las categorías.</p>
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
