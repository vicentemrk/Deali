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
    // When used as hero (navigateOnSubmit), use the ref value directly
    const query = value.trim() || (inputRef.current?.value ?? '').trim()
    if (navigateOnSubmit && query) {
      navigate(`/buscar?q=${encodeURIComponent(query)}`)
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
      {/* Icono lupa — Iconsax Bulk */}
      <span
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--color-text-muted)' }}
        aria-hidden="true"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            opacity="0.4"
            d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
            fill="currentColor"
          />
          <path
            d="M21.3 22C21.12 22 20.94 21.93 20.81 21.8L18.95 19.94C18.68 19.67 18.68 19.23 18.95 18.95C19.22 18.68 19.66 18.68 19.94 18.95L21.8 20.81C22.07 21.08 22.07 21.52 21.8 21.8C21.66 21.93 21.48 22 21.3 22Z"
            fill="currentColor"
          />
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
