import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { OfferCard } from './OfferCard';

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
          {/* Punto de color de la tienda */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: store.color_hex }}
          />

          {store.logo_url && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={store.logo_url}
                alt={store.name}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
          )}

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
          Ver todas
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
