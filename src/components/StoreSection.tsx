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
            className="min-w-[260px] max-w-[260px] snap-start bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col"
          >
            <div className="relative h-36 w-full mb-3 overflow-hidden rounded-xl bg-gradient-to-br from-teal-light via-white to-[#F0EEFF] border border-gray-100">
              {offer.product_image_url || offer.image_url || offer.imageUrl ? (
                <img
                  src={offer.product_image_url || offer.image_url || offer.imageUrl}
                  alt={offer.product_name}
                  className="absolute inset-0 h-full w-full object-contain p-3"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-teal/30">
                  {offer.product_name
                    ?.split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part: string) => part[0])
                    .join('')
                    .toUpperCase() || 'DA'}
                </div>
              )}
            </div>

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
