import { useRef, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  /** Si true, navega a /buscar?q= al submit (usado en Hero) */
  navigateOnSubmit?: boolean
  autoFocus?: boolean
  placeholder?: string
}

export function SearchBar({
  value = '',
  onChange,
  navigateOnSubmit = false,
  autoFocus = false,
  placeholder = 'Buscar ofertas... ej: leche, pan, coca-cola',
}: SearchBarProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange?.(e.target.value)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (navigateOnSubmit && value.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(value.trim())}`)
    }
  }

  function handleClear() {
    onChange?.('')
    inputRef.current?.focus()
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="relative w-full"
    >
      {/* Icono lupa */}
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[--color-text-muted] pointer-events-none" aria-hidden="true">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>

      <input
        ref={inputRef}
        id="search-input"
        type="search"
        role="searchbox"
        aria-label="Buscar ofertas de supermercados"
        className="search-input"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
      />

      {/* Botón limpiar */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors"
          aria-label="Limpiar búsqueda"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  )
}
