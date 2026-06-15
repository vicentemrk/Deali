import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { OfferCard } from '../components/OfferCard'
import { SkeletonGrid } from '../components/SkeletonCard'
import { useOffers } from '../hooks/useOffers'

const PAGE_SIZE = 40

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [page, setPage] = useState(1)

  // Sincronizar URL con el estado de búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (page > 1) params.set('page', String(page))
      setSearchParams(params, { replace: true })
    }, 300) // debounce 300ms

    return () => clearTimeout(timeout)
  }, [query, page, setSearchParams])

  // Reset página al cambiar búsqueda
  function handleQueryChange(value: string) {
    setQuery(value)
    setPage(1)
  }

  const { data, isLoading, isError, isFetching } = useOffers({
    search: query.trim() || undefined,
    page,
    page_size: PAGE_SIZE,
  })

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Buscar ofertas
      </h1>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          autoFocus
          placeholder="Buscar por nombre de producto..."
        />
      </div>

      {/* Estado: resultados */}
      {data && (
        <p
          className="text-sm text-[--color-text-muted] mb-4"
          aria-live="polite"
          aria-atomic="true"
        >
          {data.count === 0
            ? 'Sin resultados'
            : `${data.count.toLocaleString('es-CL')} oferta${data.count !== 1 ? 's' : ''} encontrada${data.count !== 1 ? 's' : ''}`
          }
          {query && ` para "${query}"`}
          {isFetching && ' · Actualizando...'}
        </p>
      )}

      {/* Grid */}
      {isLoading && <SkeletonGrid count={PAGE_SIZE} />}

      {isError && (
        <div className="text-center py-20 text-[--color-text-muted]" role="alert">
          <p className="text-lg font-medium mb-2">Error al buscar</p>
          <p className="text-sm">Intenta nuevamente en unos momentos</p>
        </div>
      )}

      {data && data.data.length === 0 && !isLoading && (
        <div className="text-center py-20 text-[--color-text-muted]">
          <p className="text-lg font-medium">Sin resultados</p>
          {query && (
            <p className="text-sm mt-1">
              No encontramos ofertas para <strong className="text-[--color-text-secondary]">"{query}"</strong>
            </p>
          )}
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="grid-offers">
            {data.data.map((offer) => (
              <OfferCard key={offer.offer_id} offer={offer} />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <nav
              className="flex justify-center items-center gap-3 mt-10"
              aria-label="Paginación"
            >
              <button
                className="btn-ghost"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Página anterior"
              >
                ← Anterior
              </button>

              <span className="text-sm text-[--color-text-secondary]" aria-current="page">
                Página {page} de {totalPages}
              </span>

              <button
                className="btn-ghost"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Página siguiente"
              >
                Siguiente →
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  )
}
