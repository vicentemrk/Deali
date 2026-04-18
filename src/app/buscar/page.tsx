import React from 'react';
import { OfferCard } from '@/components/OfferCard';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

interface PageProps {
  searchParams: { q?: string; page?: string };
}

export async function generateMetadata({ searchParams }: PageProps) {
  const query = searchParams.q || '';
  return {
    title: `Resultados para "${query}" | Deali`,
    description: `Ofertas encontradas para ${query} en supermercados chilenos.`,
  }
}

export default async function BuscarPage({ searchParams }: PageProps) {
  const query = searchParams.q || '';
  const page = searchParams.page || '1';
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = 20;
  
  // Note: For a real production app, we would ideally have a /api/search endpoint.
  // We'll reuse the offers endpoint but pass 'q' as an argument.
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/offers?q=${encodeURIComponent(query)}&page=${page}&limit=${pageSize}`, { next: { revalidate: 300 } });
  
    let offers = [];
    let total = 0;
  if (res.ok) {
     const data = await res.json();
     offers = data.data;
      total = data.total || 0;
  }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const hasPrev = pageNumber > 1;
    const hasNext = pageNumber < totalPages;




  return (
    <div className="min-h-screen bg-bg-page font-sans text-gray-900 flex flex-col">
      <main className="container mx-auto px-6 py-12 flex-1">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-border shadow-sm hover:shadow text-gray-700">
            Volver
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Resultados de búsqueda</h1>
        <p className="text-gray-500 mb-8">Buscando: <span className="font-semibold text-purple">"{query}"</span></p>
        
        {offers.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 text-center shadow-sm">
            <span className="text-4xl mb-4 block">🔍</span>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No encontramos resultados</h2>
            <p className="text-gray-500">Intenta buscar con otras palabras clave o navega por las categorías.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {offers.map((offer: any) => (
                <OfferCard key={offer.offer_id} offer={offer} />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              {hasPrev ? (
                <Link
                  href={`/buscar?q=${encodeURIComponent(query)}&page=${pageNumber - 1}`}
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
                  href={`/buscar?q=${encodeURIComponent(query)}&page=${pageNumber + 1}`}
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
