import React from 'react';
import { OfferCard } from '@/components/OfferCard';
import { Footer } from '@/components/Footer';

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string };
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
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/offers?category=${params.slug}&page=${page}`, { next: { revalidate: 1800 } });
  
  let offers = [];
  if (res.ok) {
     const data = await res.json();
     offers = data.data;
  }

  return (
    <div className="min-h-screen bg-bg-page font-sans text-gray-900 flex flex-col">
      <main className="container mx-auto px-6 py-12 flex-1">
        <h1 className="text-4xl font-bold mb-8 capitalize text-teal">Categoría: {params.slug.replace('-', ' ')}</h1>
        
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
