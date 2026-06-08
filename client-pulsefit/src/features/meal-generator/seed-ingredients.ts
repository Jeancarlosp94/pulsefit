import type { ItfIngredient } from './types'

/**
 * Pool inicial de ingredientes LATAM. Hasta que la Edge Function consulte
 * Open Food Facts en tiempo real (Fase 5.5), este seed garantiza que la
 * generación funcione end-to-end. Los valores macro provienen de USDA
 * FoodData Central + Tabla Peruana de Composición de Alimentos.
 *
 * Importable también desde la Edge Function (deno) vía type-only import.
 */
export const SEED_INGREDIENTS: ItfIngredient[] = [
   // === PROTEÍNAS ===
   {
      id: 'chicken-breast',
      name: 'pechuga de pollo',
      category: 'protein',
      kcalPer100g: 165,
      proteinPer100g: 31,
      carbsPer100g: 0,
      fatsPer100g: 3.6,
      tags: ['LATAM', 'meat', 'cheap', 'lean'],
      source: 'manual'
   },
   {
      id: 'tuna-can',
      name: 'atún al agua en lata',
      category: 'protein',
      kcalPer100g: 116,
      proteinPer100g: 26,
      carbsPer100g: 0,
      fatsPer100g: 1,
      tags: ['LATAM', 'fish', 'cheap', 'pescatarian'],
      source: 'manual'
   },
   {
      id: 'eggs',
      name: 'huevos',
      category: 'protein',
      kcalPer100g: 155,
      proteinPer100g: 13,
      carbsPer100g: 1.1,
      fatsPer100g: 11,
      tags: ['LATAM', 'egg', 'cheap', 'vegetarian'],
      source: 'manual'
   },
   {
      id: 'beef-lean',
      name: 'carne de res magra',
      category: 'protein',
      kcalPer100g: 217,
      proteinPer100g: 26,
      carbsPer100g: 0,
      fatsPer100g: 12,
      tags: ['LATAM', 'meat', 'mid'],
      source: 'manual'
   },
   {
      id: 'lentils-cooked',
      name: 'lentejas cocidas',
      category: 'protein',
      kcalPer100g: 116,
      proteinPer100g: 9,
      carbsPer100g: 20,
      fatsPer100g: 0.4,
      tags: ['LATAM', 'cheap', 'vegan', 'vegetarian', 'pescatarian'],
      source: 'manual'
   },
   {
      id: 'tofu',
      name: 'tofu',
      category: 'protein',
      kcalPer100g: 144,
      proteinPer100g: 17,
      carbsPer100g: 3,
      fatsPer100g: 9,
      tags: ['mid', 'vegan', 'vegetarian', 'pescatarian'],
      source: 'manual'
   },
   {
      id: 'fish-tilapia',
      name: 'filete de tilapia',
      category: 'protein',
      kcalPer100g: 96,
      proteinPer100g: 20,
      carbsPer100g: 0,
      fatsPer100g: 2,
      tags: ['LATAM', 'fish', 'cheap', 'pescatarian'],
      source: 'manual'
   },

   // === CARBOHIDRATOS ===
   {
      id: 'rice-white',
      name: 'arroz blanco cocido',
      category: 'carb',
      kcalPer100g: 130,
      proteinPer100g: 2.7,
      carbsPer100g: 28,
      fatsPer100g: 0.3,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   },
   {
      id: 'sweet-potato',
      name: 'camote',
      category: 'carb',
      kcalPer100g: 86,
      proteinPer100g: 1.6,
      carbsPer100g: 20,
      fatsPer100g: 0.1,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   },
   {
      id: 'plantain',
      name: 'plátano maduro',
      category: 'carb',
      kcalPer100g: 122,
      proteinPer100g: 1.3,
      carbsPer100g: 32,
      fatsPer100g: 0.4,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   },
   {
      id: 'oats',
      name: 'avena',
      category: 'carb',
      kcalPer100g: 389,
      proteinPer100g: 16.9,
      carbsPer100g: 66,
      fatsPer100g: 6.9,
      tags: ['cheap', 'vegan'],
      source: 'manual'
   },
   {
      id: 'quinoa',
      name: 'quinua cocida',
      category: 'carb',
      kcalPer100g: 120,
      proteinPer100g: 4.4,
      carbsPer100g: 21,
      fatsPer100g: 1.9,
      tags: ['LATAM', 'mid', 'vegan', 'gluten_free'],
      source: 'manual'
   },
   {
      id: 'pasta-cooked',
      name: 'pasta cocida',
      category: 'carb',
      kcalPer100g: 131,
      proteinPer100g: 5,
      carbsPer100g: 25,
      fatsPer100g: 1.1,
      tags: ['cheap', 'vegan', 'gluten'],
      source: 'manual'
   },
   {
      id: 'potato',
      name: 'papa',
      category: 'carb',
      kcalPer100g: 77,
      proteinPer100g: 2,
      carbsPer100g: 17,
      fatsPer100g: 0.1,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   },

   // === GRASAS ===
   {
      id: 'olive-oil',
      name: 'aceite de oliva',
      category: 'fat',
      kcalPer100g: 884,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatsPer100g: 100,
      tags: ['mid', 'vegan'],
      source: 'manual'
   },
   {
      id: 'avocado',
      name: 'aguacate',
      category: 'fat',
      kcalPer100g: 160,
      proteinPer100g: 2,
      carbsPer100g: 8.5,
      fatsPer100g: 14.7,
      tags: ['LATAM', 'mid', 'vegan'],
      source: 'manual'
   },
   {
      id: 'peanut-butter',
      name: 'mantequilla de maní',
      category: 'fat',
      kcalPer100g: 588,
      proteinPer100g: 25,
      carbsPer100g: 20,
      fatsPer100g: 50,
      tags: ['cheap', 'vegan'],
      source: 'manual'
   },
   {
      id: 'walnuts',
      name: 'nueces',
      category: 'fat',
      kcalPer100g: 654,
      proteinPer100g: 15,
      carbsPer100g: 14,
      fatsPer100g: 65,
      tags: ['mid', 'vegan'],
      source: 'manual'
   },

   // === VEGETALES ===
   {
      id: 'broccoli',
      name: 'brócoli',
      category: 'vegetable',
      kcalPer100g: 34,
      proteinPer100g: 2.8,
      carbsPer100g: 7,
      fatsPer100g: 0.4,
      tags: ['cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   },
   {
      id: 'spinach',
      name: 'espinaca',
      category: 'vegetable',
      kcalPer100g: 23,
      proteinPer100g: 2.9,
      carbsPer100g: 3.6,
      fatsPer100g: 0.4,
      tags: ['cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   },
   {
      id: 'tomato',
      name: 'tomate',
      category: 'vegetable',
      kcalPer100g: 18,
      proteinPer100g: 0.9,
      carbsPer100g: 3.9,
      fatsPer100g: 0.2,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   },
   {
      id: 'lettuce',
      name: 'lechuga',
      category: 'vegetable',
      kcalPer100g: 15,
      proteinPer100g: 1.4,
      carbsPer100g: 2.9,
      fatsPer100g: 0.2,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   },
   {
      id: 'zucchini',
      name: 'zapallito italiano',
      category: 'vegetable',
      kcalPer100g: 17,
      proteinPer100g: 1.2,
      carbsPer100g: 3.1,
      fatsPer100g: 0.3,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   },

   // === CONDIMENTOS (libre uso, no cuentan en macros) ===
   {
      id: 'garlic',
      name: 'ajo',
      category: 'condiment',
      kcalPer100g: 149,
      proteinPer100g: 6.4,
      carbsPer100g: 33,
      fatsPer100g: 0.5,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   },
   {
      id: 'lemon',
      name: 'limón',
      category: 'condiment',
      kcalPer100g: 29,
      proteinPer100g: 1.1,
      carbsPer100g: 9.3,
      fatsPer100g: 0.3,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   },
   {
      id: 'salt',
      name: 'sal',
      category: 'condiment',
      kcalPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatsPer100g: 0,
      tags: ['cheap', 'vegan', 'gluten_free'],
      source: 'manual'
   }
]
