import React from 'react';
import Link from 'next/link';
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
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={store.logo_url}
                alt={store.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
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

      <div className="flex overflow-x-auto gap-4 pb-2 snap-x hidescrollbar">
        {offers.map((offer) => (
          <article
            key={offer.offer_id}
            className="min-w-[260px] max-w-[260px] snap-start bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
          >
            <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-3">{offer.product_name}</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-black text-teal">${offer.offer_price.toLocaleString('es-CL')}</span>
              {offer.original_price > offer.offer_price && (
                <span className="text-xs text-gray-500 line-through">${offer.original_price.toLocaleString('es-CL')}</span>
              )}
            </div>
            <a
              href={offer.offer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-purple text-white text-xs font-semibold px-3 py-2"
            >
              Ver oferta
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
