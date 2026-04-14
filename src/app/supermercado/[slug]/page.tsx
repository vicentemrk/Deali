import React from 'react';
import { OfferCard } from '@/components/OfferCard';
import { Footer } from '@/components/Footer';

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const storeName = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
  return {
    title: `Ofertas en ${storeName} | Deali`,
    description: `Encuentra las mejores ofertas de ${storeName} actualizadas en tiempo real.`,
  }
}

import Link from 'next/link';

export default async function SupermercadoPage({ params, searchParams }: PageProps) {
  const page = searchParams.page || '1';
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stores/${params.slug}/offers?page=${page}`, { next: { revalidate: 1800 } });
  
  let offers = [];
  if (res.ok) {
     const data = await res.json();
     offers = data.data;
  }

  return (
    <div className="min-h-screen bg-bg-page font-sans text-gray-900 flex flex-col">
      <main className="container mx-auto px-6 py-12 flex-1">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="flex items-center justify-center bg-white p-2 rounded-full border border-border shadow-sm hover:shadow hover:bg-gray-50 transition-all text-gray-600 hover:text-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-4xl font-bold capitalize text-purple m-0">Ofertas en {params.slug}</h1>
        </div>
        
        {offers.length === 0 ? (
          <p className="text-gray-500">No hay ofertas activas en esta tienda.</p>
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
