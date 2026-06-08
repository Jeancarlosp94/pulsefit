import { describe, it, expect } from 'vitest'
import {
   computeMealTarget,
   filterIngredientPool,
   prioritizeByRegion,
   selectComponents,
   isWithinTolerance,
   buildUserPrompt,
   maxPrepTimeForUser,
   validateMealResponse,
   buildMealFallback,
   SEED_INGREDIENTS,
   SYSTEM_PROMPT,
   MEAL_DISTRIBUTION
} from './index'
import type { ItfMealComponents, ItfUserContextForMeal } from './types'

const baseCtx: ItfUserContextForMeal = {
   region: 'LATAM',
   goal: 'lose',
   dietaryRestrictions: [],
   allergies: '',
   dislikedFoods: [],
   budgetLevel: 'medium',
   cooksAtHome: 'sometimes'
}

describe('computeMealTarget', () => {
   it('lunch toma el 35% del target diario', () => {
      const target = computeMealTarget({
         dailyKcal: 2000,
         dailyProteinG: 140,
         dailyCarbsG: 200,
         dailyFatsG: 60,
         mealType: 'lunch'
      })
      expect(target.kcal).toBe(700)
      expect(target.proteinG).toBe(49)
   })

   it('snack_am toma el 5% del target diario', () => {
      const target = computeMealTarget({
         dailyKcal: 2000,
         dailyProteinG: 140,
         dailyCarbsG: 200,
         dailyFatsG: 60,
         mealType: 'snack_am'
      })
      expect(target.kcal).toBe(100)
   })

   it('los 5 ratios suman 100%', () => {
      const sum = Object.values(MEAL_DISTRIBUTION).reduce((a, b) => a + b, 0)
      expect(Math.round(sum * 100) / 100).toBe(1)
   })
})

describe('filterIngredientPool', () => {
   it('vegan excluye carne, lácteos, huevo, pescado', () => {
      const pool = filterIngredientPool(SEED_INGREDIENTS, {
         ...baseCtx,
         dietaryRestrictions: ['vegan']
      })
      const tags = pool.flatMap((p) => p.tags.map((t) => t.toLowerCase()))
      expect(tags).not.toContain('meat')
      expect(tags).not.toContain('fish')
      expect(tags).not.toContain('egg')
   })

   it('low budget mantiene solo cheap o sin tag de precio', () => {
      const pool = filterIngredientPool(SEED_INGREDIENTS, {
         ...baseCtx,
         budgetLevel: 'low'
      })
      pool.forEach((p) => {
         const price = p.tags.find((t) => t === 'cheap' || t === 'mid' || t === 'expensive')
         expect(price === undefined || price === 'cheap').toBe(true)
      })
   })

   it('excluye disliked_foods por nombre exacto', () => {
      const pool = filterIngredientPool(SEED_INGREDIENTS, {
         ...baseCtx,
         dislikedFoods: ['huevos']
      })
      expect(pool.find((p) => p.id === 'eggs')).toBeUndefined()
   })

   it('excluye ingrediente cuyo nombre contiene una alergia', () => {
      const pool = filterIngredientPool(SEED_INGREDIENTS, {
         ...baseCtx,
         allergies: 'maní, nueces'
      })
      expect(pool.find((p) => p.name.includes('maní'))).toBeUndefined()
      expect(pool.find((p) => p.name.includes('nueces'))).toBeUndefined()
   })

   it('siempre devuelve solo ingredientes con macros > 0', () => {
      const pool = filterIngredientPool(SEED_INGREDIENTS, baseCtx)
      pool.forEach((p) => expect(p.kcalPer100g).toBeGreaterThan(0))
   })
})

describe('prioritizeByRegion', () => {
   it('LATAM trae primero los ingredientes con tag LATAM', () => {
      const sorted = prioritizeByRegion(SEED_INGREDIENTS, 'LATAM')
      const firstFew = sorted.slice(0, 5)
      const latamCount = firstFew.filter((p) => p.tags.includes('LATAM')).length
      expect(latamCount).toBeGreaterThanOrEqual(4)
   })
})

