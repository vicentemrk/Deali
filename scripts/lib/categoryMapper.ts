/**
 * categoryMapper.ts
 *
 * Normalizes free-text category hints from VTEX API and Playwright scrapers
 * (Chilean supermarkets) into the Deali canonical category slugs.
 *
 * VTEX returns paths like "/Carnes y Aves/Vacuno/" — we strip slashes and
 * lowercase before matching. Playwright scrapers return whatever the DOM says.
 *
 * Priority: more specific patterns first (licores before bebidas, etc.)
 */

// Each entry: [regex, canonical slug]
// Order matters — more specific patterns must come before broad ones.
const RULES: Array<[RegExp, string]> = [
  // ── Bebidas Alcohólicas ────────────────────────────────────────────────
  [/alcohol|licor|vinos?|cerveza|pisco|ron\b|vodka|whisky|espumante|cider|sidra/i, 'licores'],

  // ── Lácteos ───────────────────────────────────────────────────────────
  [/l[aá]cteo|yogur|queso|mantequilla|crema\s+de\s+leche|leche|huevo|margarina/i, 'lacteos'],

  // ── Carnes y Aves ─────────────────────────────────────────────────────
  [/carnes?|aves?|pollo|cerdo|vacuno|pavo|cordero|embutido|jamón|salchicha|mariscos?|pescado|salm[oó]n|atún/i, 'carnes'],

  // ── Frutas y Verduras ─────────────────────────────────────────────────
  [/frutas?|verduras?|hortalizas?|ensalada\s+bag|vegetal|tomate|lechuga|cebolla|manzana|palta|plátano/i, 'frutas-verduras'],

  // ── Congelados ────────────────────────────────────────────────────────
  [/congelado|helado|pizza\s+cong|nugget/i, 'congelados'],

  // ── Panadería y Pastelería ────────────────────────────────────────────
  [/panader[ií]|pasteler[ií]|pan\b|marraqueta|hallulla|tostada|galleta\s+de\s+agua|croissant|tortas?/i, 'panaderia'],

  // ── Snacks y Galletas ─────────────────────────────────────────────────
  [/snack|galleta|confite|chocolate|caramelo|choclo\s+palomita|papas?\s+fritas?|frutos?\s+secos?|maní/i, 'snacks'],

  // ── Higiene Personal ──────────────────────────────────────────────────
  [/higiene\s+personal|cuidado\s+personal|shamp[o]?o|acondicionador|jabón\s+(de\s+)?mano|desodorante|dental|pasta\s+de\s+diente|afeitado|toalla\s+higi[eé]|maquillaje|cosmético/i, 'higiene'],

  // ── Limpieza del Hogar ────────────────────────────────────────────────
  [/limpieza|aseo\s+del?\s+hogar|detergente|suavizante|lava\s+loza|desengrasante|cloro|esponja|escoba|papel\s+de\s+cocina|servilleta|papel\s+higi[eé]/i, 'aseo'],

  // ── Bebidas (no alcohólicas) ──────────────────────────────────────────
  [/bebidas?\s*(y\s*\w+)?(?!\s*alcoh)|jugos?|agua\s+(mineral|purificada|con\s+gas)|néctar|té\s+frío|isotón|energétic|gaseosa|agua\b/i, 'bebidas'],

  // ── Mascotas ──────────────────────────────────────────────────────────
  [/mascota|perros?|gatos?|alimento\s+(para\s+)?(perro|gato)|veterinari/i, 'mascotas'],

  // ── Bebé e Infantil ───────────────────────────────────────────────────
  [/beb[eé]|infantil|ni[ñn]o|pañal|f[oó]rmula\s+infantil|colonia\s+beb[eé]/i, 'infantil'],

  // ── Electrohogar ────────────────────────────────────────────────────────
  [/electro(hogar|dom[eé]stico)?|televisor|smart\s*tv|microondas|lavadora|secadora|refrigerador|aspiradora|horno\s+el[eé]ctrico|licuadora|batidora|tostador/i, 'electro'],

  // ── Bazar y Hogar ─────────────────────────────────────────────────────
  [/bazar|artefacto|cocina\s+(y\s+\w+)?|vajilla|menaje|jardín|herramienta/i, 'bazar'],

  // ── Despensa (broad — must come last before fallback) ────────────────
  [/despensa|alimento|aceite|arroz|pasta\b|legumbre|conserva|salsa|atún|mayonesa|mostaza|mermelada|miel|cereal|harina|azúcar|sal\b/i, 'despensa'],
];

/**
 * Maps a free-text category hint to a Deali category slug.
 * Returns 'general' when no rule matches.
 */
export function mapCategory(hint: string | null | undefined): string {
  if (!hint) return 'general';

  // Strip leading/trailing slashes (VTEX path format) and normalize
  const normalized = hint.replace(/^\/|\/$/g, '').trim();

  for (const [pattern, slug] of RULES) {
    if (pattern.test(normalized)) return slug;
  }

  return 'general';
}
