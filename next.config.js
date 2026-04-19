/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ── VTEX CDN (all VTEX-based stores: Jumbo, Tottus, Santa Isabel, Líder) ──
      { protocol: 'https', hostname: '*.vteximg.com.br' },
      { protocol: 'https', hostname: '*.vtexassets.com' },
      { protocol: 'https', hostname: '*.vtexcommercestable.com.br' },
      // Specific VTEX store frontends (for images hosted on main domains)
      { protocol: 'https', hostname: 'jumbo.vteximg.com.br' },
      { protocol: 'https', hostname: 'tottus.vteximg.com.br' },
      { protocol: 'https', hostname: 'santaisabel.vteximg.com.br' },
      { protocol: 'https', hostname: 'lider.vteximg.com.br' },
      // Walmart Chile (Líder) — main site and CDN images
      { protocol: 'https', hostname: '*.lider.cl' },
      { protocol: 'https', hostname: 'images.lider.cl' },
      { protocol: 'https', hostname: '*.walmartimages.cl' },
      // Falabella (Tottus) — Scene7 CDN for high-res product images
      { protocol: 'https', hostname: '*.falabella.com' },
      { protocol: 'https', hostname: 'falabella.scene7.com' },
      // SMU (Unimarc, Acuenta)
      { protocol: 'https', hostname: '*.unimarc.cl' },
      { protocol: 'https', hostname: '*.acuenta.cl' },
      // Supabase Storage (uploaded assets)
      { protocol: 'https', hostname: '*.supabase.co' },
      // Unsplash (placeholder images for promotions)
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};
module.exports = nextConfig;