describe('selectComponents', () => {
   const pool = filterIngredientPool(SEED_INGREDIENTS, baseCtx)
   const target = { kcal: 700, proteinG: 49, carbsG: 70, fatsG: 21 }

   it('devuelve protein, carb, fat y vegetable', () => {
      const result = selectComponents({ pool, target })
      expect(result).not.toBeNull()
      if (result) {
         expect(result.protein.ingredient.category).toBe('protein')
         expect(result.carb.ingredient.category).toBe('carb')
         expect(result.fat.ingredient.category).toBe('fat')
      }
   })

   it('los gramos están entre 30 y 400', () => {
      const result = selectComponents({ pool, target })
      if (result) {
         expect(result.protein.grams).toBeGreaterThanOrEqual(30)
         expect(result.protein.grams).toBeLessThanOrEqual(400)
         expect(result.carb.grams).toBeGreaterThanOrEqual(30)
         expect(result.fat.grams).toBeGreaterThanOrEqual(30)
      }
   })

   it('cantidades redondeadas a múltiplos de 5', () => {
      const result = selectComponents({ pool, target })
      if (result) {
         expect(result.protein.grams % 5).toBe(0)
         expect(result.carb.grams % 5).toBe(0)
         expect(result.fat.grams % 5).toBe(0)
      }
   })

   it('devuelve null si no hay proteínas en el pool', () => {
      const noProtein = pool.filter((p) => p.category !== 'protein')
      const result = selectComponents({ pool: noProtein, target })
      expect(result).toBeNull()
   })

   it('actualMacros refleja la combinación real (no el target)', () => {
      const result = selectComponents({ pool, target })
      if (result) {
         expect(result.actualMacros.kcal).toBeGreaterThan(0)
         expect(result.actualMacros.proteinG).toBeGreaterThan(0)
      }
   })
})

describe('isWithinTolerance', () => {
   it('±15% de kcal y proteína pasa', () => {
      expect(
         isWithinTolerance(
            { kcal: 700, proteinG: 49, carbsG: 70, fatsG: 21 },
            { kcal: 740, proteinG: 52, carbsG: 75, fatsG: 22 }
         )
      ).toBe(true)
   })

   it('30% de exceso falla', () => {
      expect(
         isWithinTolerance(
            { kcal: 700, proteinG: 49, carbsG: 70, fatsG: 21 },
            { kcal: 900, proteinG: 49, carbsG: 70, fatsG: 21 }
         )
      ).toBe(false)
   })
})

describe('buildUserPrompt', () => {
   const dummyComponents: ItfMealComponents = {
      protein: { ingredient: SEED_INGREDIENTS[0], grams: 150 },
      carb: {
         ingredient: SEED_INGREDIENTS.find((i) => i.id === 'rice-white')!,
         grams: 100
      },
      fat: {
         ingredient: SEED_INGREDIENTS.find((i) => i.id === 'olive-oil')!,
         grams: 10
      },
      vegetable: {
         ingredient: SEED_INGREDIENTS.find((i) => i.id === 'broccoli')!,
         grams: 150
      },
      condiments: [],
      actualMacros: { kcal: 600, proteinG: 45, carbsG: 65, fatsG: 25 }
   }

   it('incluye los 4 ingredientes con gramos exactos', () => {
      const prompt = buildUserPrompt({
         components: dummyComponents,
         mealType: 'lunch',
         ctx: baseCtx,
         maxPrepTime: 25
      })
      expect(prompt).toContain('pechuga de pollo: 150g')
      expect(prompt).toContain('arroz blanco cocido: 100g')
      expect(prompt).toContain('brócoli: 150g')
   })

   it('pide JSON con la estructura esperada y 3 opciones', () => {
      const prompt = buildUserPrompt({
         components: dummyComponents,
         mealType: 'lunch',
         ctx: baseCtx,
         maxPrepTime: 25
      })
      expect(prompt).toContain('EXACTAMENTE 3 elementos')
      expect(prompt).toContain('"options"')
   })

   it('maxPrepTimeForUser usa 15/25/35 según cooksAtHome', () => {
      expect(maxPrepTimeForUser({ ...baseCtx, cooksAtHome: 'rarely' })).toBe(15)
      expect(maxPrepTimeForUser({ ...baseCtx, cooksAtHome: 'sometimes' })).toBe(25)
      expect(maxPrepTimeForUser({ ...baseCtx, cooksAtHome: 'yes' })).toBe(35)
   })

   it('SYSTEM_PROMPT incluye las reglas inviolables', () => {
      expect(SYSTEM_PROMPT).toContain('NUNCA agregas ingredientes nuevos')
      expect(SYSTEM_PROMPT).toContain('NUNCA modificas cantidades')
      expect(SYSTEM_PROMPT).toContain('SOLO JSON válido')
   })
})

