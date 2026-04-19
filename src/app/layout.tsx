import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Deali — Las mejores ofertas, sin buscarlas',
  description:
    'Rastreador de ofertas de supermercados chilenos: Jumbo, Líder, Unimarc, aCuenta, Tottus y Santa Isabel. Siempre el mejor precio.',
  keywords: 'ofertas supermercado chile, precios jumbo, ofertas lider, deali',
  openGraph: {
    title: 'Deali — Las mejores ofertas, sin buscarlas',
    description: 'Comparamos en tiempo real los precios de supermercados chilenos.',
    type: 'website',
    locale: 'es_CL',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/*
          Script de prevención de flash (FOUC) para dark mode.
          Se ejecuta ANTES de que React hidrate — evita el parpadeo
          de blanco→negro al cargar en dark mode.
          NO mover esto ni envolverlo en ningún componente.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('deali-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = stored === 'dark' || (!stored && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
