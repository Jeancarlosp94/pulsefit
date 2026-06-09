import type { ItfIngredient } from './types'

/**
 * Pool inicial de ingredientes LATAM con `appropriateMealTypes` validado por Lucía.
 *
 * Reglas de asignación:
 *   - Huevos / avena / yogurt / frutos secos / mantequilla de maní → breakfast + snack.
 *   - Pollo / res / pescados / tofu / lentejas (cocción media-larga) → lunch + dinner.
 *   - Atún en lata → todas (se come rápido).
 *   - Cereales pesados (quinua cocida) → lunch + dinner principalmente.
 *   - Plátano / fruta / camote dulce → breakfast + snack.
 *   - Verduras → todas (acompañamiento universal).
 *   - Condimentos sin appropriateMealTypes = válidos en todas (default).
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
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner', 'snack_am', 'snack_pm']
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
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'lunch', 'dinner', 'snack_am', 'snack_pm']
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
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
   },
   {
      id: 'greek-yogurt',
      name: 'yogurt griego natural',
      category: 'protein',
      kcalPer100g: 97,
      proteinPer100g: 10,
      carbsPer100g: 4,
      fatsPer100g: 5,
      tags: ['LATAM', 'dairy', 'vegetarian', 'mid'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'cottage-cheese',
      name: 'queso cottage / requesón',
      category: 'protein',
      kcalPer100g: 98,
      proteinPer100g: 11,
      carbsPer100g: 3.4,
      fatsPer100g: 4.3,
      tags: ['dairy', 'vegetarian', 'mid'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'whey-protein',
      name: 'proteína en polvo (whey)',
      category: 'protein',
      kcalPer100g: 380,
      proteinPer100g: 80,
      carbsPer100g: 7,
      fatsPer100g: 5,
      tags: ['dairy', 'mid', 'vegetarian'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'ham-turkey',
      name: 'jamón de pavo magro',
      category: 'protein',
      kcalPer100g: 104,
      proteinPer100g: 18,
      carbsPer100g: 1.6,
      fatsPer100g: 3,
      tags: ['LATAM', 'meat', 'mid'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'lunch', 'snack_am', 'snack_pm']
   },
   {
      id: 'salmon-fresh',
      name: 'filete de salmón',
      category: 'protein',
      kcalPer100g: 208,
      proteinPer100g: 20,
      carbsPer100g: 0,
      fatsPer100g: 13,
      tags: ['fish', 'mid', 'pescatarian'],
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
   },
   {
      id: 'chickpeas',
      name: 'garbanzos cocidos',
      category: 'protein',
      kcalPer100g: 164,
      proteinPer100g: 9,
      carbsPer100g: 27,
      fatsPer100g: 2.6,
      tags: ['LATAM', 'cheap', 'vegan', 'vegetarian', 'pescatarian'],
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner', 'snack_pm']
   },
   {
      id: 'black-beans',
      name: 'frijoles negros cocidos',
      category: 'protein',
      kcalPer100g: 132,
      proteinPer100g: 9,
      carbsPer100g: 24,
      fatsPer100g: 0.5,
      tags: ['LATAM', 'cheap', 'vegan', 'vegetarian', 'pescatarian'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'lunch', 'dinner']
   },
   {
      id: 'shrimp',
      name: 'camarones',
      category: 'protein',
      kcalPer100g: 99,
      proteinPer100g: 24,
      carbsPer100g: 0.2,
      fatsPer100g: 0.3,
      tags: ['LATAM', 'fish', 'mid', 'pescatarian'],
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'lunch', 'dinner', 'snack_am', 'snack_pm']
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
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
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
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
   },
   {
      id: 'bread-whole',
      name: 'pan integral',
      category: 'carb',
      kcalPer100g: 247,
      proteinPer100g: 13,
      carbsPer100g: 41,
      fatsPer100g: 4.2,
      tags: ['cheap', 'vegan', 'gluten'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'tortilla-maiz',
      name: 'tortilla de maíz',
      category: 'carb',
      kcalPer100g: 218,
      proteinPer100g: 5.7,
      carbsPer100g: 45,
      fatsPer100g: 2.5,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'lunch', 'dinner']
   },
   {
      id: 'arepa-blanca',
      name: 'arepa de maíz',
      category: 'carb',
      kcalPer100g: 200,
      proteinPer100g: 4,
      carbsPer100g: 43,
      fatsPer100g: 1.5,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'lunch', 'dinner', 'snack_am', 'snack_pm']
   },
   {
      id: 'granola',
      name: 'granola sin azúcar',
      category: 'carb',
      kcalPer100g: 450,
      proteinPer100g: 10,
      carbsPer100g: 65,
      fatsPer100g: 17,
      tags: ['mid', 'vegan'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'oats-bran',
      name: 'salvado de avena',
      category: 'carb',
      kcalPer100g: 246,
      proteinPer100g: 17,
      carbsPer100g: 66,
      fatsPer100g: 7,
      tags: ['cheap', 'vegan'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
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
      /* Sin appropriateMealTypes = válido en todas. */
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
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'lunch', 'dinner', 'snack_am', 'snack_pm']
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
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
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
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'almonds',
      name: 'almendras',
      category: 'fat',
      kcalPer100g: 579,
      proteinPer100g: 21,
      carbsPer100g: 22,
      fatsPer100g: 50,
      tags: ['mid', 'vegan'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'chia-seeds',
      name: 'semillas de chía',
      category: 'fat',
      kcalPer100g: 486,
      proteinPer100g: 17,
      carbsPer100g: 42,
      fatsPer100g: 31,
      tags: ['LATAM', 'mid', 'vegan'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },

   // === VEGETALES (default: válidos en todas) ===
   {
      id: 'broccoli',
      name: 'brócoli',
      category: 'vegetable',
      kcalPer100g: 34,
      proteinPer100g: 2.8,
      carbsPer100g: 7,
      fatsPer100g: 0.4,
      tags: ['cheap', 'vegan', 'gluten_free'],
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
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
      source: 'manual',
      appropriateMealTypes: ['lunch', 'dinner']
   },

   // === FRUTAS ===
   {
      id: 'banana',
      name: 'banana',
      category: 'fruit',
      kcalPer100g: 89,
      proteinPer100g: 1.1,
      carbsPer100g: 23,
      fatsPer100g: 0.3,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'apple',
      name: 'manzana',
      category: 'fruit',
      kcalPer100g: 52,
      proteinPer100g: 0.3,
      carbsPer100g: 14,
      fatsPer100g: 0.2,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'berries-mix',
      name: 'frutos rojos (mix)',
      category: 'fruit',
      kcalPer100g: 53,
      proteinPer100g: 0.7,
      carbsPer100g: 12,
      fatsPer100g: 0.3,
      tags: ['mid', 'vegan', 'gluten_free'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'mango',
      name: 'mango',
      category: 'fruit',
      kcalPer100g: 60,
      proteinPer100g: 0.8,
      carbsPer100g: 15,
      fatsPer100g: 0.4,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'papaya',
      name: 'papaya',
      category: 'fruit',
      kcalPer100g: 43,
      proteinPer100g: 0.5,
      carbsPer100g: 11,
      fatsPer100g: 0.3,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },
   {
      id: 'pineapple',
      name: 'piña',
      category: 'fruit',
      kcalPer100g: 50,
      proteinPer100g: 0.5,
      carbsPer100g: 13,
      fatsPer100g: 0.1,
      tags: ['LATAM', 'cheap', 'vegan', 'gluten_free'],
      source: 'manual',
      appropriateMealTypes: ['breakfast', 'snack_am', 'snack_pm']
   },

   // === CONDIMENTOS (libre uso, sin appropriateMealTypes = todas) ===
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
