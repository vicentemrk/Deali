import { SearchBar } from '../components/SearchBar'
import { OfferCard } from '../components/OfferCard'
import { SkeletonGrid } from '../components/SkeletonCard'
import { useOffers, useStores } from '../hooks/useOffers'
import { useState } from 'react'

const STORE_FILTERS = [
  { slug: '', label: 'Todas' },
  { slug: 'jumbo', label: 'Jumbo' },
  { slug: 'lider', label: 'Líder' },
  { slug: 'tottus', label: 'Tottus' },
  { slug: 'unimarc', label: 'Unimarc' },
  { slug: 'acuenta', label: 'aCuenta' },
  { slug: 'santa-isabel', label: 'Santa Isabel' },
]

const DISCOUNT_FILTERS = [
  { value: 0, label: 'Cualquier' },
  { value: 20, label: '+20%' },
  { value: 30, label: '+30%' },
  { value: 40, label: '+40%' },
  { value: 50, label: '+50%' },
]

export function HomePage() {
  const [storeSlug, setStoreSlug] = useState('')
  const [minDiscount, setMinDiscount] = useState(0)

  const { data, isLoading, isError } = useOffers({
    store_slug: storeSlug || undefined,
    min_discount: minDiscount || undefined,
    page_size: 80,
  })

  useStores() // prefetch para otras páginas

  return (
    <main id="main-content">
      {/* Hero */}
      <section className="hero-gradient py-12 px-4 text-center" aria-labelledby="hero-heading">
        <div className="max-w-2xl mx-auto animate-fade-up">
          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-3"
          >
            Las mejores{' '}
            <span className="text-gradient">ofertas</span>
            <br />
            de supermercados
          </h1>
          <p className="text-[--color-text-secondary] text-lg mb-8">
            Jumbo, Líder, Tottus, Unimarc y más — actualizadas cada 30 minutos
          </p>
          <SearchBar navigateOnSubmit placeholder="¿Qué estás buscando? ej: leche, pan, coca-cola" />
        </div>
      </section>

      {/* Filtros */}
      <section className="max-w-7xl mx-auto px-4 py-4" aria-label="Filtros">
        {/* Tiendas */}
        <div className="flex gap-2 flex-wrap mb-3" role="group" aria-label="Filtrar por tienda">
          {STORE_FILTERS.map((f) => (
            <button
              key={f.slug}
              className="filter-chip"
              data-active={storeSlug === f.slug ? 'true' : 'false'}
              onClick={() => setStoreSlug(f.slug)}
              aria-pressed={storeSlug === f.slug}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Descuento mínimo */}
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrar por descuento mínimo">
          {DISCOUNT_FILTERS.map((f) => (
            <button
              key={f.value}
              className="filter-chip"
              data-active={minDiscount === f.value ? 'true' : 'false'}
              onClick={() => setMinDiscount(f.value)}
              aria-pressed={minDiscount === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Contador de resultados */}
      {data && (
        <p className="max-w-7xl mx-auto px-4 text-sm text-[--color-text-muted] mb-2" aria-live="polite">
          {data.count.toLocaleString('es-CL')} ofertas encontradas
        </p>
      )}

      {/* Grid de ofertas */}
      <section className="max-w-7xl mx-auto px-4 pb-12" aria-label="Listado de ofertas">
        {isLoading && <SkeletonGrid count={12} />}

        {isError && (
          <div className="text-center py-20 text-[--color-text-muted]" role="alert">
            <p className="text-lg font-medium mb-2">Error al cargar ofertas</p>
            <p className="text-sm">Verifica tu conexión e intenta nuevamente</p>
          </div>
        )}

        {data && data.data.length === 0 && !isLoading && (
          <div className="text-center py-20 text-[--color-text-muted]">
            <p className="text-lg font-medium">Sin ofertas con estos filtros</p>
            <p className="text-sm mt-1">Prueba cambiando la tienda o el descuento mínimo</p>
          </div>
        )}

        {data && data.data.length > 0 && (
          <div className="grid-offers">
            {data.data.map((offer) => (
              <OfferCard key={offer.offer_id} offer={offer} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
