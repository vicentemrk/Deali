import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Deali — Las mejores ofertas, sin buscarlas',
  description: 'Rastreador de ofertas de supermercados chilenos: Jumbo, Líder, Unimarc y aCuenta. Siempre el mejor precio.',
};

import { Navbar } from '@/components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} ${spaceGrotesk.variable} font-sans`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
