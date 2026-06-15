import type { Offer } from '../types'

interface OfferCardProps {
  offer: Offer
}

/** Formatea precios en CLP: 1290 → "$1.290" */
function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value)
}

export function OfferCard({ offer }: OfferCardProps) {
  const discount = offer.discount_pct ? Math.round(offer.discount_pct) : null

  return (
    <a
      href={offer.offer_url}
      target="_blank"
      rel="noopener noreferrer"
      className="offer-card group"
      aria-label={`Ver oferta: ${offer.product_name} en ${offer.store_name}`}
    >
      {/* Imagen */}
      <div className="relative overflow-hidden bg-[--color-surface-2]">
        {offer.product_image_url ? (
          <img
            src={offer.product_image_url}
            alt={offer.product_name}
            className="offer-card__image group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="offer-card__image flex items-center justify-center"
            aria-hidden="true"
          >
            <svg className="w-12 h-12 text-[--color-surface-3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badge descuento */}
        {discount !== null && discount > 0 && (
          <span
            className="discount-badge absolute top-2 right-2"
            aria-label={`${discount}% de descuento`}
          >
            -{discount}%
          </span>
        )}
      </div>

      {/* Body */}
      <div className="offer-card__body">
        {/* Tienda */}
        <span
          className="store-badge"
          style={{ color: offer.store_color ?? undefined }}
        >
          {offer.store_name}
        </span>

        {/* Nombre del producto */}
        <p className="offer-card__name" title={offer.product_name}>
          {offer.product_name}
        </p>

        {/* Precios */}
        <div className="offer-card__prices">
          <span className="offer-card__price-offer">
            {formatCLP(offer.offer_price)}
          </span>
          {offer.original_price && offer.original_price > offer.offer_price && (
            <span className="offer-card__price-original">
              {formatCLP(offer.original_price)}
            </span>
          )}
        </div>
      </div>
    </a>
  )
}
