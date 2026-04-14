import React from 'react';
import { OfferCard } from '@/components/OfferCard';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { SORT_OPTIONS } from '@/lib/catalog';

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string; sort?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const catName = params.slug.replace('-', ' ');
  return {
    title: `Ofertas de ${catName} | Deali`,
    description: `Encuentra las mejores ofertas en la categoría ${catName}.`,
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const page = searchParams.page || '1';
  const sort = searchParams.sort || 'discount_desc';
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/offers?category=${params.slug}&page=${page}&sort=${sort}`, { next: { revalidate: 1800 } });
  
  let offers = [];
  if (res.ok) {
     const data = await res.json();
     offers = data.data;
  }

  return (
    <div className="min-h-screen bg-bg-page font-sans text-gray-900 flex flex-col">
      <main className="container mx-auto px-6 py-12 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-border shadow-sm hover:shadow text-gray-700">
              Volver
            </Link>
            <h1 className="text-4xl font-bold capitalize text-teal">Categoría: {params.slug.replaceAll('-', ' ')}</h1>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {offers.map((offer: any) => (
              <OfferCard key={offer.offer_id} offer={offer} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
