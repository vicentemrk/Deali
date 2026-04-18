import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { OfferCard, type OfferCardData } from '@/components/OfferCard';

interface StoreSectionProps {
  store: {
    name: string;
    slug: string;
    color_hex: string;
    logo_url?: string;
  };
  offers: OfferCardData[];
}

export function StoreSection({ store, offers }: StoreSectionProps) {
  return (
    <section className="mb-12 rounded-3xl border border-border bg-white/70 p-5 shadow-soft sm:p-6">
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold" style={{ color: store.color_hex }}>
            {store.name}
          </h2>
        </div>
        <Link 
          href={`/supermercado/${store.slug}`}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold text-ink-weak transition-colors hover:text-teal"
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
        <div className="rounded-2xl border border-dashed border-border bg-bg-card px-4 py-8 text-sm text-ink-weak">
          Aún no hay ofertas cargadas para este supermercado.
        </div>
      )}
    </section>
  );
}
