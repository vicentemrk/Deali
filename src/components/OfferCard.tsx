import React from 'react';

interface OfferCardProps {
  offer: Record<string, any>;
}

export function OfferCard({ offer }: OfferCardProps) {
  const productName = offer.product_name || offer.productName || 'Producto sin nombre';
  const productImageUrl =
    offer.product_image_url ||
    offer.productImageUrl ||
    offer.image_url ||
    offer.imageUrl ||
    offer.thumbnail_url ||
    offer.thumbnailUrl ||
    '';
  const categoryName = offer.category_name || offer.categoryName || 'General';
  const originalPrice = Number(offer.original_price ?? offer.originalPrice ?? 0);
  const offerPrice = Number(offer.offer_price ?? offer.offerPrice ?? 0);
  const discountPct = Number(offer.discount_pct ?? offer.discountPct ?? 0);
  const offerUrl = offer.offer_url || offer.offerUrl || '#';
  const endDateValue = offer.end_date || offer.endDate || null;
  const hasKnownEndDate = Boolean(endDateValue) && !String(endDateValue).startsWith('9999');
  const endDate = hasKnownEndDate ? new Date(endDateValue) : null;
  const now = new Date();
  const timeDiff = endDate ? endDate.getTime() - now.getTime() : Number.POSITIVE_INFINITY;
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const expiresSoon = daysDiff <= 3 && daysDiff >= 0;
  const initials = productName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-teal/10 bg-[#F0FDFA] p-4 shadow-[0_4px_20px_-4px_rgba(13,148,136,0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_-8px_rgba(13,148,136,0.2)] sm:p-5">
      
      {/* Decorative background glow on hover */}
      <div className="absolute -inset-4 bg-gradient-to-br from-teal-light via-[#F0EEFF] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl z-0 pointer-events-none" />

      {/* Brand Badge removed as requested */}

      {/* Discount Badge */}
      <div className="absolute top-4 right-4 bg-deal-red text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-[0_4px_10px_rgba(220,38,38,0.3)] z-20 transform rotate-3 group-hover:rotate-0 group-hover:scale-105 transition-all duration-300">
        -{discountPct}%
      </div>

      {expiresSoon && (
        <div className="absolute top-14 right-4 bg-amber text-white text-[10px] font-bold px-2 py-1 rounded-lg z-20 animate-pulse shadow-md">
          ¡Expira pronto!
        </div>
      )}

      {/* Image Area */}
      <div className="relative z-10 mt-10 mb-3 h-36 w-full overflow-hidden rounded-2xl border border-white/70 bg-white/60 transition-transform duration-500 ease-out group-hover:scale-[1.03] sm:mt-12 sm:h-40">
        {productImageUrl ? (
          <img
            src={productImageUrl}
            alt={productName}
            className="absolute inset-0 h-full w-full object-contain drop-shadow-sm mix-blend-multiply p-2"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-light via-white to-[#F0EEFF]">
            {/* Product Icon - More Elegant */}
            <svg
              className="w-20 h-20 text-teal/35 mb-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Cylinder/Product Container */}
              <circle cx="12" cy="6" r="3.5" opacity="0.8" />
              <path d="M 8.5 6 L 8 16 C 8 18.2 9.8 20 12 20 C 14.2 20 16 18.2 16 16 L 15.5 6" opacity="0.9" />
              <circle cx="12" cy="16" r="3.5" opacity="0.7" />
            </svg>
            <span className="text-xs font-semibold text-teal/40 text-center px-3 leading-tight">
              {initials || 'PRODUCTO'}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow z-10 mt-2">
        {/* Category */}
        <span className="mb-2 inline-block w-max rounded-md bg-[#F0EEFF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-purple">
          {categoryName}
        </span>

        {/* Title */}
        <h3 className="mb-2 line-clamp-2 text-[14px] font-bold leading-snug text-footer transition-colors duration-200 group-hover:text-teal sm:text-[15px]">
          {productName}
        </h3>

        <div className="flex-grow" />

        {/* Pricing */}
        <div className="mt-3 mb-4 flex items-end gap-2">
          <span className="text-2xl font-black tracking-tighter text-teal sm:text-3xl">
            ${offerPrice.toLocaleString('es-CL')}
          </span>
          {originalPrice > offerPrice && (
            <span className="mb-1 text-sm font-semibold text-gray-500 line-through">
               ${originalPrice.toLocaleString('es-CL')}
            </span>
          )}
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-3 border-t border-teal/10 pt-3">
          <div className="rounded-lg border border-teal/10 bg-teal-light/60 px-2.5 py-2 text-[11px] font-bold text-gray-600 shadow-sm sm:px-3 sm:text-xs">
            {endDate
              ? `Hasta ${endDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`
              : 'Vigencia indefinida'}
          </div>
          
          <a 
            href={offerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-opacity-90 hover:shadow-lg hover:shadow-purple/30"
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
