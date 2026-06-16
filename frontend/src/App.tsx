import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { ScrollToTop } from './components/ScrollToTop'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'

function NotFound() {
  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 py-20 text-center navbar-offset">
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '4rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: 'var(--color-accent)',
          marginBottom: '0.75rem',
        }}
      >
        404
      </h1>
      <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        Página no encontrada
      </p>
      <a href="/" className="btn-primary inline-flex">Volver al inicio</a>
    </main>
  )
}

export function App() {
  return (
    <BrowserRouter>
      {/* Skip to content — a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 btn-primary"
      >
        Saltar al contenido
      </a>

      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/buscar" element={<SearchPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
      <ScrollToTop />
    </BrowserRouter>
  )
}
