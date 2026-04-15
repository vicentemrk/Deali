import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mapCategory } from '../categoryMapper';

test('categoryMapper: Bebidas Alcohólicas', () => {
  assert.equal(mapCategory('vinos'), 'bebidas-alcoholicas');
  assert.equal(mapCategory('Cerveza'), 'bebidas-alcoholicas');
  assert.equal(mapCategory('/licores/'), 'bebidas-alcoholicas');
  assert.equal(mapCategory('PISCO'), 'bebidas-alcoholicas');
  assert.equal(mapCategory('Champagne'), 'bebidas-alcoholicas');
  assert.equal(mapCategory('Whisky/Vodka'), 'bebidas-alcoholicas');
});

test('categoryMapper: Lácteos', () => {
  assert.equal(mapCategory('Yogur'), 'lacteos');
  assert.equal(mapCategory('queso'), 'lacteos');
  assert.equal(mapCategory('/lácteos/'), 'lacteos');
  assert.equal(mapCategory('Mantequilla'), 'lacteos');
  assert.equal(mapCategory('crema de leche'), 'lacteos');
  assert.equal(mapCategory('Huevo'), 'lacteos');
});

test('categoryMapper: Carnes y Pescados', () => {
  assert.equal(mapCategory('Carnes'), 'carnes-pescados');
  assert.equal(mapCategory('/Pollo/'), 'carnes-pescados');
  assert.equal(mapCategory('Cerdo'), 'carnes-pescados');
  assert.equal(mapCategory('Pescado'), 'carnes-pescados');
  assert.equal(mapCategory('Salmón'), 'carnes-pescados');
  assert.equal(mapCategory('Mariscos'), 'carnes-pescados');
  assert.equal(mapCategory('Embutido'), 'carnes-pescados');
});

test('categoryMapper: Frutas y Verduras', () => {
  assert.equal(mapCategory('Frutas'), 'frutas-verduras');
  assert.equal(mapCategory('/Verduras/'), 'frutas-verduras');
  assert.equal(mapCategory('Hortalizas'), 'frutas-verduras');
  assert.equal(mapCategory('Tomate'), 'frutas-verduras');
  assert.equal(mapCategory('Manzana'), 'frutas-verduras');
  assert.equal(mapCategory('palta'), 'frutas-verduras');
});

test('categoryMapper: Congelados', () => {
  assert.equal(mapCategory('Congelado'), 'congelados');
  assert.equal(mapCategory('Helado'), 'congelados');
  assert.equal(mapCategory('Pizza Congelada'), 'congelados');
  assert.equal(mapCategory('Nugget'), 'congelados');
});

test('categoryMapper: Panadería y Pastelería', () => {
  assert.equal(mapCategory('Panadería'), 'panaderia-pasteleria');
  assert.equal(mapCategory('/Pan/'), 'panaderia-pasteleria');
  assert.equal(mapCategory('Marraqueta'), 'panaderia-pasteleria');
  assert.equal(mapCategory('Croissant'), 'panaderia-pasteleria');
  assert.equal(mapCategory('Torta'), 'panaderia-pasteleria');
});

test('categoryMapper: Snacks y Galletas', () => {
  assert.equal(mapCategory('Snack'), 'snacks-galletas');
  assert.equal(mapCategory('Galleta'), 'snacks-galletas');
  assert.equal(mapCategory('Chocolate'), 'snacks-galletas');
  assert.equal(mapCategory('Papas fritas'), 'snacks-galletas');
  assert.equal(mapCategory('Frutos secos'), 'snacks-galletas');
  assert.equal(mapCategory('Maní'), 'snacks-galletas');
});

test('categoryMapper: Higiene Personal', () => {
  assert.equal(mapCategory('Higiene Personal'), 'cuidado-personal-bebe');
  assert.equal(mapCategory('Shampoo'), 'cuidado-personal-bebe');
  assert.equal(mapCategory('Jabón de mano'), 'cuidado-personal-bebe');
  assert.equal(mapCategory('Desodorante'), 'cuidado-personal-bebe');
  assert.equal(mapCategory('Pasta de diente'), 'cuidado-personal-bebe');
  assert.equal(mapCategory('Maquillaje'), 'cuidado-personal-bebe');
});

test('categoryMapper: Limpieza del Hogar', () => {
  assert.equal(mapCategory('Limpieza'), 'limpieza-hogar');
  assert.equal(mapCategory('/Detergente/'), 'limpieza-hogar');
  assert.equal(mapCategory('Lava Loza'), 'limpieza-hogar');
  assert.equal(mapCategory('Papel de cocina'), 'limpieza-hogar');
  assert.equal(mapCategory('Cloro'), 'limpieza-hogar');
});

test('categoryMapper: Bebidas (no alcohólicas)', () => {
  assert.equal(mapCategory('Jugo'), 'bebidas');
  assert.equal(mapCategory('/Agua mineral/'), 'bebidas');
  assert.equal(mapCategory('Agua purificada'), 'bebidas');
  assert.equal(mapCategory('Néctar'), 'bebidas');
  assert.equal(mapCategory('Gaseosa'), 'bebidas');
  // Ensure 'Bebidas Alcohólicas' takes precedence
  assert.equal(mapCategory('Bebidas Alcohólicas'), 'bebidas-alcoholicas');
});

