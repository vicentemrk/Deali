import { Link } from 'react-router-dom'

const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__inner">

        {/* Brand column */}
        <div className="footer__brand">
          <Link
            to="/"
            aria-label="Deali — Inicio"
            style={{ textDecoration: 'none' }}
          >
            <span
              className="text-gradient font-bold tracking-widest uppercase"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
              }}
            >
              Deali
            </span>
          </Link>
          <p className="footer__tagline">
            Comparador de ofertas de supermercados chilenos — Jumbo, Líder, Tottus, Unimarc y más en un solo lugar.
          </p>
        </div>

        {/* Navigation column */}
        <nav aria-label="Navegación del footer">
          <p className="footer__heading">Navegación</p>
          <ul className="footer__links" role="list">
            <li>
              <Link to="/" className="footer__link">
                Inicio
              </Link>
            </li>
            <li>
              <Link to="/buscar" className="footer__link">
                Buscar ofertas
              </Link>
            </li>
          </ul>
        </nav>

        {/* Info column */}
        <div>
          <p className="footer__heading">Acerca</p>
          <ul className="footer__links" role="list">
            <li>
              <a
                href="https://github.com/vicentemrk/Deali"
                className="footer__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </li>
            <li>
              <span
                className="footer__link"
                style={{ cursor: 'default' }}
              >
                Datos actualizados periódicamente
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <p className="footer__copy">
          © {CURRENT_YEAR} Deali — Proyecto independiente
        </p>
        <p className="footer__copy">
          No afiliado a ninguna cadena de supermercados
        </p>
      </div>
    </footer>
  )
}
