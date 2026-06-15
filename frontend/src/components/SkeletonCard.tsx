/**
 * SkeletonCard — imita el layout del double-bezel OfferCard
 * Mantiene la misma estructura outer-shell + inner para evitar CLS
 */
export function SkeletonCard() {
  return (
    <div
      className="offer-card-shell"
      role="status"
      aria-label="Cargando oferta..."
      style={{ cursor: 'default', pointerEvents: 'none' }}
    >
      <div className="offer-card">
        {/* Imagen placeholder — aspect-ratio 1:1 */}
        <div className="skeleton" style={{ aspectRatio: '1', width: '100%' }} />

        <div className="offer-card__body" style={{ gap: '0.625rem' }}>
          {/* Store badge */}
          <div className="skeleton" style={{ height: '0.625rem', width: '4rem', borderRadius: '999px' }} />

          {/* Nombre — 2 líneas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <div className="skeleton" style={{ height: '0.75rem', width: '100%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '0.75rem', width: '80%', borderRadius: '4px' }} />
          </div>

          {/* Precio — Geist Mono width simulado */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: 'auto' }}>
            <div className="skeleton" style={{ height: '1.5rem', width: '5rem', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '1rem', width: '3.5rem', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

interface SkeletonGridProps {
  count?: number
}

export function SkeletonGrid({ count = 12 }: SkeletonGridProps) {
  return (
    <div className="grid-offers" aria-busy="true" aria-label="Cargando ofertas">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