test('categoryMapper: Mascotas', () => {
  assert.equal(mapCategory('Mascota'), 'mascotas');
  assert.equal(mapCategory('Alimento para perro'), 'mascotas');
  assert.equal(mapCategory('Gatos'), 'mascotas');
  assert.equal(mapCategory('Veterinario'), 'mascotas');
});

test('categoryMapper: Bebé e Infantil', () => {
  assert.equal(mapCategory('Bebé'), 'cuidado-personal-bebe');
  assert.equal(mapCategory('Pañal'), 'cuidado-personal-bebe');
  assert.equal(mapCategory('Fórmula infantil'), 'cuidado-personal-bebe');
  assert.equal(mapCategory('Colonia bebé'), 'cuidado-personal-bebe');
});

test('categoryMapper: Electrohogar', () => {
  assert.equal(mapCategory('Electrohogar'), 'electrohogar');
  assert.equal(mapCategory('Televisor'), 'electrohogar');
  assert.equal(mapCategory('Smart TV'), 'electrohogar');
  assert.equal(mapCategory('Microondas'), 'electrohogar');
  assert.equal(mapCategory('Lavadora'), 'electrohogar');
});

test('categoryMapper: Bazar y Hogar', () => {
  assert.equal(mapCategory('Bazar'), 'bazar-hogar');
  assert.equal(mapCategory('Vajilla'), 'bazar-hogar');
  assert.equal(mapCategory('Menaje'), 'bazar-hogar');
  assert.equal(mapCategory('Jardín'), 'bazar-hogar');
});

test('categoryMapper: Despensa (fallback broad category)', () => {
  assert.equal(mapCategory('Despensa'), 'despensa');
  assert.equal(mapCategory('Aceite'), 'despensa');
  assert.equal(mapCategory('Arroz'), 'despensa');
  assert.equal(mapCategory('Pasta'), 'despensa');
  assert.equal(mapCategory('Legumbre'), 'despensa');
  assert.equal(mapCategory('Azúcar'), 'despensa');
});

test('categoryMapper: VTEX path normalization', () => {
  // VTEX returns paths like "/Carnes y Aves/Vacuno/" — should strip slashes
  assert.equal(mapCategory('/Carnes y Aves/Vacuno/'), 'carnes-pescados');
  assert.equal(mapCategory('/Bebidas/Jugos/'), 'bebidas');
  assert.equal(mapCategory('/Despensa/Aceites/'), 'despensa');
});

test('categoryMapper: Case insensitivity', () => {
  assert.equal(mapCategory('YOGUR'), 'lacteos');
  assert.equal(mapCategory('yogur'), 'lacteos');
  assert.equal(mapCategory('YoGuR'), 'lacteos');
  assert.equal(mapCategory('POLLO'), 'carnes-pescados');
  assert.equal(mapCategory('pollo'), 'carnes-pescados');
});

test('categoryMapper: Null and undefined handling', () => {
  assert.equal(mapCategory(null), 'general');
  assert.equal(mapCategory(undefined), 'general');
});

test('categoryMapper: Empty string handling', () => {
  assert.equal(mapCategory(''), 'general');
  assert.equal(mapCategory('   '), 'general');
});

test('categoryMapper: No match fallback to General', () => {
  assert.equal(mapCategory('XYZ Random Text'), 'general');
  assert.equal(mapCategory('Producto desconocido 123'), 'general');
  assert.equal(mapCategory('!@#$%^&*()'), 'general');
});

test('categoryMapper: Whitespace trimming', () => {
  assert.equal(mapCategory('  Yogur  '), 'lacteos');
  assert.equal(mapCategory('\tPollo\n'), 'carnes-pescados');
  assert.equal(mapCategory('  /Frutas/  '), 'frutas-verduras');
});

test('categoryMapper: Priority - more specific patterns first', () => {
  // "Bebidas Alcohólicas" should match before generic "Bebidas"
  assert.equal(mapCategory('Bebidas Alcohólicas'), 'bebidas-alcoholicas');
  assert.equal(mapCategory('Alcohol'), 'bebidas-alcoholicas');
  
  // "Congelados" should match before generic "Despensa"
  assert.equal(mapCategory('Pizza Congelada'), 'congelados');
  
  // "Carnes" should match before "Despensa"
  assert.equal(mapCategory('Carnes de Res'), 'carnes-pescados');
});

test('categoryMapper: Accent handling (á, é, í, ó, ú)', () => {
  assert.equal(mapCategory('Lácteos'), 'lacteos');
  assert.equal(mapCategory('Panadería'), 'panaderia-pasteleria');
  assert.equal(mapCategory('Higiene'), 'cuidado-personal-bebe');
  assert.equal(mapCategory('Hortalizas'), 'frutas-verduras');
});

test('categoryMapper: Complex real-world examples', () => {
  // Simulating actual VTEX returns
  assert.equal(mapCategory('/Bebidas/Bebidas No Alcohólicas/Agua/'), 'bebidas');
  assert.equal(mapCategory('/Alimentos/Carnes y Pescados/Pollo/'), 'carnes-pescados');
  assert.equal(mapCategory('/Bebidas/Vinos y Licores/'), 'bebidas-alcoholicas');
  assert.equal(mapCategory('/Higiene y Belleza/Cuidado Personal/'), 'cuidado-personal-bebe');
  assert.equal(mapCategory('/Electro/Televisores/Smart TV/'), 'electrohogar');
});
