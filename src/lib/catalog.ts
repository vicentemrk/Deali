export const CATEGORY_OPTIONS = [
  { name: 'Bebidas', slug: 'bebidas' },
  { name: 'Lácteos', slug: 'lacteos' },
  { name: 'Carnes y Pescados', slug: 'carnes-pescados' },
  { name: 'Frutas y Verduras', slug: 'frutas-verduras' },
  { name: 'Congelados', slug: 'congelados' },
  { name: 'Panadería y Pastelería', slug: 'panaderia-pasteleria' },
  { name: 'Snacks y Galletas', slug: 'snacks-galletas' },
  { name: 'Cuidado Personal y Bebe', slug: 'cuidado-personal-bebe' },
  { name: 'Limpieza del Hogar', slug: 'limpieza-hogar' },
  { name: 'Bebidas Alcohólicas', slug: 'bebidas-alcoholicas' },
  { name: 'Mascotas', slug: 'mascotas' },
  { name: 'Electrohogar', slug: 'electrohogar' },
  { name: 'Bazar y Hogar', slug: 'bazar-hogar' },
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
