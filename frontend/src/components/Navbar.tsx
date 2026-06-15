import { Link, useLocation } from 'react-router-dom'

export function Navbar() {
  const { pathname } = useLocation()

  return (
    <header className="navbar" role="banner">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-xl tracking-tight"
          aria-label="Deali — Inicio"
        >
          <span className="text-gradient">Deali</span>
          <span className="text-[--color-text-muted] text-xs font-normal hidden sm:inline">
            ofertas supermercados
          </span>
        </Link>

        {/* Nav links */}
        <nav role="navigation" aria-label="Navegación principal">
          <ul className="flex items-center gap-1 list-none" role="list">
            <li>
              <Link
                to="/"
                className={[
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  pathname === '/'
                    ? 'bg-[--color-surface-2] text-[--color-text-primary]'
                    : 'text-[--color-text-secondary] hover:text-[--color-text-primary]',
                ].join(' ')}
                aria-current={pathname === '/' ? 'page' : undefined}
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link
                to="/buscar"
                className={[
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  pathname.startsWith('/buscar')
                    ? 'bg-[--color-surface-2] text-[--color-text-primary]'
                    : 'text-[--color-text-secondary] hover:text-[--color-text-primary]',
                ].join(' ')}
                aria-current={pathname.startsWith('/buscar') ? 'page' : undefined}
              >
                Buscar
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