describe('validateMealResponse', () => {
   const allowed = ['pechuga de pollo', 'arroz blanco cocido', 'brócoli', 'aceite de oliva']

   const validJson = JSON.stringify({
      options: [
         {
            name: 'Bowl de pollo con arroz',
            description: 'Plato simple y nutritivo, listo en 25 min.',
            prep_time_min: 25,
            difficulty: 'easy',
            steps: [
               'Cocina el arroz blanco hasta su punto con sal.',
               'Sazona el pollo con sal pimienta y ajo al gusto.',
               'Cocina el pollo a la plancha 6 a 8 minutos.',
               'Sirve el bowl con brócoli al vapor y limón.'
            ]
         },
         {
            name: 'Salteado al ajillo con pollo y brócoli',
            description: 'Estilo wok rápido y aromático.',
            prep_time_min: 20,
            difficulty: 'easy',
            steps: [
               'Pica ajo finito y dora ligeramente en aceite de oliva.',
               'Suma el pollo en cubos y dora hasta sellar bien.',
               'Agrega brócoli y saltea 3 minutos para que quede crujiente.',
               'Incorpora arroz cocido y mezcla con sal y limón.'
            ]
         },
         {
            name: 'Pollo plancha con guarnición de arroz',
            description: 'Versión simple, balanceada y digestiva.',
            prep_time_min: 22,
            difficulty: 'easy',
            steps: [
               'Cocina el arroz con un toque de sal y aceite de oliva.',
               'Plancha el pollo con sal pimienta y ajo 4 min por lado.',
               'Cuece el brócoli al vapor hasta brillo verde.',
               'Sirve en plato con un toque de limón fresco.'
            ]
         }
      ]
   })

   it('JSON válido pasa la validación', () => {
      const r = validateMealResponse({ raw: validJson, allowedIngredients: allowed })
      expect(r.valid).toBe(true)
   })

   it('JSON malformado falla con invalid_json', () => {
      const r = validateMealResponse({
         raw: '{ esto no es json }',
         allowedIngredients: allowed
      })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('invalid_json')
   })

   it('2 opciones falla con wrong_option_count', () => {
      const bad = JSON.stringify({ options: [{ name: 'x' }, { name: 'y' }] })
      const r = validateMealResponse({ raw: bad, allowedIngredients: allowed })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('wrong_option_count')
   })

   it('option sin steps falla con missing_fields', () => {
      const bad = JSON.stringify({
         options: [
            { name: 'A', description: 'd', prep_time_min: 10, difficulty: 'easy' },
            { name: 'B', description: 'd', prep_time_min: 10, difficulty: 'easy' },
            { name: 'C', description: 'd', prep_time_min: 10, difficulty: 'easy' }
         ]
      })
      const r = validateMealResponse({ raw: bad, allowedIngredients: allowed })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('missing_fields')
   })

   it('prep_time_min fuera de rango falla', () => {
      const bad = JSON.stringify({
         options: [
            {
               name: 'X',
               description: 'D',
               prep_time_min: 120,
               difficulty: 'easy',
               steps: ['abcdefghij', 'klmnopqrst']
            },
            {
               name: 'X',
               description: 'D',
               prep_time_min: 20,
               difficulty: 'easy',
               steps: ['abcdefghij', 'klmnopqrst']
            },
            {
               name: 'X',
               description: 'D',
               prep_time_min: 20,
               difficulty: 'easy',
               steps: ['abcdefghij', 'klmnopqrst']
            }
         ]
      })
      const r = validateMealResponse({ raw: bad, allowedIngredients: allowed })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('prep_time_out_of_range')
   })

   it('palabra prohibida en steps falla', () => {
      const bad = JSON.stringify({
         options: [
            {
               name: 'Plato A',
               description: 'D',
               prep_time_min: 20,
               difficulty: 'easy',
               steps: [
                  'Esto te ayuda a tonificar tu cuerpo en poco tiempo.',
                  'Mezcla todo y sirve caliente con limón.'
               ]
            },
            {
               name: 'X',
               description: 'D',
               prep_time_min: 20,
               difficulty: 'easy',
               steps: ['abcdefghij', 'klmnopqrst']
            },
            {
               name: 'X',
               description: 'D',
               prep_time_min: 20,
               difficulty: 'easy',
               steps: ['abcdefghij', 'klmnopqrst']
            }
         ]
      })
      const r = validateMealResponse({ raw: bad, allowedIngredients: allowed })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('forbidden_words')
   })

   it('introducir queso (no permitido) falla con unknown_ingredient', () => {
      const bad = JSON.stringify({
         options: [
            {
               name: 'Plato A',
               description: 'Pollo con queso parmesano y arroz.',
               prep_time_min: 20,
               difficulty: 'easy',
               steps: [
                  'Cocina el pollo a la plancha con aceite de oliva 6 minutos.',
                  'Sirve sobre arroz blanco con queso parmesano rallado encima.'
               ]
            },
            {
               name: 'X',
               description: 'D',
               prep_time_min: 20,
               difficulty: 'easy',
               steps: ['abcdefghij', 'klmnopqrst']
            },
            {
               name: 'X',
               description: 'D',
               prep_time_min: 20,
               difficulty: 'easy',
               steps: ['abcdefghij', 'klmnopqrst']
            }
         ]
      })
      const r = validateMealResponse({ raw: bad, allowedIngredients: allowed })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('unknown_ingredient')
   })

   it('difficulty inválida falla', () => {
      const bad = JSON.stringify({
         options: [
            {
               name: 'A',
               description: 'd',
               prep_time_min: 20,
               difficulty: 'super-hard',
               steps: ['abcdefghij', 'klmnopqrst']
            },
            {
               name: 'X',
               description: 'D',
               prep_time_min: 20,
               difficulty: 'easy',
               steps: ['abcdefghij', 'klmnopqrst']
            },
            {
               name: 'X',
               description: 'D',
               prep_time_min: 20,
               difficulty: 'easy',
               steps: ['abcdefghij', 'klmnopqrst']
            }
         ]
      })
      const r = validateMealResponse({ raw: bad, allowedIngredients: allowed })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('bad_difficulty')
   })
})

