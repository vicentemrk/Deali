import { SearchBar } from '../components/SearchBar'
import { OfferCard } from '../components/OfferCard'
import { SkeletonGrid } from '../components/SkeletonCard'
import { useOffers, useStores } from '../hooks/useOffers'
import { useState } from 'react'
import type { OffersSortBy } from '../types'

const STORE_FILTERS = [
  { slug: '', label: 'Todas' },
  { slug: 'jumbo',        label: 'Jumbo',        color: 'var(--color-jumbo)' },
  { slug: 'lider',        label: 'Líder',         color: 'var(--color-lider)' },
  { slug: 'tottus',       label: 'Tottus',        color: 'var(--color-tottus)' },
  { slug: 'unimarc',      label: 'Unimarc',       color: 'var(--color-unimarc)' },
  { slug: 'acuenta',      label: 'aCuenta',       color: 'var(--color-acuenta)' },
  { slug: 'santa-isabel', label: 'Santa Isabel',  color: 'var(--color-santa-isabel)' },
]

const DISCOUNT_FILTERS = [
  { value: 0,  label: 'Cualquier' },
  { value: 20, label: '+20%' },
  { value: 30, label: '+30%' },
  { value: 40, label: '+40%' },
  { value: 50, label: '+50%' },
]

const CATEGORY_FILTERS = [
  { slug: '',                label: 'Todas' },
  { slug: 'frutas-verduras', label: 'Frutas y Verduras' },
  { slug: 'carnes-pescados', label: 'Carnes y Pescados' },
  { slug: 'lacteos-huevos',  label: 'Lácteos y Huevos' },
  { slug: 'panaderia',       label: 'Panadería' },
  { slug: 'bebidas',         label: 'Bebidas' },
  { slug: 'snacks-dulces',   label: 'Snacks y Dulces' },
  { slug: 'limpieza',        label: 'Limpieza' },
  { slug: 'cuidado-personal',label: 'Cuidado Personal' },
  { slug: 'congelados',      label: 'Congelados' },
]

const SORT_OPTIONS: { value: OffersSortBy; label: string }[] = [
  { value: 'discount_desc', label: '↓ Mayor descuento' },
  { value: 'price_asc',     label: '↑ Menor precio' },
  { value: 'price_desc',    label: '↓ Mayor precio' },
]

/** Icono empty state */
function IconEmpty() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-surface-3)' }} aria-hidden="true">
      <path opacity="0.4" d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2Z" fill="currentColor"/>
      <path d="M15.5 8.5H8.5C8.09 8.5 7.75 8.16 7.75 7.75C7.75 7.34 8.09 7 8.5 7H15.5C15.91 7 16.25 7.34 16.25 7.75C16.25 8.16 15.91 8.5 15.5 8.5Z" fill="currentColor"/>
      <path d="M12 17H8.5C8.09 17 7.75 16.66 7.75 16.25C7.75 15.84 8.09 15.5 8.5 15.5H12C12.41 15.5 12.75 15.84 12.75 16.25C12.75 16.66 12.41 17 12 17Z" fill="currentColor"/>
      <path d="M15.5 12.75H8.5C8.09 12.75 7.75 12.41 7.75 12C7.75 11.59 8.09 11.25 8.5 11.25H15.5C15.91 11.25 16.25 11.59 16.25 12C16.25 12.41 15.91 12.75 15.5 12.75Z" fill="currentColor"/>
    </svg>
  )
}

