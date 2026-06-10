import { describe, it, expect } from 'vitest'
import { buildShoppingList, shoppingListToPlainText, formatQuantity } from './shopping-list'
import type { ItfMealPlan } from '@/interface/itfMeals'

const stubPlan: ItfMealPlan = {
   id: 'test',
   user_id: 'u',
   created_at: '2026-06-12',
   days: 7,
   meals_per_day: 3,
   target_kcal: 2000,
   target_protein_g: 140,
   target_carbs_g: 200,
   target_fats_g: 60,
   excluded_ingredient_ids: [],
   recipes_by_meal_type: {
      lunch: [
         {
            name: 'Pollo con arroz',
            description: 'Plato base',
            prep_time_min: 20,
            difficulty: 'easy',
            steps: ['paso 1', 'paso 2'],
            baseKcal: 700,
            source: 'ai',
            components: {
               protein: { id: 'chicken-breast', name: 'pechuga de pollo', grams: 150 },
               carb: { id: 'rice-white', name: 'arroz blanco cocido', grams: 80 },
               fat: { id: 'olive-oil', name: 'aceite de oliva', grams: 10 },
               vegetable: { id: 'broccoli', name: 'brócoli', grams: 100 },
               actualMacros: { kcal: 700, proteinG: 49, carbsG: 70, fatsG: 21 }
            }
         }
      ]
   },
   daily_schedule: [
      {
         day: 1,
         totalKcal: 700,
         meals: {
            lunch: {
               recipeIdx: 0,
               scaledKcal: 700,
               scaledGrams: { protein: 150, carb: 80, fat: 10, vegetable: 100 }
            }
         }
      },
      {
         day: 2,
         totalKcal: 700,
         meals: {
            lunch: {
               recipeIdx: 0,
               scaledKcal: 700,
               scaledGrams: { protein: 150, carb: 80, fat: 10, vegetable: 100 }
            }
         }
      }
   ],
   source: 'ai'
}

describe('buildShoppingList — agregación correcta', () => {
   it('suma gramos a través de los días por ingrediente', () => {
      const list = buildShoppingList({ plan: stubPlan })
      const chicken = list.bySection
         .flatMap((s) => s.items)
         .find((i) => i.ingredientId === 'chicken-breast')
      expect(chicken).toBeDefined()
      /* 2 días × 150g = 300g. */
      expect(chicken?.totalGrams).toBe(300)
   })

   it('agrupa items en las secciones correctas', () => {
      const list = buildShoppingList({ plan: stubPlan })
      const sectionsMap = new Map(list.bySection.map((s) => [s.section, s.items]))
      expect(sectionsMap.get('carniceria')?.[0]?.ingredientId).toBe('chicken-breast')
      expect(sectionsMap.get('verduras')?.[0]?.ingredientId).toBe('broccoli')
      expect(sectionsMap.get('abarrotes')?.some((i) => i.ingredientId === 'rice-white')).toBe(true)
      expect(sectionsMap.get('abarrotes')?.some((i) => i.ingredientId === 'olive-oil')).toBe(true)
   })

   it('familyMultiplier multiplica las cantidades', () => {
      const list1 = buildShoppingList({ plan: stubPlan, familyMultiplier: 1 })
      const list4 = buildShoppingList({ plan: stubPlan, familyMultiplier: 4 })
      const chicken1 = list1.bySection
         .flatMap((s) => s.items)
         .find((i) => i.ingredientId === 'chicken-breast')
      const chicken4 = list4.bySection
         .flatMap((s) => s.items)
         .find((i) => i.ingredientId === 'chicken-breast')
      expect(chicken4!.totalGrams).toBe(chicken1!.totalGrams * 4)
   })

   it('itemCount cuenta ingredientes ÚNICOS, no apariciones', () => {
      const list = buildShoppingList({ plan: stubPlan })
      expect(list.itemCount).toBe(4) /* pollo + arroz + oliva + brócoli */
   })

   it('legumbres (atún, lentejas, garbanzos, frijoles) van a su sección', () => {
      const planWithTuna: ItfMealPlan = {
         ...stubPlan,
         recipes_by_meal_type: {
            lunch: [
               {
                  ...stubPlan.recipes_by_meal_type.lunch![0],
                  components: {
                     ...stubPlan.recipes_by_meal_type.lunch![0].components,
                     protein: { id: 'tuna-can', name: 'atún al agua en lata', grams: 100 }
                  }
               }
            ]
         },
         daily_schedule: [stubPlan.daily_schedule[0]]
      }
      const list = buildShoppingList({ plan: planWithTuna })
      const legumbres = list.bySection.find((s) => s.section === 'legumbres')
      expect(legumbres?.items.some((i) => i.ingredientId === 'tuna-can')).toBe(true)
   })

   it('lácteos (queso fresco, yogurt) van a su sección', () => {
      const planWithDairy: ItfMealPlan = {
         ...stubPlan,
         recipes_by_meal_type: {
            lunch: [
               {
                  ...stubPlan.recipes_by_meal_type.lunch![0],
                  components: {
                     ...stubPlan.recipes_by_meal_type.lunch![0].components,
                     protein: { id: 'queso-fresco', name: 'queso fresco', grams: 60 }
                  }
               }
            ]
         },
         daily_schedule: [stubPlan.daily_schedule[0]]
      }
      const list = buildShoppingList({ plan: planWithDairy })
      const lacteos = list.bySection.find((s) => s.section === 'lacteos')
      expect(lacteos?.items.some((i) => i.ingredientId === 'queso-fresco')).toBe(true)
   })
})

describe('formatQuantity — unidades humanas', () => {
   it('huevos: 1 huevo = ~55g → "1 huevo (~55g)"', () => {
      expect(formatQuantity('eggs', 55)).toContain('huevo')
   })

   it('huevos: 7 huevos cuando hay 385g', () => {
      const result = formatQuantity('eggs', 385)
      expect(result).toContain('7 huevos')
   })

   it('arroz: vendido por peso, se muestra como kg/g', () => {
      const result500 = formatQuantity('rice-white', 500)
      expect(result500).toContain('500')
      const result1500 = formatQuantity('rice-white', 1500)
      expect(result1500).toContain('kg')
   })

   it('ingredient desconocido cae a gramos', () => {
      const result = formatQuantity('inventado', 250)
      expect(result).toBe('250 g')
   })
})

describe('shoppingListToPlainText — formato WhatsApp-friendly', () => {
   it('incluye encabezado con días', () => {
      const list = buildShoppingList({ plan: stubPlan })
      const text = shoppingListToPlainText(list)
      expect(text).toContain('7 días')
   })

   it('marca el multiplicador familia si es > 1', () => {
      const list = buildShoppingList({ plan: stubPlan, familyMultiplier: 4 })
      const text = shoppingListToPlainText(list)
      expect(text).toContain('× 4 personas')
   })

   it('incluye los emojis de sección', () => {
      const list = buildShoppingList({ plan: stubPlan })
      const text = shoppingListToPlainText(list)
      expect(text).toContain('🥩')
      expect(text).toContain('🥬')
   })
})
