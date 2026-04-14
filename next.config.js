/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cencosud CDN (Jumbo, Santa Isabel) — VTEX image server
      { protocol: 'https', hostname: '*.vteximg.com.br' },
      { protocol: 'https', hostname: '*.vtexassets.com' },
      // Walmart Chile (Líder) — VTEX
      { protocol: 'https', hostname: '*.lider.cl' },
      { protocol: 'https', hostname: 'images.lider.cl' },
      // Falabella (Tottus)
      { protocol: 'https', hostname: '*.falabella.com' },
      { protocol: 'https', hostname: 'falabella.scene7.com' },
      // SMU (Unimarc, Acuenta)
      { protocol: 'https', hostname: '*.unimarc.cl' },
      { protocol: 'https', hostname: '*.acuenta.cl' },
      // Supabase Storage (imágenes subidas en el futuro)
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};
module.exports = nextConfig;

