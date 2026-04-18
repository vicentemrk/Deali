import React from 'react';
import Image from 'next/image';

export type OfferCardData = {
  offer_id?: string;
  product_name?: string;
  productName?: string;
  product_image_url?: string;
  productImageUrl?: string;
  image_url?: string;
  imageUrl?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  category_name?: string;
  categoryName?: string;
  original_price?: number | string;
  originalPrice?: number | string;
  offer_price?: number | string;
  offerPrice?: number | string;
  discount_pct?: number | string;
  discountPct?: number | string;
  offer_url?: string;
  offerUrl?: string;
  end_date?: string | Date | null;
  endDate?: string | Date | null;
};

interface OfferCardProps {
  offer: OfferCardData;
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
  const endDate = hasKnownEndDate && endDateValue ? new Date(endDateValue) : null;
  const now = new Date();
  const timeDiff = endDate ? endDate.getTime() - now.getTime() : Number.POSITIVE_INFINITY;
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const expiresSoon = daysDiff <= 3 && daysDiff >= 0;
  const initials = productName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word: string) => word[0])
    .join('')
    .toUpperCase();

  const hasValidPrice = Number.isFinite(offerPrice) && offerPrice > 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card sm:p-5">
      <div className="pointer-events-none absolute -inset-8 bg-gradient-to-br from-teal-light/70 via-purple-light/60 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="absolute right-4 top-4 z-20 rounded-xl bg-deal-red px-3 py-1.5 text-xs font-extrabold text-white shadow-md">
        -{Math.max(0, discountPct)}%
      </div>

      {expiresSoon && (
        <div className="absolute right-4 top-14 z-20 rounded-lg bg-amber px-2 py-1 text-[10px] font-bold text-white shadow-md animate-pulse">
          ¡Expira pronto!
        </div>
      )}

      <div className="relative z-10 mb-3 mt-10 h-36 w-full overflow-hidden rounded-2xl border border-border/70 bg-white transition-transform duration-500 ease-out group-hover:scale-[1.02] sm:mt-12 sm:h-40">
        {productImageUrl ? (
          <Image
            src={productImageUrl}
            alt={productName}
            fill
            sizes="(max-width: 640px) 100vw, 280px"
            className="absolute inset-0 h-full w-full object-contain drop-shadow-sm mix-blend-multiply p-2"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-light via-white to-purple-light">
            <svg
              className="mb-3 h-20 w-20 text-teal/35"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="6" r="3.5" opacity="0.8" />
              <path d="M 8.5 6 L 8 16 C 8 18.2 9.8 20 12 20 C 14.2 20 16 18.2 16 16 L 15.5 6" opacity="0.9" />
              <circle cx="12" cy="16" r="3.5" opacity="0.7" />
            </svg>
            <span className="px-3 text-center text-xs font-semibold leading-tight text-teal/40">
              {initials || 'PRODUCTO'}
            </span>
          </div>
        )}
      </div>

      <div className="z-10 mt-2 flex flex-grow flex-col">
        <span className="mb-2 inline-block w-max rounded-md bg-purple-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-purple">
          {categoryName}
        </span>

        <h3 className="mb-2 line-clamp-2 text-[15px] font-bold leading-snug text-ink-strong transition-colors duration-200 group-hover:text-teal">
          {productName}
        </h3>

        <div className="flex-grow" />

        <div className="mb-4 mt-3 flex items-end gap-2">
          <span className="text-2xl font-black tracking-tight text-teal sm:text-3xl">
            {hasValidPrice ? `$${offerPrice.toLocaleString('es-CL')}` : 'Precio no disponible'}
          </span>
          {originalPrice > offerPrice && (
            <span className="mb-1 text-sm font-semibold text-ink-weak line-through">
              ${originalPrice.toLocaleString('es-CL')}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="rounded-lg border border-border bg-teal-light/70 px-2.5 py-2 text-[11px] font-bold text-ink-weak shadow-sm sm:px-3 sm:text-xs">
            {endDate
              ? `Hasta ${endDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`
              : 'Vigencia indefinida'}
          </div>
          
          <a
            href={offerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-purple/90 hover:shadow-lg hover:shadow-purple/30"
          >
            Ver Oferta
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