describe('buildMealFallback', () => {
   const pool = filterIngredientPool(SEED_INGREDIENTS, baseCtx)
   const components = selectComponents({
      pool,
      target: { kcal: 700, proteinG: 49, carbsG: 70, fatsG: 21 }
   })

   it('devuelve siempre exactamente 3 opciones', () => {
      if (!components) throw new Error('selector falló en tests setup')
      const options = buildMealFallback(components, 'lunch')
      expect(options).toHaveLength(3)
   })

   it('cada opción tiene name, description, prep_time_min, difficulty, steps', () => {
      if (!components) throw new Error('selector falló')
      const options = buildMealFallback(components, 'lunch')
      options.forEach((opt) => {
         expect(opt.name).toBeTruthy()
         expect(opt.description).toBeTruthy()
         expect(opt.prep_time_min).toBeGreaterThanOrEqual(5)
         expect(opt.prep_time_min).toBeLessThanOrEqual(60)
         expect(opt.steps.length).toBeGreaterThanOrEqual(2)
         expect(opt.steps.length).toBeLessThanOrEqual(10)
      })
   })

   it('los nombres son distintos entre las 3 opciones', () => {
      if (!components) throw new Error('selector falló')
      const options = buildMealFallback(components, 'lunch')
      const names = new Set(options.map((o) => o.name))
      expect(names.size).toBe(3)
   })

   it('respuestas del fallback pasan la validación del propio motor', () => {
      if (!components) throw new Error('selector falló')
      const options = buildMealFallback(components, 'lunch')
      const allowedNames = [
         components.protein.ingredient.name,
         components.carb.ingredient.name,
         components.fat.ingredient.name,
         components.vegetable.ingredient.name
      ]
      const raw = JSON.stringify({ options })
      const r = validateMealResponse({ raw, allowedIngredients: allowedNames })
      expect(r.valid).toBe(true)
   })
})
