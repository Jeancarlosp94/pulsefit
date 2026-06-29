import { describe, it, expect } from 'vitest'
import { computeTodayState, getTimeGreeting, getContextMessage } from './today-state'
import type { ItfMealLog, ItfMealPlan } from '@/interface/itfMeals'

const makePlan = (overrides: Partial<ItfMealPlan> = {}): ItfMealPlan => ({
   id: 'plan-1',
   user_id: 'u',
   created_at: new Date('2026-06-10T00:00:00Z').toISOString(),
   days: 7,
   meals_per_day: 3,
   target_kcal: 2000,
   target_protein_g: 140,
   target_carbs_g: 200,
   target_fats_g: 60,
   excluded_ingredient_ids: [],
   recipes_by_meal_type: {
      breakfast: [
         {
            name: 'Avena con palta',
            description: 'Desayuno',
            prep_time_min: 10,
            difficulty: 'easy',
            steps: ['paso 1', 'paso 2'],
            baseKcal: 600,
            source: 'ai',
            components: {
               protein: { id: 'eggs', name: 'huevos', grams: 100 },
               carb: { id: 'oats', name: 'avena', grams: 50 },
               fat: { id: 'avocado', name: 'aguacate', grams: 30 },
               vegetable: null,
               actualMacros: { kcal: 600, proteinG: 42, carbsG: 60, fatsG: 18 }
            }
         }
      ],
      lunch: [
         {
            name: 'Pollo con arroz',
            description: 'Almuerzo',
            prep_time_min: 25,
            difficulty: 'easy',
            steps: ['paso 1', 'paso 2'],
            baseKcal: 800,
            source: 'ai',
            components: {
               protein: { id: 'chicken-breast', name: 'pollo', grams: 150 },
               carb: { id: 'rice-white', name: 'arroz', grams: 80 },
               fat: { id: 'olive-oil', name: 'aceite', grams: 10 },
               vegetable: { id: 'broccoli', name: 'brócoli', grams: 100 },
               actualMacros: { kcal: 800, proteinG: 56, carbsG: 80, fatsG: 24 }
            }
         }
      ]
   },
   daily_schedule: [
      {
         day: 1,
         totalKcal: 1400,
         meals: {
            breakfast: {
               recipeIdx: 0,
               scaledKcal: 600,
               scaledGrams: { protein: 100, carb: 50, fat: 30, vegetable: 0 }
            },
            lunch: {
               recipeIdx: 0,
               scaledKcal: 800,
               scaledGrams: { protein: 150, carb: 80, fat: 10, vegetable: 100 }
            }
         }
      }
   ],
   source: 'ai',
   ...overrides
})

/* Default logged_at MATCHEA con el `now` por default de los tests
 * (2026-06-10T22:00:00Z). NO uses new Date() — los tests deben ser
 * reproducibles independiente de la fecha de ejecución. */
const makeLog = (overrides: Partial<ItfMealLog> = {}): ItfMealLog => ({
   id: 'log-1',
   user_id: 'u',
   logged_at: '2026-06-10T22:00:00Z',
   plan_id: 'plan-1',
   day_index: 0,
   meal_type: 'breakfast',
   status: 'planned',
   recipe_name: 'Avena con palta',
   kcal: 600,
   protein_g: 42,
   carbs_g: 60,
   fats_g: 18,
   notes: null,
   ...overrides
})

describe('computeTodayState — sin plan', () => {
   it('devuelve estado vacío cuando no hay plan', () => {
      const state = computeTodayState({ plan: null, logs: [] })
      expect(state.hasPlan).toBe(false)
      expect(state.dayIndex).toBeNull()
      expect(state.meals).toEqual([])
      expect(state.consumed).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 })
   })
})

describe('computeTodayState — con plan, sin logs', () => {
   it('todas las comidas en estado pending', () => {
      const plan = makePlan()
      const now = new Date('2026-06-10T12:00:00Z') /* mismo día que created_at */
      const state = computeTodayState({ plan, logs: [], now })
      expect(state.hasPlan).toBe(true)
      expect(state.dayIndex).toBe(0)
      expect(state.meals).toHaveLength(2)
      expect(state.meals.every((m) => m.status === 'pending')).toBe(true)
      expect(state.consumed.kcal).toBe(0)
   })
})