/** Icono error */
function IconError() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--color-discount)' }} aria-hidden="true">
      <path opacity="0.4" d="M21.76 15.92L15.36 4.4C14.5 2.85 13.31 2 12 2C10.69 2 9.49999 2.85 8.63999 4.4L2.23999 15.92C1.42999 17.39 1.33999 18.8 1.99999 19.91C2.65999 21.02 3.91999 21.63 5.59999 21.63H18.4C20.08 21.63 21.34 21.02 22 19.91C22.66 18.8 22.57 17.38 21.76 15.92Z" fill="currentColor"/>
      <path d="M12 14.75C11.59 14.75 11.25 14.41 11.25 14V9C11.25 8.59 11.59 8.25 12 8.25C12.41 8.25 12.75 8.59 12.75 9V14C12.75 14.41 12.41 14.75 12 14.75Z" fill="currentColor"/>
      <path d="M12 18.0001C11.94 18.0001 11.87 17.9901 11.8 17.9801C11.74 17.9701 11.68 17.9501 11.62 17.9201C11.56 17.9001 11.5 17.8701 11.44 17.8301C11.39 17.7901 11.34 17.7501 11.29 17.7101C11.11 17.5201 11 17.2601 11 17.0001C11 16.7401 11.11 16.4801 11.29 16.2901C11.34 16.2501 11.39 16.2101 11.44 16.1701C11.5 16.1301 11.56 16.1001 11.62 16.0801C11.68 16.0501 11.74 16.0301 11.8 16.0201C11.93 15.9901 12.07 15.9901 12.19 16.0201C12.26 16.0301 12.32 16.0501 12.38 16.0801C12.44 16.1001 12.5 16.1301 12.56 16.1701C12.61 16.2101 12.66 16.2501 12.71 16.2901C12.89 16.4801 13 16.7401 13 17.0001C13 17.2601 12.89 17.5201 12.71 17.7101C12.66 17.7501 12.61 17.7901 12.56 17.8301C12.5 17.8701 12.44 17.9001 12.38 17.9201C12.32 17.9501 12.26 17.9701 12.19 17.9801C12.13 17.9901 12.06 18.0001 12 18.0001Z" fill="currentColor"/>
    </svg>
  )
}

