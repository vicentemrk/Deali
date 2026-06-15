import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

/** Icono búsqueda — Iconsax Bulk style 24×24 */
function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  )
}

/** Icono sol — light mode indicator */
function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path opacity="0.4" d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z" fill="currentColor"/>
      <path d="M12 22.96C11.45 22.96 11 22.55 11 22V21.92C11 21.37 11.45 20.96 12 20.96C12.55 20.96 13 21.41 13 21.96C13 22.51 12.55 22.96 12 22.96ZM19.14 20.14C18.88 20.14 18.63 20.04 18.43 19.85L18.3 19.72C17.91 19.33 17.91 18.7 18.3 18.31C18.69 17.92 19.32 17.92 19.71 18.31L19.84 18.44C20.23 18.83 20.23 19.46 19.84 19.85C19.65 20.04 19.4 20.14 19.14 20.14ZM4.86 20.14C4.6 20.14 4.35 20.04 4.15 19.85C3.76 19.46 3.76 18.83 4.15 18.44L4.28 18.31C4.67 17.92 5.3 17.92 5.69 18.31C6.08 18.7 6.08 19.33 5.69 19.72L5.56 19.85C5.37 20.04 5.11 20.14 4.86 20.14ZM22 13H21.92C21.37 13 20.96 12.55 20.96 12C20.96 11.45 21.41 11 21.96 11C22.51 11 22.96 11.45 22.96 12C22.96 12.55 22.51 13 22 13ZM2.08 13H2C1.45 13 1 12.55 1 12C1 11.45 1.45 11 2 11H2.08C2.63 11 3.04 11.45 3.04 12C3.04 12.55 2.59 13 2.08 13ZM19.01 5.99C18.75 5.99 18.5 5.89 18.3 5.7C17.91 5.31 17.91 4.68 18.3 4.29L18.43 4.16C18.82 3.77 19.45 3.77 19.84 4.16C20.23 4.55 20.23 5.18 19.84 5.57L19.71 5.7C19.52 5.89 19.27 5.99 19.01 5.99ZM4.99 5.99C4.73 5.99 4.48 5.89 4.28 5.7L4.15 5.56C3.76 5.17 3.76 4.54 4.15 4.15C4.54 3.76 5.17 3.76 5.56 4.15L5.69 4.28C6.08 4.67 6.08 5.3 5.69 5.69C5.5 5.89 5.24 5.99 4.99 5.99ZM12 3.04C11.45 3.04 11 2.59 11 2.08V2C11 1.45 11.45 1 12 1C12.55 1 13 1.45 13 2V2.08C13 2.63 12.55 3.04 12 3.04Z" fill="currentColor"/>
    </svg>
  )
}

/** Icono luna — dark mode indicator */
function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path opacity="0.4" d="M2 12.05C2.04 17.55 6.53 22.0 12.03 22C15.93 22 19.3 19.81 21.1 16.57C21.36 16.1 21.13 15.54 20.61 15.37C20.1 15.2 19.56 15.43 19.3 15.9C18.0 18.34 15.44 20.0 12.47 20.0C7.73 20.0 3.96 16.2 3.96 11.47C3.96 8.5 5.62 5.94 8.06 4.64C8.52 4.38 8.75 3.84 8.58 3.34C8.41 2.83 7.86 2.6 7.39 2.86C4.14 4.65 2 8.12 2 12.05Z" fill="currentColor"/>
      <path d="M2 12.05C2.04 17.55 6.53 22 12.03 22C15.93 22 19.3 19.81 21.1 16.57C21.36 16.1 21.13 15.54 20.61 15.37C20.1 15.2 19.56 15.43 19.3 15.9C18 18.34 15.44 20 12.47 20C7.73 20 3.96 16.2 3.96 11.47C3.96 8.5 5.62 5.94 8.06 4.64C8.52 4.38 8.75 3.84 8.58 3.34C8.41 2.83 7.86 2.6 7.39 2.86C4.14 4.65 2 8.12 2 12.05Z" fill="currentColor"/>
    </svg>
  )
}

/** Icono hamburger / X */
function IconLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path opacity="0.4" d="M17 7.82L18.56 10C19.43 11.26 19.43 12.74 18.56 14L17 16.18C16.2 17.35 14.87 18 13.45 18H10.55C9.13 18 7.8 17.35 7 16.18L5.44 14C4.57 12.74 4.57 11.26 5.44 10L7 7.82C7.8 6.65 9.13 6 10.55 6H13.45C14.87 6 16.2 6.65 17 7.82Z" fill="currentColor"/>
      <path d="M10.75 14.52V13.54C10.21 13.38 9.48 13.06 9.48 11.96C9.48 11.02 10.2 10.24 11.37 10.24C11.84 10.24 12.24 10.37 12.52 10.54L12.26 11.31C12.04 11.17 11.77 11.08 11.47 11.08C11.02 11.08 10.76 11.33 10.76 11.64C10.76 12.03 11.12 12.18 11.61 12.35C12.31 12.59 12.74 12.95 12.74 13.76C12.74 14.46 12.28 15.12 11.3 15.28V16.26H10.55V15.26C10.03 15.2 9.56 14.99 9.24 14.73L9.53 13.94C9.82 14.16 10.22 14.37 10.75 14.37V14.52Z" fill="currentColor"/>
    </svg>
  )
}

export function Navbar() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)

  // Scroll-aware: añadir clase al pasar 60px
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
          {/* Live badge */}
          <span
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-display tracking-wider uppercase"
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.1em',
            }}
          >
            <span className="live-dot" aria-hidden="true" />
            Chile
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

        {/* Dark mode toggle (sistema) */}
        <div
          className="hidden sm:flex items-center gap-1 text-xs"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
          aria-hidden="true"
        >
          <IconSun />
          <span className="text-[10px] uppercase tracking-widest">·</span>
          <IconMoon />
        </div>

      </div>
    </header>
  )
}
