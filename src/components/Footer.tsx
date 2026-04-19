import React from 'react';
import Link from 'next/link';

const STORES = [
  { name: 'Jumbo', href: '/supermercado/jumbo' },
  { name: 'Líder', href: '/supermercado/lider' },
  { name: 'Unimarc', href: '/supermercado/unimarc' },
  { name: 'aCuenta', href: '/supermercado/acuenta' },
  { name: 'Tottus', href: '/supermercado/tottus' },
  { name: 'Santa Isabel', href: '/supermercado/santa-isabel' },
];

const CATEGORIES = [
  { name: 'Bebidas', href: '/categoria/bebidas' },
  { name: 'Lácteos', href: '/categoria/lacteos' },
  { name: 'Carnes y Pescados', href: '/categoria/carnes-pescados' },
  { name: 'Frutas y Verduras', href: '/categoria/frutas-verduras' },
  { name: 'Congelados', href: '/categoria/congelados' },
  { name: 'Limpieza del Hogar', href: '/categoria/limpieza-hogar' },
  { name: 'Despensa', href: '/categoria/despensa' },
  { name: 'Mascotas', href: '/categoria/mascotas' },
];

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border/50 bg-[#1E1B4B] text-gray-400">
      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <h2 className="mb-3 text-2xl font-black tracking-tight text-white font-display">Deali.</h2>
            <p className="max-w-md text-sm leading-relaxed text-gray-400">
              Rastreamos automáticamente las ofertas de los principales supermercados de Chile para que siempre pagues el mejor precio.
            </p>
          </div>

          {/* Stores */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Tiendas</h3>
            <ul className="space-y-2.5">
              {STORES.map(store => (
                <li key={store.href}>
                  <Link href={store.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                    {store.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Categorías</h3>
            <ul className="space-y-2.5">
              {CATEGORIES.map(cat => (
                <li key={cat.href}>
                  <Link href={cat.href} className="text-sm text-gray-400 transition-colors hover:text-white">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-white/10 pt-8 text-center text-xs text-gray-500 sm:flex-row sm:justify-between">
          <p>No somos afiliados a ningún supermercado. Los precios son referenciales.</p>
          <p>&copy; {new Date().getFullYear()} Deali. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
