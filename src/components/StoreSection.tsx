import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { OfferCard } from './OfferCard';

interface StoreSectionProps {
  store: {
    name: string;
    slug: string;
    color_hex: string;
  };
  offers: any[];
  totalOffers: number;
}

export function StoreSection({ store, offers, totalOffers }: StoreSectionProps) {
  if (!offers || offers.length === 0) return null;

  return (
    <section className="mb-14">
      {/* Header de sección */}
      <div
        className="flex items-center justify-between mb-5 px-4 py-3 rounded-xl"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-3">
          <h2
            className="text-lg font-bold"
            style={{ color: store.color_hex }}
          >
            {store.name}
          </h2>
        </div>

        <Link
          href={`/supermercado/${store.slug}`}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          VER {totalOffers} OFERTAS
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Carrusel horizontal */}
      <div className="flex overflow-x-auto gap-4 pb-3 snap-x hidescrollbar">
        {offers.map((offer) => (
          <div
            key={offer.offer_id}
            className="min-w-[260px] max-w-[260px] snap-start"
          >
            <OfferCard offer={offer} />
          </div>
        ))}
      </div>
    </section>
  );
}
