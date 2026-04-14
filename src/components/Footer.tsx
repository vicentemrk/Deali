import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-footer text-purple-light py-12 mt-20">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-3xl font-bold text-white mb-4">Deali</h2>
          <p className="text-sm opacity-80 leading-relaxed max-w-md">
            Deali rastrea automáticamente las ofertas de Jumbo, Líder, Unimarc, aCuenta, Tottus y Santa Isabel para que siempre pagues el mejor precio. Las mejores ofertas, sin buscarlas.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-semibold text-white mb-4 uppercase tracking-wider text-sm">Tiendas</h3>
          <ul className="space-y-2 opacity-80 text-sm">
            <li><Link href="/supermercado/jumbo" className="hover:text-white transition-colors">Jumbo</Link></li>
            <li><Link href="/supermercado/lider" className="hover:text-white transition-colors">Líder</Link></li>
            <li><Link href="/supermercado/unimarc" className="hover:text-white transition-colors">Unimarc</Link></li>
            <li><Link href="/supermercado/acuenta" className="hover:text-white transition-colors">aCuenta</Link></li>
            <li><Link href="/supermercado/tottus" className="hover:text-white transition-colors">Tottus</Link></li>
            <li><Link href="/supermercado/santa-isabel" className="hover:text-white transition-colors">Santa Isabel</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4 uppercase tracking-wider text-sm">Explora</h3>
          <ul className="space-y-2 opacity-80 text-sm">
            <li><Link href="/promociones" className="hover:text-white transition-colors">Promociones</Link></li>
            <li><Link href="/categoria/despensa" className="hover:text-white transition-colors">Despensa</Link></li>
            <li><Link href="/categoria/bebidas" className="hover:text-white transition-colors">Bebidas</Link></li>
            <li><Link href="/categoria/limpieza-hogar" className="hover:text-white transition-colors">Limpieza del Hogar</Link></li>
          </ul>
        </div>

      </div>

      <div className="container mx-auto px-6 mt-12 pt-8 border-t border-purple-light/20 text-xs opacity-60 text-center">
        <p>No somos afiliados a ningún supermercado. Los precios son de referencia y pueden variar. Siempre verifica en el sitio oficial.</p>
        <p className="mt-2">&copy; {new Date().getFullYear()} Deali. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
