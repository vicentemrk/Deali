import { useRef, useEffect } from 'react'
import type { Offer } from '../types'

interface OfferCardProps {
  offer: Offer
}

/** Formatea precios en CLP con Geist Mono tabular: 1290 → "$1.290" */
function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value)
}

/** Color CSS var por store slug */
function storeColorVar(slug: string): string {
  const map: Record<string, string> = {
    'jumbo':        'var(--color-jumbo)',
    'lider':        'var(--color-lider)',
    'santa-isabel': 'var(--color-santa-isabel)',
    'unimarc':      'var(--color-unimarc)',
    'tottus':       'var(--color-tottus)',
    'acuenta':      'var(--color-acuenta)',
  }
  return map[slug] ?? 'var(--color-accent-2)'
}

/** Icono producto placeholder — Iconsax Bulk */
function IconProduct() {
  return (
    <svg
      width="40" height="40"
      viewBox="0 0 24 24" fill="none"
      style={{ color: 'var(--color-surface-3)' }}
      aria-hidden="true"
    >
      <path
        opacity="0.4"
        d="M21.6699 7.98001L20.6399 14.98C20.2999 17.23 19.2999 18.18 17.0599 18.18H6.93994C4.68994 18.18 3.69994 17.22 3.36994 14.98L2.33994 7.98001C2.21994 7.11001 2.47994 6.30001 2.99994 5.73001C3.51994 5.16001 4.27994 4.83001 5.15994 4.83001H18.8399C19.7199 4.83001 20.4799 5.16001 20.9999 5.73001C21.5199 6.30001 21.7799 7.11001 21.6699 7.98001Z"
        fill="currentColor"
      />
      <path
        d="M13.75 11.53H10.25C9.84 11.53 9.5 11.19 9.5 10.78C9.5 10.37 9.84 10.03 10.25 10.03H13.75C14.16 10.03 14.5 10.37 14.5 10.78C14.5 11.19 14.16 11.53 13.75 11.53Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function OfferCard({ offer }: OfferCardProps) {
  const discount = offer.discount_pct ? Math.round(offer.discount_pct) : null
  const accentColor = storeColorVar(offer.store_slug)
  const imgRef = useRef<HTMLImageElement>(null)

  // Lazy image fade — IntersectionObserver nativo (design-spells)
  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.style.opacity = '1'
            observer.unobserve(img)
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    img.style.opacity = '0'
    img.style.transition = 'opacity 0.35s ease'
    observer.observe(img)

    return () => observer.disconnect()
  }, [])

  return (
    /* Outer shell — Double Bezel (high-end-visual-design) */
    <a
      href={offer.offer_url}
      target="_blank"
      rel="noopener noreferrer"
      className="offer-card-shell card-reveal"
      aria-label={`Ver oferta: ${offer.product_name} en ${offer.store_name}`}
      title={offer.product_name}
    >
      {/* Inner core */}
      <div className="offer-card">

        {/* Imagen */}
        <div className="offer-card__image-wrap">
          {/* Store color accent — borde izquierdo por tienda */}
          <div
            className="offer-card__store-accent"
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          />

          {offer.product_image_url ? (
            <img
              ref={imgRef}
              src={offer.product_image_url}
              alt={offer.product_name}
              className="offer-card__image"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className="offer-card__image flex items-center justify-center"
              aria-hidden="true"
            >
              <IconProduct />
            </div>
          )}

          {/* Badge descuento — price-flash al montar (design-spells) */}
          {discount !== null && discount > 0 && (
            <span
              className="discount-badge"
              aria-label={`${discount}% de descuento`}
            >
              -{discount}%
            </span>
          )}
        </div>

        {/* Body */}
        <div className="offer-card__body">

          {/* Tienda — Josefin Sans small caps */}
          <span
            className="offer-card__store"
            style={{ color: accentColor }}
          >
            {offer.store_name}
          </span>

          {/* Marca — si existe */}
          {offer.product_brand && (
            <span className="offer-card__brand">
              {offer.product_brand}
            </span>
          )}

          {/* Nombre producto — Raleway */}
          <p className="offer-card__name" title={offer.product_name}>
            {offer.product_name}
          </p>

          {/* Precios — Geist Mono tabular (4E) */}
          <div className="offer-card__prices">
            <span className="offer-card__price">
              {formatCLP(offer.offer_price)}
            </span>
            {offer.original_price != null && offer.original_price > offer.offer_price && (
              <span className="offer-card__price-original">
                {formatCLP(offer.original_price)}
              </span>
            )}
          </div>

        </div>
      </div>
    </a>
  )
}
