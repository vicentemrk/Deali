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
  if (!offers || offers.length === 0) return null;

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

      <div className="flex overflow-x-auto gap-4 pb-2 snap-x hidescrollbar">
        {offers.map((offer) => (
          <div key={offer.offer_id} className="min-w-[320px] max-w-[320px] snap-start">
            <OfferCard offer={offer} />
          </div>
        ))}
      </div>
    </section>
  );
}
