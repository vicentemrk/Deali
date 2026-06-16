import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'

// ─── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: '',                 label: 'Todas las categorías' },
  { slug: 'frutas-verduras',  label: 'Frutas y Verduras' },
  { slug: 'carnes-pescados',  label: 'Carnes y Pescados' },
  { slug: 'lacteos-huevos',   label: 'Lácteos y Huevos' },
  { slug: 'panaderia',        label: 'Panadería' },
  { slug: 'bebidas',          label: 'Bebidas' },
  { slug: 'snacks-dulces',    label: 'Snacks y Dulces' },
  { slug: 'limpieza',         label: 'Limpieza' },
  { slug: 'cuidado-personal', label: 'Cuidado Personal' },
  { slug: 'congelados',       label: 'Congelados' },
]

// ─── Íconos SVG ────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconSun() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

// ─── Logo SVG (Tijera) ─────────────────────────────────────────────────────────

function DealiBrand() {
  return (
    <span
      className="flex items-center gap-2 select-none"
      aria-label="Deali"
    >
      {/* Isotipo SVG tijera */}
      <svg
        width="26"
        height="26"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Cuerpo de las tijeras — dos mitades que forman una X */}
        {/* Hoja superior-izquierda → inferior-derecha */}
        <line x1="10" y1="10" x2="26" y2="26" stroke="var(--color-accent)" strokeWidth="3.5" strokeLinecap="round" />
        {/* Hoja superior-derecha → inferior-izquierda */}
        <line x1="22" y1="10" x2="6" y2="26" stroke="var(--color-accent)" strokeWidth="3.5" strokeLinecap="round" />
        {/* Pivote central */}
        <circle cx="16" cy="16" r="2.5" fill="var(--color-accent)" />
        {/* Aros de la tijera — izquierda */}
        <circle cx="6" cy="6" r="4" stroke="var(--color-accent)" strokeWidth="2.5" fill="none" />
        {/* Aros de la tijera — derecha */}
        <circle cx="26" cy="6" r="4" stroke="var(--color-accent)" strokeWidth="2.5" fill="none" />
      </svg>

      {/* Wordmark */}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '1.125rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
          lineHeight: 1,
        }}
      >
        Deali
        <span style={{ color: 'var(--color-accent)' }}>.</span>
      </span>
    </span>
  )
}

// ─── Dropdown de Categorías ────────────────────────────────────────────────────

interface CategoryDropdownProps {
  value: string
  onChange: (slug: string) => void
}

function CategoryDropdown({ value, onChange }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cierre al click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = CATEGORIES.find(c => c.slug === value) ?? CATEGORIES[0]

  return (
    <div ref={ref} className="navbar-dropdown" aria-haspopup="listbox">
      <button
        type="button"
        className="navbar-dropdown__trigger"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Seleccionar categoría"
      >
        <span className="navbar-dropdown__label">{selected.label}</span>
        <span
          className="navbar-dropdown__chevron"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <IconChevron />
        </span>
      </button>

      {open && (
        <ul
          className="navbar-dropdown__menu"
          role="listbox"
          aria-label="Categorías"
        >
          {CATEGORIES.map(cat => (
            <li key={cat.slug} role="option" aria-selected={value === cat.slug}>
              <button
                type="button"
                className="navbar-dropdown__item"
                data-active={value === cat.slug ? 'true' : 'false'}
                onClick={() => {
                  onChange(cat.slug)
                  setOpen(false)
                }}
              >
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')
  const { isDark, toggle } = useDarkMode()

  // Scroll-aware blur
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    const params = new URLSearchParams({ q: query.trim() })
    if (category) params.set('category', category)
    navigate(`/buscar?${params.toString()}`)
  }

  const isSearchPage = pathname.startsWith('/buscar')

  return (
    <header
      className={['navbar', scrolled ? 'navbar--scrolled' : ''].join(' ')}
      role="banner"
    >
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0 1.25rem',
          height: '3.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <Link
          to="/"
          aria-label="Deali — Inicio"
          style={{ textDecoration: 'none', flexShrink: 0 }}
        >
          <DealiBrand />
        </Link>

        {/* ── Centro: Dropdown de categoría ─────────────────────────────────── */}
        <div
          className="hidden sm:block"
          style={{ flexShrink: 0 }}
        >
          <CategoryDropdown value={category} onChange={setCategory} />
        </div>

        {/* ── Spacer ────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1 }} />

        {/* ── Searchbar + botón ─────────────────────────────────────────────── */}
        {!isSearchPage && (
          <form
            onSubmit={handleSearch}
            role="search"
            className="hidden md:flex items-center gap-2"
            style={{
              width: '320px',
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              {/* Ícono lupa */}
              <span
                style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                  pointerEvents: 'none',
                  display: 'flex',
                }}
                aria-hidden="true"
              >
                <IconSearch />
              </span>

              <input
                id="navbar-search"
                type="search"
                aria-label="Buscar ofertas"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar ofertas..."
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%',
                  paddingLeft: '2.25rem',
                  paddingRight: '1rem',
                  height: '34px',
                  minHeight: '34px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'var(--color-accent)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-glow)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Botón Buscar */}
            <button
              type="submit"
              className="btn-primary"
              style={{
                fontSize: '0.75rem',
                paddingLeft: '1rem',
                paddingRight: '1rem',
                height: '34px',
                minHeight: '34px',
                paddingTop: 0,
                paddingBottom: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.04em',
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
              aria-label="Buscar"
            >
              Buscar
            </button>
          </form>
        )}

        {/* ── Dark mode toggle ──────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={toggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '0.5rem',
            border: '1.5px solid var(--color-border)',
            background: isDark ? 'var(--color-accent-glow)' : 'var(--color-surface-2)',
            color: isDark ? 'var(--color-accent)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'background 0.25s, color 0.25s, border-color 0.25s',
            flexShrink: 0,
          }}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-pressed={isDark}
        >
          {isDark ? <IconSun /> : <IconMoon />}
        </button>

      </div>
    </header>
  )
}
