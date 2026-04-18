import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { OfferCard } from '@/components/OfferCard';

interface StoreSectionProps {
  store: {
    name: string;
    slug: string;
    color_hex: string;
    logo_url?: string;
  };
  offers: any[];
}

export function StoreSection({ store, offers }: StoreSectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold" style={{ color: store.color_hex }}>
            {store.name}
          </h2>
        </div>
        <Link 
          href={`/supermercado/${store.slug}`}
          className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-teal transition-colors"
        >
          Ver todas <ArrowRight className="w-4 h-4"/>
        </Link>
      </div>

      {offers && offers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {offers.slice(0, 5).map((offer) => (
            <div key={offer.offer_id} className="h-full">
              <OfferCard offer={offer} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-sm text-gray-500">
          Aún no hay ofertas cargadas para este supermercado.
        </div>
      )}
    </section>
  );
}
