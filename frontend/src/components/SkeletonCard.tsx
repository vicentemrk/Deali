/** Skeleton loader que imita exactamente el layout de OfferCard */
export function SkeletonCard() {
  return (
    <div
      className="offer-card"
      role="status"
      aria-label="Cargando oferta..."
    >
      {/* Imagen placeholder */}
      <div className="skeleton aspect-square w-full" />

      <div className="offer-card__body gap-3">
        {/* Store badge */}
        <div className="skeleton h-4 w-16 rounded-full" />

        {/* Nombre — 2 líneas */}
        <div className="flex flex-col gap-1.5">
          <div className="skeleton h-3.5 w-full rounded" />
          <div className="skeleton h-3.5 w-4/5 rounded" />
        </div>

        {/* Precios */}
        <div className="flex items-baseline gap-2 mt-auto">
          <div className="skeleton h-6 w-20 rounded" />
          <div className="skeleton h-4 w-14 rounded" />
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
    <div className="grid-offers" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
