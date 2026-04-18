import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';

const STORES = [
  { name: 'Jumbo', href: '/supermercado/jumbo' },
  { name: 'Líder', href: '/supermercado/lider' },
  { name: 'Unimarc', href: '/supermercado/unimarc' },
  { name: 'aCuenta', href: '/supermercado/acuenta' },
  { name: 'Tottus', href: '/supermercado/tottus' },
  { name: 'Santa Isabel', href: '/supermercado/santa-isabel' },
];

const CATEGORIES = [
  { name: 'Despensa', href: '/categoria/despensa' },
  { name: 'Bebidas', href: '/categoria/bebidas' },
  { name: 'Lácteos', href: '/categoria/lacteos' },
  { name: 'Limpieza', href: '/categoria/limpieza-hogar' },
  { name: 'Snacks', href: '/categoria/snacks-galletas' },
];

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border/50 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-gray-400">
      {/* Subtle top gradient overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />

      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <h2 className="mb-3 text-2xl font-black tracking-tight text-white font-display">Deali.</h2>
            <p className="max-w-md text-sm leading-relaxed text-gray-500">
              Rastreamos automáticamente las ofertas de los principales supermercados de Chile para que siempre pagues el mejor precio. Las mejores ofertas, sin buscarlas.
            </p>
          </div>

          {/* Stores */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">Tiendas</h3>
            <ul className="space-y-2.5">
              {STORES.map(store => (
                <li key={store.href}>
                  <Link href={store.href} className="text-sm text-gray-500 transition-colors hover:text-teal">
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
                  <Link href={cat.href} className="text-sm text-gray-500 transition-colors hover:text-purple">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-gray-800 pt-8 text-center text-xs text-gray-600 sm:flex-row sm:justify-between">
          <p className="flex items-center gap-1">
            Hecho con <Heart className="inline h-3 w-3 text-red-500" /> en Chile
          </p>
          <p>No somos afiliados a ningún supermercado. Los precios son referenciales.</p>
          <p>&copy; {new Date().getFullYear()} Deali.</p>
        </div>
      </div>
    </footer>
  );
}
