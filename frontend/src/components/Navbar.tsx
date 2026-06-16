import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'

/** Clean search icon — stroke-based, no visual artifacts */
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

/** Sun icon for light mode */
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

/** Moon icon for dark mode */
function IconMoon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function Navbar() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const { isDark, toggle } = useDarkMode()

  // Scroll-aware: add class after 60px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={['navbar', scrolled ? 'navbar--scrolled' : ''].join(' ')}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0"
          aria-label="Deali — Inicio"
        >
          <span
            className="font-display font-bold text-lg tracking-widest uppercase text-gradient"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Deali
          </span>
        </Link>

        {/* Nav links */}
        <nav role="navigation" aria-label="Navegación principal" className="flex-1 flex justify-center">
          <ul className="flex items-center gap-1 list-none" role="list">
            <li>
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-display tracking-widest uppercase transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.1em',
                  backgroundColor: pathname === '/' ? 'var(--color-accent-glow)' : 'transparent',
                  color: pathname === '/' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  minHeight: '44px',
                }}
                aria-current={pathname === '/' ? 'page' : undefined}
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link
                to="/buscar"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-display tracking-widest uppercase transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.1em',
                  backgroundColor: pathname.startsWith('/buscar') ? 'var(--color-accent-glow)' : 'transparent',
                  color: pathname.startsWith('/buscar') ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  minHeight: '44px',
                }}
                aria-current={pathname.startsWith('/buscar') ? 'page' : undefined}
              >
                <IconSearch />
                Buscar
              </Link>
            </li>
          </ul>
        </nav>

        {/* Dark mode toggle — functional button */}
        <button
          type="button"
          onClick={toggle}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-300"
          style={{
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            minHeight: '36px',
          }}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-pressed={isDark}
        >
          {/* Track */}
          <span
            style={{
              position: 'relative',
              display: 'inline-flex',
              width: 32,
              height: 18,
              background: isDark ? 'var(--color-accent-glow)' : 'var(--color-surface-3)',
              borderRadius: 999,
              border: '1.5px solid var(--color-border)',
              transition: 'background 0.3s ease',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {/* Thumb */}
            <span
              style={{
                position: 'absolute',
                left: isDark ? 14 : 2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: isDark ? 'var(--color-accent)' : 'var(--color-text-muted)',
                transition: 'left 0.25s cubic-bezier(0.32, 0.72, 0, 1), background 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </span>
          {isDark ? <IconMoon /> : <IconSun />}
        </button>

      </div>
    </header>
  )
}
