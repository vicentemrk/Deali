import React from 'react';
import Image from 'next/image';

interface OfferCardProps {
  offer: {
    product_name: string;
    product_image_url: string;
    category_name: string;
    original_price: number;
    offer_price: number;
    discount_pct: number;
    offer_url: string;
    start_date: string;
    end_date: string;
    store_name: string;
    store_color_hex: string;
    store_logo_url?: string;
  };
}

export function OfferCard({ offer }: OfferCardProps) {
  const hasKnownEndDate = Boolean(offer.end_date) && !String(offer.end_date).startsWith('9999');
  const endDate = hasKnownEndDate ? new Date(offer.end_date) : null;
  const now = new Date();
  const timeDiff = endDate ? endDate.getTime() - now.getTime() : Number.POSITIVE_INFINITY;
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const expiresSoon = daysDiff <= 3 && daysDiff >= 0;

  return (
    <div className="group relative flex flex-col bg-[#F0FDFA] rounded-3xl p-5 hover:-translate-y-2 transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(13,148,136,0.1)] hover:shadow-[0_15px_30px_-8px_rgba(13,148,136,0.2)] border border-teal/10 overflow-hidden">
      
      {/* Decorative background glow on hover */}
      <div className="absolute -inset-4 bg-gradient-to-br from-teal-light via-[#F0EEFF] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl z-0 pointer-events-none" />

      {/* Brand Badge removed as requested */}

      {/* Discount Badge */}
      <div className="absolute top-4 right-4 bg-deal-red text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-[0_4px_10px_rgba(220,38,38,0.3)] z-20 transform rotate-3 group-hover:rotate-0 group-hover:scale-105 transition-all duration-300">
        -{offer.discount_pct}%
      </div>

      {expiresSoon && (
        <div className="absolute top-14 right-4 bg-amber text-white text-[10px] font-bold px-2 py-1 rounded-lg z-20 animate-pulse shadow-md">
          ¡Expira pronto!
        </div>
      )}

      {/* Image Area */}
      <div className="relative w-full h-44 mt-12 mb-4 z-10 group-hover:scale-110 transition-transform duration-500 ease-out">
        <Image
          src={offer.product_image_url || '/placeholder-product.png'}
          alt={offer.product_name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          className="object-contain drop-shadow-sm mix-blend-multiply"
        />
      </div>

      <div className="flex flex-col flex-grow z-10 mt-2">
        {/* Category */}
        <span className="inline-block px-2 py-0.5 bg-[#F0EEFF] text-purple text-[10px] font-bold uppercase tracking-widest rounded-md w-max mb-2">
          {offer.category_name || 'General'}
        </span>

        {/* Title */}
        <h3 className="text-[15px] font-bold text-footer leading-snug mb-2 line-clamp-2 group-hover:text-teal transition-colors duration-200">
          {offer.product_name}
        </h3>

        <div className="flex-grow" />

        {/* Pricing */}
        <div className="flex items-end gap-2 mt-4 mb-5">
          <span className="text-3xl font-black text-teal tracking-tighter">
            ${offer.offer_price.toLocaleString('es-CL')}
          </span>
          {offer.original_price > offer.offer_price && (
            <span className="text-sm font-semibold text-gray-500 line-through mb-1">
               ${offer.original_price.toLocaleString('es-CL')}
            </span>
          )}
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between border-t border-teal/10 pt-4">
          <div className="text-xs font-bold text-gray-600 bg-teal-light/60 px-3 py-2 rounded-lg border border-teal/10 shadow-sm">
            {endDate
              ? `Hasta ${endDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`
              : 'No especificado'}
          </div>
          
          <a 
            href={offer.offer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn flex items-center gap-2 bg-purple text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg hover:shadow-purple/30"
          >
            Ver Oferta
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 transform group-hover/btn:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
