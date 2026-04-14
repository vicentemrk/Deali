import React from 'react';
import Link from 'next/link';
import { OfferCard } from './OfferCard';
import { ArrowRight } from 'lucide-react';

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
  if (!offers || offers.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          {store.logo_url && (
             <img src={store.logo_url} alt={store.name} className="w-10 h-10 rounded-full object-cover" />
          )}
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

      <div className="flex overflow-x-auto gap-6 pb-4 snap-x hidescrollbar">
        {offers.map(offer => (
          <div key={offer.offer_id} className="min-w-[300px] max-w-[300px] snap-start">
             <OfferCard offer={offer} />
          </div>
        ))}
      </div>
    </section>
  );
}
