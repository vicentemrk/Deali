import { RawOffer } from '../types';

/**
 * jumboFixtures.ts
 *
 * Mock data for Jumbo scraper tests.
 * Represents realistic VTEX API responses from jumbo.cl
 * across multiple product categories.
 */

export const JUMBO_FIXTURES: RawOffer[] = [
  // ── Bebidas Alcohólicas ─────────────────────────────────────────
  {
    productName: 'Vino Carmenere Reserva Santa Rita 2021',
    brand: 'Santa Rita',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456001-600-600/vino-santa-rita.jpg',
    offerUrl: 'https://www.jumbo.cl/vino-carmenere-santa-rita-2021/p/456001',
    originalPrice: 12990,
    offerPrice: 9990,
    categoryHint: '/Bebidas/Vinos y Licores/',
  },
  {
    productName: 'Cerveza Artesanal Szot IPA 6x330ml',
    brand: 'Szot',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456002-600-600/cerveza-szot.jpg',
    offerUrl: 'https://www.jumbo.cl/cerveza-szot-ipa/p/456002',
    originalPrice: 8990,
    offerPrice: 6990,
    categoryHint: '/Bebidas/Cervezas y Licores/',
  },

  // ── Lácteos ─────────────────────────────────────────────────────
  {
    productName: 'Leche Entera Colun 1L',
    brand: 'Colun',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456003-600-600/leche-colun.jpg',
    offerUrl: 'https://www.jumbo.cl/leche-colun-1l/p/456003',
    originalPrice: 1590,
    offerPrice: 1290,
    categoryHint: '/Alimentos/Lácteos/Leche/',
  },
  {
    productName: 'Queso Pradera 400g',
    brand: 'Pradera',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456004-600-600/queso-pradera.jpg',
    offerUrl: 'https://www.jumbo.cl/queso-pradera/p/456004',
    originalPrice: 4990,
    offerPrice: 3990,
    categoryHint: '/Alimentos/Lácteos/Queso/',
  },
  {
    productName: 'Yogur Colun Natural 1kg',
    brand: 'Colun',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456005-600-600/yogur-colun.jpg',
    offerUrl: 'https://www.jumbo.cl/yogur-colun-1kg/p/456005',
    originalPrice: 2490,
    offerPrice: 1990,
    categoryHint: '/Alimentos/Lácteos/Yogur/',
  },

  // ── Carnes y Pescados ───────────────────────────────────────────
  {
    productName: 'Pechuga de Pollo ANDES 1kg',
    brand: 'ANDES',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456006-600-600/pollo-andes.jpg',
    offerUrl: 'https://www.jumbo.cl/pechuga-pollo-andes/p/456006',
    originalPrice: 8990,
    offerPrice: 6990,
    categoryHint: '/Alimentos/Carnes y Aves/Pollo/',
  },
  {
    productName: 'Filete de Res Premium 700g',
    brand: 'Jumbo',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456007-600-600/filete-res.jpg',
    offerUrl: 'https://www.jumbo.cl/filete-res-premium/p/456007',
    originalPrice: 24990,
    offerPrice: 17990,
    categoryHint: '/Alimentos/Carnes y Aves/Carnes Rojas/',
  },
  {
    productName: 'Salmón Fresco 600g',
    brand: 'Jumbo',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456008-600-600/salmon-fresco.jpg',
    offerUrl: 'https://www.jumbo.cl/salmon-fresco/p/456008',
    originalPrice: 18990,
    offerPrice: 13990,
    categoryHint: '/Alimentos/Pescados y Mariscos/Pescado Blanco/',
  },

  // ── Frutas y Verduras ───────────────────────────────────────────
  {
    productName: 'Manzana Fuji Bolsa 1kg',
    brand: null,
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456009-600-600/manzana-fuji.jpg',
    offerUrl: 'https://www.jumbo.cl/manzana-fuji-1kg/p/456009',
    originalPrice: 3990,
    offerPrice: 2990,
    categoryHint: '/Frutas y Verduras/Frutas/Manzana/',
  },
  {
    productName: 'Tomate Ensalada 1kg',
    brand: null,
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456010-600-600/tomate-ensalada.jpg',
    offerUrl: 'https://www.jumbo.cl/tomate-ensalada/p/456010',
    originalPrice: 2490,
    offerPrice: 1990,
    categoryHint: '/Frutas y Verduras/Verduras/Tomate/',
  },
  {
    productName: 'Palta Hass 3 unidades',
    brand: null,
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456011-600-600/palta-hass.jpg',
    offerUrl: 'https://www.jumbo.cl/palta-hass-3un/p/456011',
    originalPrice: 6990,
    offerPrice: 4990,
    categoryHint: '/Frutas y Verduras/Frutas/Palta/',
  },

  // ── Despensa ────────────────────────────────────────────────────
  {
    productName: 'Arroz Largo Grano SOS 1kg',
    brand: 'SOS',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456012-600-600/arroz-sos.jpg',
    offerUrl: 'https://www.jumbo.cl/arroz-sos-1kg/p/456012',
    originalPrice: 2490,
    offerPrice: 1990,
    categoryHint: '/Despensa/Arroz y Legumbres/',
  },
  {
    productName: 'Aceite de Oliva Extra Virgen Andina 500ml',
    brand: 'Andina',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456013-600-600/aceite-andina.jpg',
    offerUrl: 'https://www.jumbo.cl/aceite-andina-500ml/p/456013',
    originalPrice: 8990,
    offerPrice: 6990,
    categoryHint: '/Despensa/Aceites y Vinagres/',
  },
  {
    productName: 'Pasta Integral Barilla 500g',
    brand: 'Barilla',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456014-600-600/pasta-barilla.jpg',
    offerUrl: 'https://www.jumbo.cl/pasta-barilla-500g/p/456014',
    originalPrice: 3990,
    offerPrice: 2990,
    categoryHint: '/Despensa/Pastas y Harinas/',
  },
  {
    productName: 'Azúcar Blanca Iansa 1kg',
    brand: 'Iansa',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456015-600-600/azucar-iansa.jpg',
    offerUrl: 'https://www.jumbo.cl/azucar-iansa-1kg/p/456015',
    originalPrice: 2990,
    offerPrice: 2290,
    categoryHint: '/Despensa/Azúcares y Edulcorantes/',
  },

  // ── Bebidas (no alcohólicas) ────────────────────────────────────
  {
    productName: 'Agua Mineral Porvenir 2.5L',
    brand: 'Porvenir',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456016-600-600/agua-porvenir.jpg',
    offerUrl: 'https://www.jumbo.cl/agua-porvenir-2.5l/p/456016',
    originalPrice: 1290,
    offerPrice: 990,
    categoryHint: '/Bebidas/Agua Mineral/',
  },
  {
    productName: 'Jugo Natural del Valle 1.5L',
    brand: 'Del Valle',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456017-600-600/jugo-del-valle.jpg',
    offerUrl: 'https://www.jumbo.cl/jugo-del-valle/p/456017',
    originalPrice: 3490,
    offerPrice: 2490,
    categoryHint: '/Bebidas/Jugos y Néctar/',
  },
  {
    productName: 'Bebida Energética Gatorade 600ml',
    brand: 'Gatorade',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456018-600-600/gatorade.jpg',
    offerUrl: 'https://www.jumbo.cl/gatorade-600ml/p/456018',
    originalPrice: 2290,
    offerPrice: 1790,
    categoryHint: '/Bebidas/Bebidas Energéticas/',
  },

  // ── Panadería y Pastelería ──────────────────────────────────────
  {
    productName: 'Pan de Molde Integral Bimbo 570g',
    brand: 'Bimbo',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456019-600-600/pan-bimbo.jpg',
    offerUrl: 'https://www.jumbo.cl/pan-integral-bimbo/p/456019',
    originalPrice: 3990,
    offerPrice: 2990,
    categoryHint: '/Panadería/Pan de Molde/',
  },

  // ── Snacks y Galletas ───────────────────────────────────────────
  {
    productName: 'Galleta Soda Gallettas 320g',
    brand: 'Gallettas',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456020-600-600/galleta-soda.jpg',
    offerUrl: 'https://www.jumbo.cl/galleta-soda-gallettas/p/456020',
    originalPrice: 2990,
    offerPrice: 2290,
    categoryHint: '/Snacks y Golosinas/Galletas/',
  },
  {
    productName: 'Papas Fritas Lay\'s 140g',
    brand: 'Lay\'s',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456021-600-600/papas-lays.jpg',
    offerUrl: 'https://www.jumbo.cl/papas-lays-140g/p/456021',
    originalPrice: 1990,
    offerPrice: 1590,
    categoryHint: '/Snacks y Golosinas/Papas y Snacks/',
  },

  // ── Limpieza del Hogar ──────────────────────────────────────────
  {
    productName: 'Detergente Ace 2L',
    brand: 'Ace',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456022-600-600/detergente-ace.jpg',
    offerUrl: 'https://www.jumbo.cl/detergente-ace-2l/p/456022',
    originalPrice: 3490,
    offerPrice: 2690,
    categoryHint: '/Limpieza del Hogar/Detergentes/',
  },

  // ── Cuidado Personal ────────────────────────────────────────────
  {
    productName: 'Shampoo Head & Shoulders 375ml',
    brand: 'Head & Shoulders',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456023-600-600/shampoo-hns.jpg',
    offerUrl: 'https://www.jumbo.cl/shampoo-head-shoulders/p/456023',
    originalPrice: 4990,
    offerPrice: 3990,
    categoryHint: '/Higiene Personal/Cuidado Capilar/',
  },

  // ── Congelados ──────────────────────────────────────────────────
  {
    productName: 'Pizza Congelada Exquisita Margarita 430g',
    brand: 'Exquisita',
    imageUrl: 'https://jumbo.vteximg.com.br/arquivos/ids/456024-600-600/pizza-exquisita.jpg',
    offerUrl: 'https://www.jumbo.cl/pizza-exquisita/p/456024',
    originalPrice: 5990,
    offerPrice: 3990,
    categoryHint: '/Congelados/Pizzas y Comidas Rápidas/',
  },
];

/**
 * Returns a subset of Jumbo fixtures for minimal testing.
 * Use this for fast unit tests.
 */
export const JUMBO_FIXTURES_MINIMAL = JUMBO_FIXTURES.slice(0, 5);