export function HomePage() {
  const [storeSlug, setStoreSlug] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [minDiscount, setMinDiscount] = useState(0)
  const [sortBy, setSortBy] = useState<OffersSortBy>('discount_desc')

  const { data, isLoading, isError } = useOffers({
    store_slug: storeSlug || undefined,
    category_slug: categorySlug || undefined,
    min_discount: minDiscount || undefined,
    sort_by: sortBy,
    page_size: 80,
  })

  useStores() // prefetch

  return (
    <main id="main-content" className="navbar-offset">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        className="hero-gradient py-20 sm:py-28 px-5 text-center"
        aria-labelledby="hero-heading"
      >
        <div className="max-w-2xl mx-auto">

          {/* H1 — Josefin Sans UPPERCASE */}
          <h1
            id="hero-heading"
            className="animate-fade-up"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              color: 'var(--color-text)',
              marginBottom: '1rem',
            }}
          >
            Las mejores{' '}
            <span className="text-gradient">ofertas</span>
            <br />
            de supermercados
          </h1>

          {/* Subtítulo — Raleway */}
          <p
            className="animate-fade-up stagger"
            style={{
              '--delay': '80ms',
              fontFamily: 'var(--font-sans)',
              fontSize: '1.0625rem',
              color: 'var(--color-text-muted)',
              marginBottom: '2rem',
              lineHeight: 1.6,
            } as React.CSSProperties}
          >
            Jumbo, Líder, Tottus, Unimarc y más — compará en un solo lugar
          </p>

          {/* Contador de ofertas */}
          {data && (
            <div
              className="animate-fade-up stagger mb-8"
              style={{ '--delay': '120ms' } as React.CSSProperties}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2rem',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--color-accent)',
                  letterSpacing: '-0.02em',
                }}
              >
                {data.count.toLocaleString('es-CL')}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  marginLeft: '0.5rem',
                }}
              >
                Ofertas activas
              </span>
            </div>
          )}

          {/* Search bar */}
          <div
            className="animate-fade-up stagger"
            style={{ '--delay': '160ms' } as React.CSSProperties}
          >
            <SearchBar
              navigateOnSubmit
              placeholder="¿Qué buscás? ej: leche, pan, aceite..."
              showButton
            />
          </div>
        </div>
      </section>

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 pt-6 pb-4" aria-label="Filtros de búsqueda">

        {/* Chips de tienda — scroll horizontal en mobile */}
        <p className="section-label">Tiendas</p>
        <div
          className="scroll-x-hidden snap-chips flex gap-2 pb-2 mb-4"
          role="group"
          aria-label="Filtrar por tienda"
        >
          {STORE_FILTERS.map((f) => {
            const isActive = storeSlug === f.slug
            const chipColor = f.color ?? 'var(--color-accent)'
            return (
              <button
                key={f.slug}
                className="filter-chip flex-shrink-0"
                data-active={isActive ? 'true' : 'false'}
                onClick={() => setStoreSlug(f.slug)}
                aria-pressed={isActive}
                style={isActive && f.color ? {
                  borderColor: chipColor,
                  color: chipColor,
                  backgroundColor: `color-mix(in oklch, ${chipColor} 12%, transparent)`,
                } : undefined}
              >
                {isActive && f.color && (
                  <span
                    style={{
                      width: 6, height: 6, borderRadius: '50%',
                      backgroundColor: chipColor, display: 'inline-block',
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                )}
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Chips de categoría */}
        <p className="section-label">Categorías</p>
        <div
          className="scroll-x-hidden snap-chips flex gap-2 pb-2 mb-4"
          role="group"
          aria-label="Filtrar por categoría"
        >
          {CATEGORY_FILTERS.map((f) => {
            const isActive = categorySlug === f.slug
            return (
              <button
                key={f.slug}
                className="filter-chip flex-shrink-0"
                data-active={isActive ? 'true' : 'false'}
                onClick={() => setCategorySlug(f.slug)}
                aria-pressed={isActive}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Fila: chips de descuento + selector de orden */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="section-label">Descuento mínimo</p>
            <div
              className="scroll-x-hidden snap-chips flex gap-2 pb-1"
              role="group"
              aria-label="Filtrar por descuento mínimo"
            >
              {DISCOUNT_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className="filter-chip flex-shrink-0"
                  data-active={minDiscount === f.value ? 'true' : 'false'}
                  onClick={() => setMinDiscount(f.value)}
                  aria-pressed={minDiscount === f.value}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort selector */}
          <div style={{ flexShrink: 0 }}>
            <p className="section-label" id="sort-label">Ordenar por</p>
            <select
              id="sort-select"
              className="sort-select"
              aria-labelledby="sort-label"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as OffersSortBy)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Contador resultados ──────────────────────────────────────────── */}
      {data && (
        <p
          className="max-w-7xl mx-auto px-5 mb-3"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.6875rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
          aria-live="polite"
        >
          {data.count.toLocaleString('es-CL')} ofertas encontradas
        </p>
      )}

      {/* ── Grid de ofertas ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 pb-16" aria-label="Listado de ofertas">

        {isLoading && <SkeletonGrid count={12} />}

        {/* Estado de error */}
        {isError && (
          <div
            className="text-center py-24 animate-fade-in"
            role="alert"
            aria-live="assertive"
          >
            <IconError />
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-discount)',
                marginTop: '1rem',
                marginBottom: '0.5rem',
              }}
            >
              Error al cargar ofertas
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Verificá tu conexión e intentá nuevamente
            </p>
          </div>
        )}

        {/* Estado vacío */}
        {data && data.data.length === 0 && !isLoading && (
          <div className="text-center py-24 animate-fade-in">
            <IconEmpty />
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginTop: '1rem',
                marginBottom: '0.5rem',
              }}
            >
              Sin ofertas con estos filtros
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Probá cambiando la tienda, categoría o el descuento mínimo
            </p>
          </div>
        )}

        {/* Cards */}
        {data && data.data.length > 0 && (
          <div className="grid-offers">
            {data.data.map((offer, i) => (
              <div
                key={offer.offer_id}
                className="stagger"
                style={{ '--delay': `${Math.min(i * 30, 400)}ms` } as React.CSSProperties}
              >
                <OfferCard offer={offer} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
