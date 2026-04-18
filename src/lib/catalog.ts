export const CATEGORY_OPTIONS = [
  { name: 'Bebidas', slug: 'bebidas' },
  { name: 'Lácteos', slug: 'lacteos' },
  { name: 'Carnes y Pescados', slug: 'carnes-pescados' },
  { name: 'Frutas y Verduras', slug: 'frutas-verduras' },
  { name: 'Congelados', slug: 'congelados' },
  { name: 'Limpieza del Hogar', slug: 'limpieza-hogar' },
  { name: 'Electrohogar', slug: 'electrohogar' },
  { name: 'Mascotas', slug: 'mascotas' },
  { name: 'Despensa', slug: 'despensa' },
] as const;

export const PRIMARY_CATEGORIES = [
  { name: 'Bebidas', slug: 'bebidas' },
  { name: 'Lácteos', slug: 'lacteos' },
  { name: 'Carnes y Pescados', slug: 'carnes-pescados' },
  { name: 'Frutas y Verduras', slug: 'frutas-verduras' },
  { name: 'Congelados', slug: 'congelados' },
  { name: 'Limpieza del Hogar', slug: 'limpieza-hogar' },
  { name: 'Despensa', slug: 'despensa' },
] as const;

export const ALCOHOL_CATEGORY_SLUG = 'bebidas-alcoholicas';

export const SORT_OPTIONS = [
  { value: 'discount_desc', label: 'Mayor descuento' },
  { value: 'discount_asc', label: 'Menor descuento' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'price_asc', label: 'Menor precio' },
] as const;

export type SortOptionValue = (typeof SORT_OPTIONS)[number]['value'];
