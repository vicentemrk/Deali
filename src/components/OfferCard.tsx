import React from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

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
  store_name?: string;
  storeName?: string;
  store_color_hex?: string;
  storeColorHex?: string;
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
  const storeName = offer.store_name || offer.storeName || '';
  const storeColor = offer.store_color_hex || offer.storeColorHex || '#6b7280';
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple/10 sm:p-5">
      {/* Subtle gradient glow on hover */}
      <div className="pointer-events-none absolute -inset-6 bg-gradient-to-br from-teal/5 via-purple/5 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      {/* Discount badge */}
      <div className="absolute right-3 top-3 z-20 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-lg shadow-red-500/25">
        -{Math.max(0, Math.round(discountPct))}%
      </div>

      {/* Expiring soon badge */}
      {expiresSoon && (
        <div className="absolute right-3 top-12 z-20 rounded-lg bg-amber-500 px-2 py-1 text-[10px] font-bold text-white shadow-md animate-pulse">
          ¡Expira pronto!
        </div>
      )}

      {/* Store badge */}
      {storeName && (
        <div
          className="absolute left-3 top-3 z-20 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white shadow-sm"
          style={{ backgroundColor: storeColor }}
        >
          {storeName}
        </div>
      )}

      {/* Image */}
      <div className="relative z-10 mx-auto mb-3 mt-8 h-32 w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-white transition-transform duration-500 ease-out group-hover:scale-[1.03] sm:mt-10 sm:h-36">
        {productImageUrl ? (
          <Image
            src={productImageUrl}
            alt={productName}
            fill
            sizes="(max-width: 640px) 100vw, 280px"
            className="absolute inset-0 h-full w-full object-contain p-3 mix-blend-multiply drop-shadow-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-light via-white to-purple-light">
            <span className="text-3xl font-black text-teal/20">
              {initials || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="z-10 mt-1 flex flex-grow flex-col">
        <span className="mb-1.5 inline-block w-max rounded-md bg-purple-light/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-purple">
          {categoryName}
        </span>

        <h3 className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors duration-200 group-hover:text-teal">
          {productName}
        </h3>

        <div className="flex-grow" />

        {/* Price */}
        <div className="mb-3 mt-2 flex items-end gap-2">
          <span className="text-xl font-black tracking-tight text-teal sm:text-2xl">
            {hasValidPrice ? `$${offerPrice.toLocaleString('es-CL')}` : 'Sin precio'}
          </span>
          {originalPrice > offerPrice && (
            <span className="mb-0.5 text-xs font-semibold text-ink-weak line-through decoration-red-400">
              ${originalPrice.toLocaleString('es-CL')}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <div className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-[10px] font-semibold text-ink-weak">
            {endDate
              ? `Hasta ${endDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`
              : 'Vigente'}
          </div>

          <a
            href={offerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn inline-flex items-center gap-1.5 rounded-xl bg-purple px-3.5 py-2 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-purple/90 hover:shadow-md hover:shadow-purple/25"
          >
            Ver Oferta
            <ExternalLink className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
