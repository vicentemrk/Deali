import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500'] });

export const metadata: Metadata = {
  title: 'Deali — Las mejores ofertas, sin buscarlas',
  description: 'Rastreador de ofertas de supermercados chilenos: Jumbo, Líder, Unimarc y aCuenta. Siempre el mejor precio.',
};

import { Navbar } from '@/components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
