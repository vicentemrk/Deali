import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { HomePage } from './pages/HomePage'
import { SearchPage } from './pages/SearchPage'

function NotFound() {
  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold mb-3">404</h1>
      <p className="text-[--color-text-secondary] mb-6">Página no encontrada</p>
      <a href="/" className="btn-primary inline-flex">Volver al inicio</a>
    </main>
  )
}

export function App() {
  return (
    <BrowserRouter>
      {/* Skip to content para a11y */}
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
    </BrowserRouter>
  )
}