describe('computeTodayState — con logs del día', () => {
   it('marca comidas registradas y acumula macros consumidos', () => {
      const plan = makePlan()
      const now = new Date('2026-06-10T20:00:00Z')
      const logs = [
         makeLog({
            logged_at: new Date('2026-06-10T09:00:00Z').toISOString(),
            meal_type: 'breakfast',
            status: 'planned',
            kcal: 600,
            protein_g: 42,
            carbs_g: 60,
            fats_g: 18
         })
      ]
      const state = computeTodayState({ plan, logs, now })
      const breakfast = state.meals.find((m) => m.meal_type === 'breakfast')
      const lunch = state.meals.find((m) => m.meal_type === 'lunch')
      expect(breakfast?.status).toBe('planned')
      expect(lunch?.status).toBe('pending')
      expect(state.consumed.kcal).toBe(600)
      expect(state.consumed.proteinG).toBe(42)
   })

   it('comidas skipped NO suman a consumed', () => {
      const plan = makePlan()
      const now = new Date('2026-06-10T20:00:00Z')
      const logs = [
         makeLog({
            logged_at: new Date('2026-06-10T09:00:00Z').toISOString(),
            meal_type: 'breakfast',
            status: 'skipped'
         })
      ]
      const state = computeTodayState({ plan, logs, now })
      expect(state.consumed.kcal).toBe(0)
   })

   it('logs de OTRO día NO cuentan', () => {
      const plan = makePlan()
      const now = new Date('2026-06-10T20:00:00Z')
      const logs = [
         makeLog({
            logged_at: new Date('2026-06-09T09:00:00Z').toISOString(),
            meal_type: 'breakfast',
            status: 'planned'
         })
      ]
      const state = computeTodayState({ plan, logs, now })
      expect(state.meals.find((m) => m.meal_type === 'breakfast')?.status).toBe('pending')
      expect(state.consumed.kcal).toBe(0)
   })
})

describe('computeTodayState — rotación de día', () => {
   it('al pasar 7 días, dayIndex vuelve a 0', () => {
      const plan = makePlan({
         created_at: new Date('2026-06-03T00:00:00Z').toISOString()
      })
      const now = new Date('2026-06-10T12:00:00Z') /* +7 días */
      const state = computeTodayState({ plan, logs: [], now })
      expect(state.dayIndex).toBe(0)
   })

   it('día 3 después de creación', () => {
      const plan = makePlan({
         created_at: new Date('2026-06-07T00:00:00Z').toISOString()
      })
      const now = new Date('2026-06-10T12:00:00Z') /* +3 días */
      const state = computeTodayState({ plan, logs: [], now })
      expect(state.dayIndex).toBe(3)
   })
})

describe('getTimeGreeting', () => {
   it('madrugada → "¿Madrugaste?"', () => {
      expect(getTimeGreeting(3)).toBe('¿Madrugaste?')
   })
   it('mañana → "Buenos días"', () => {
      expect(getTimeGreeting(9)).toBe('Buenos días')
   })
   it('tarde → "Buenas tardes"', () => {
      expect(getTimeGreeting(15)).toBe('Buenas tardes')
   })
   it('noche → "Buenas noches"', () => {
      expect(getTimeGreeting(21)).toBe('Buenas noches')
   })
})

describe('getContextMessage', () => {
   it('sin plan → mensaje invitando a generar', () => {
      const msg = getContextMessage({
         hasPlan: false,
         dayIndex: null,
         targetKcal: 0,
         targetProteinG: 0,
         targetCarbsG: 0,
         targetFatsG: 0,
         meals: [],
         consumed: { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 }
      })
      expect(msg).toContain('Generemos')
   })

   it('día completo → "¡Día completo!"', () => {
      const plan = makePlan()
      const now = new Date('2026-06-10T22:00:00Z')
      const logs = [
         makeLog({ meal_type: 'breakfast', status: 'planned' }),
         makeLog({ id: 'l2', meal_type: 'lunch', status: 'planned' })
      ]
      const state = computeTodayState({ plan, logs, now })
      expect(getContextMessage(state)).toContain('completo')
   })
})
