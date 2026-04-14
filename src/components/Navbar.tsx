import React from 'react';
import Link from 'next/link';
import { DynamicMenu } from './DynamicMenu';

const HEADER_CATEGORIES = [
  {
    id: 'supermercados',
    name: 'Supermercados',
    slug: 'supermercados',
    children: [
      { id: 'jumbo', name: 'Jumbo', slug: 'jumbo' },
      { id: 'lider', name: 'Líder', slug: 'lider' },
      { id: 'unimarc', name: 'Unimarc', slug: 'unimarc' },
      { id: 'acuenta', name: 'aCuenta', slug: 'acuenta' },
      { id: 'tottus', name: 'Tottus', slug: 'tottus' },
      { id: 'santa-isabel', name: 'Santa Isabel', slug: 'santa-isabel' },
    ]
  },
  {
    id: 'departamentos',
    name: 'Departamentos',
    slug: 'departamentos',
    children: [
      { id: 'despensa', name: 'Despensa', slug: 'despensa' },
      { id: 'bebidas', name: 'Bebidas', slug: 'bebidas' },
      { id: 'lacteos', name: 'Lácteos', slug: 'lacteos' },
      { id: 'aseo', name: 'Limpieza y Aseo', slug: 'aseo' }
    ]
  }
];

export function Navbar() {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Logo */}
        <Link href="/" className="text-3xl font-black text-teal tracking-tighter">
          Deali.
        </Link>
        
        {/* Navigation Dropdown */}
        <div className="hidden md:block flex-shrink-0 z-50">
           <DynamicMenu categories={HEADER_CATEGORIES} />
        </div>

        {/* Search Bar */}
        <form action="/buscar" method="GET" className="flex-1 min-w-[200px] max-w-xl mx-auto flex">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
               <svg className="w-5 h-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
            </div>
            <input 
              type="search" 
              name="q"
              className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-200 rounded-full bg-bg-page focus:ring-purple focus:border-purple outline-none transition-all" 
              placeholder="Buscar marcas, pisco, arroz, atún..." 
              required 
            />
          </div>
          <button type="submit" className="hidden" aria-label="Buscar">Buscar</button>
        </form>

      </div>
    </header>
  );
}
