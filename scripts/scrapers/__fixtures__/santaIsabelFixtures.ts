import { RawOffer } from '../types';

/**
 * santaIsabelFixtures.ts
 *
 * Mock data for Santa Isabel scraper tests.
 * Represents realistic VTEX API responses from santaisabel.cl
 * across multiple product categories.
 */

export const SANTA_ISABEL_FIXTURES: RawOffer[] = [
  // ── Bebidas Alcohólicas ─────────────────────────────────────────
  {
    productName: 'Vino Apalta Carmenere Undurraga 2020',
    brand: 'Undurraga',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789001-600-600/vino-undurraga.jpg',
    offerUrl: 'https://www.santaisabel.cl/vino-carmenere-undurraga/p/789001',
    originalPrice: 14990,
    offerPrice: 10990,
    categoryHint: '/Bebidas/Vinos y Espumantes/',
  },
  {
    productName: 'Ron Bacardi 750ml',
    brand: 'Bacardi',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789002-600-600/ron-bacardi.jpg',
    offerUrl: 'https://www.santaisabel.cl/ron-bacardi-750ml/p/789002',
    originalPrice: 16990,
    offerPrice: 12990,
    categoryHint: '/Bebidas/Licores y Destilados/',
  },

  // ── Lácteos ─────────────────────────────────────────────────────
  {
    productName: 'Leche Semidesnatada SOPROLE 1L',
    brand: 'SOPROLE',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789003-600-600/leche-soprole.jpg',
    offerUrl: 'https://www.santaisabel.cl/leche-soprole-1l/p/789003',
    originalPrice: 1490,
    offerPrice: 1190,
    categoryHint: '/Alimentos/Lácteos/Leche/',
  },
  {
    productName: 'Mantequilla Lurisia 250g',
    brand: 'Lurisia',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789004-600-600/mantequilla-lurisia.jpg',
    offerUrl: 'https://www.santaisabel.cl/mantequilla-lurisia/p/789004',
    originalPrice: 3990,
    offerPrice: 2990,
    categoryHint: '/Alimentos/Lácteos/Mantequilla/',
  },
  {
    productName: 'Huevo Blanco Jumbo 30 unidades',
    brand: 'Jumbo',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789005-600-600/huevo-jumbo.jpg',
    offerUrl: 'https://www.santaisabel.cl/huevo-jumbo-30un/p/789005',
    originalPrice: 8990,
    offerPrice: 6990,
    categoryHint: '/Alimentos/Lácteos y Huevo/Huevo/',
  },

  // ── Carnes y Pescados ───────────────────────────────────────────
  {
    productName: 'Muslo y Pata de Pollo 1kg',
    brand: 'Santa Isabel',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789006-600-600/muslo-pollo.jpg',
    offerUrl: 'https://www.santaisabel.cl/muslo-pollo-1kg/p/789006',
    originalPrice: 7490,
    offerPrice: 5490,
    categoryHint: '/Alimentos/Carnes y Aves/Pollo Fresco/',
  },
  {
    productName: 'Costilla de Cerdo 1kg',
    brand: 'Santa Isabel',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789007-600-600/costilla-cerdo.jpg',
    offerUrl: 'https://www.santaisabel.cl/costilla-cerdo/p/789007',
    originalPrice: 11990,
    offerPrice: 8990,
    categoryHint: '/Alimentos/Carnes y Aves/Cerdo/',
  },
  {
    productName: 'Caballa Entera 600g',
    brand: null,
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789008-600-600/caballa-entera.jpg',
    offerUrl: 'https://www.santaisabel.cl/caballa-entera/p/789008',
    originalPrice: 5990,
    offerPrice: 3990,
    categoryHint: '/Alimentos/Pescados y Mariscos/Pescado Blanco/',
  },

  // ── Frutas y Verduras ───────────────────────────────────────────
  {
    productName: 'Plátano Barraganete 1kg',
    brand: null,
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789009-600-600/platano-barraganete.jpg',
    offerUrl: 'https://www.santaisabel.cl/platano-barraganete/p/789009',
    originalPrice: 1990,
    offerPrice: 1290,
    categoryHint: '/Frutas y Verduras/Frutas/Plátano/',
  },
  {
    productName: 'Lechuga Crespa 1 unidad',
    brand: null,
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789010-600-600/lechuga-crespa.jpg',
    offerUrl: 'https://www.santaisabel.cl/lechuga-crespa/p/789010',
    originalPrice: 2490,
    offerPrice: 1490,
    categoryHint: '/Frutas y Verduras/Verduras/Lechuga/',
  },
  {
    productName: 'Zanahoria 1kg',
    brand: null,
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789011-600-600/zanahoria.jpg',
    offerUrl: 'https://www.santaisabel.cl/zanahoria-1kg/p/789011',
    originalPrice: 1990,
    offerPrice: 1290,
    categoryHint: '/Frutas y Verduras/Verduras/Zanahoria/',
  },

  // ── Despensa ────────────────────────────────────────────────────
  {
    productName: 'Arroz Arborio Gallo 500g',
    brand: 'Gallo',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789012-600-600/arroz-gallo.jpg',
    offerUrl: 'https://www.santaisabel.cl/arroz-gallo-500g/p/789012',
    originalPrice: 4990,
    offerPrice: 3690,
    categoryHint: '/Despensa/Arroz y Granos/',
  },
  {
    productName: 'Lentejas Verdes 500g',
    brand: 'Santa Isabel',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789013-600-600/lentejas-verdes.jpg',
    offerUrl: 'https://www.santaisabel.cl/lentejas-verdes/p/789013',
    originalPrice: 2990,
    offerPrice: 1990,
    categoryHint: '/Despensa/Legumbres y Secas/',
  },
  {
    productName: 'Aceite de Girasol Nutrioil 1L',
    brand: 'Nutrioil',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789014-600-600/aceite-nutrioil.jpg',
    offerUrl: 'https://www.santaisabel.cl/aceite-nutrioil-1l/p/789014',
    originalPrice: 2990,
    offerPrice: 2290,
    categoryHint: '/Despensa/Aceites y Condimentos/',
  },
  {
    productName: 'Salsa de Tomate Magistral 400g',
    brand: 'Magistral',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789015-600-600/salsa-tomate.jpg',
    offerUrl: 'https://www.santaisabel.cl/salsa-tomate-magistral/p/789015',
    originalPrice: 1790,
    offerPrice: 1290,
    categoryHint: '/Despensa/Salsas y Condimentos/',
  },

  // ── Bebidas (no alcohólicas) ────────────────────────────────────
  {
    productName: 'Agua Purificada Cachantún 5L',
    brand: 'Cachantún',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789016-600-600/agua-cachantu.jpg',
    offerUrl: 'https://www.santaisabel.cl/agua-cachantu-5l/p/789016',
    originalPrice: 3490,
    offerPrice: 2290,
    categoryHint: '/Bebidas/Agua Purificada/',
  },
  {
    productName: 'Néctar Pera Del Monte 1L',
    brand: 'Del Monte',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789017-600-600/nectar-del-monte.jpg',
    offerUrl: 'https://www.santaisabel.cl/nectar-del-monte/p/789017',
    originalPrice: 2990,
    offerPrice: 1990,
    categoryHint: '/Bebidas/Jugos y Néctar/',
  },
  {
    productName: 'Té Frío Lipton 1.5L',
    brand: 'Lipton',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789018-600-600/te-frio-lipton.jpg',
    offerUrl: 'https://www.santaisabel.cl/te-frio-lipton/p/789018',
    originalPrice: 2490,
    offerPrice: 1790,
    categoryHint: '/Bebidas/Bebidas Frías/',
  },

  // ── Panadería y Pastelería ──────────────────────────────────────
  {
    productName: 'Marraqueta Antepasado 380g',
    brand: 'Antepasado',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789019-600-600/marraqueta-antep.jpg',
    offerUrl: 'https://www.santaisabel.cl/marraqueta-antepasado/p/789019',
    originalPrice: 2290,
    offerPrice: 1690,
    categoryHint: '/Panadería/Pan Tradicional/',
  },

  // ── Snacks y Galletas ───────────────────────────────────────────
  {
    productName: 'Chocolate Águila 35g',
    brand: 'Águila',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789020-600-600/chocolate-aguila.jpg',
    offerUrl: 'https://www.santaisabel.cl/chocolate-aguila-35g/p/789020',
    originalPrice: 590,
    offerPrice: 390,
    categoryHint: '/Snacks y Golosinas/Chocolate/',
  },
  {
    productName: 'Maní Salado Jumbo 300g',
    brand: 'Jumbo',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789021-600-600/mani-jumbo.jpg',
    offerUrl: 'https://www.santaisabel.cl/mani-salado-jumbo/p/789021',
    originalPrice: 3490,
    offerPrice: 2490,
    categoryHint: '/Snacks y Golosinas/Frutos Secos/',
  },

  // ── Limpieza del Hogar ──────────────────────────────────────────
  {
    productName: 'Lava Loza Patito 400ml',
    brand: 'Patito',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789022-600-600/lava-loza-patito.jpg',
    offerUrl: 'https://www.santaisabel.cl/lava-loza-patito/p/789022',
    originalPrice: 990,
    offerPrice: 690,
    categoryHint: '/Limpieza del Hogar/Lava Loza/',
  },

  // ── Cuidado Personal ────────────────────────────────────────────
  {
    productName: 'Pasta de Dientes Colgate 125ml',
    brand: 'Colgate',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789023-600-600/pasta-colgate.jpg',
    offerUrl: 'https://www.santaisabel.cl/pasta-colgate-125ml/p/789023',
    originalPrice: 2490,
    offerPrice: 1790,
    categoryHint: '/Higiene Personal/Cuidado Bucal/',
  },

  // ── Congelados ──────────────────────────────────────────────────
  {
    productName: 'Helado Fruna Vainilla 1L',
    brand: 'Fruna',
    imageUrl: 'https://santaisabel.vteximg.com.br/arquivos/ids/789024-600-600/helado-fruna.jpg',
    offerUrl: 'https://www.santaisabel.cl/helado-fruna-1l/p/789024',
    originalPrice: 4990,
    offerPrice: 2990,
    categoryHint: '/Congelados/Helados y Postres/',
  },
];

/**
 * Returns a subset of Santa Isabel fixtures for minimal testing.
 * Use this for fast unit tests.
 */
export const SANTA_ISABEL_FIXTURES_MINIMAL = SANTA_ISABEL_FIXTURES.slice(0, 5);
