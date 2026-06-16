import { useRef, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  /** If true, navigates to /buscar?q= on submit (used in Hero) */
  navigateOnSubmit?: boolean
  autoFocus?: boolean
  placeholder?: string
  /** Show a visible search button inside the bar (hero variant) */
  showButton?: boolean
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function SearchBar({
  value = '',
  onChange,
  navigateOnSubmit = false,
  autoFocus = false,
  placeholder = 'Buscar ofertas... ej: leche, pan, coca-cola',
  showButton = false,
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
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.focus()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="relative w-full"
    >
      {/* Search icon */}
      <span
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--color-text-muted)' }}
        aria-hidden="true"
      >
        <IconSearch />
      </span>

      <input
        ref={inputRef}
        id="search-input"
        type="search"
        role="searchbox"
        aria-label="Buscar ofertas de supermercados"
        className="search-input"
        style={showButton ? { paddingRight: '7.5rem' } : undefined}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
      />

      {/* Clear button — only when there's text and no showButton */}
      {value && !showButton && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Limpiar búsqueda"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Visible Search button — hero variant */}
      {showButton && (
        <button
          type="submit"
          className="btn-primary absolute right-2 top-1/2 -translate-y-1/2"
          style={{
            paddingLeft: '1rem',
            paddingRight: '1rem',
            fontSize: '0.75rem',
            minHeight: '40px',
          }}
          aria-label="Buscar"
        >
          Buscar
        </button>
      )}
    </form>
  )
}
