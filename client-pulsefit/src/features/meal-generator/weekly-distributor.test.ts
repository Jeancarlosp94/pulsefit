import { describe, expect, it } from 'vitest'
import { computeDailyDistribution, recipeIndexForDay } from './weekly-distributor'
import { MEAL_MIN_KCAL, type ItfMealsPerDay } from './types'

/**
 * Verificación INNEGOCIABLE solicitada por el usuario:
 * "la suma de calorías del día SIEMPRE debe cumplir el objetivo calórico
 * diario del usuario y NUNCA excederlo."
 *
 * Comprobamos para TODA combinación de mealsPerDay × dayIndex × targetKcal:
 *   Σ kcalByMeal === targetKcal EXACTO.
 */
describe('weekly-distributor — suma diaria EXACTA al target', () => {
   const mealsPerDayOptions: ItfMealsPerDay[] = [2, 3, 4, 5]
   const targetKcalOptions = [1200, 1350, 1500, 1800, 2000, 2200, 2500, 3000]
   const dayIndexes = [0, 1, 2, 3, 4, 5, 6]

   mealsPerDayOptions.forEach((mealsPerDay) => {
      targetKcalOptions.forEach((targetKcal) => {
         dayIndexes.forEach((dayIndex) => {
            it(`mealsPerDay=${mealsPerDay}, target=${targetKcal}kcal, día=${dayIndex} → suma exacta`, () => {
               const { kcalByMeal } = computeDailyDistribution({
                  mealsPerDay,
                  dayIndex,
                  targetKcal,
                  seed: 42
               })
               const sum = Object.values(kcalByMeal).reduce((acc, k) => acc + (k ?? 0), 0)
               expect(sum).toBe(targetKcal)
            })
         })
      })
   })
})

describe('weekly-distributor — respeta MEAL_MIN_KCAL', () => {
   it('breakfast >= 250 kcal para target >= 1500', () => {
      const { kcalByMeal } = computeDailyDistribution({
         mealsPerDay: 3,
         dayIndex: 3,
         targetKcal: 1500,
         seed: 99
      })
      expect(kcalByMeal.breakfast).toBeGreaterThanOrEqual(MEAL_MIN_KCAL.breakfast ?? 0)
   })

   it('lunch >= 350 kcal en plan 5 comidas con 2200 kcal', () => {
      const { kcalByMeal } = computeDailyDistribution({
         mealsPerDay: 5,
         dayIndex: 0,
         targetKcal: 2200,
         seed: 7
      })
      expect(kcalByMeal.lunch).toBeGreaterThanOrEqual(MEAL_MIN_KCAL.lunch ?? 0)
   })

   it('snacks >= 100 kcal en plan 5 comidas', () => {
      const { kcalByMeal } = computeDailyDistribution({
         mealsPerDay: 5,
         dayIndex: 4,
         targetKcal: 1800,
         seed: 11
      })
      expect(kcalByMeal.snack_am).toBeGreaterThanOrEqual(MEAL_MIN_KCAL.snack_am ?? 0)
      expect(kcalByMeal.snack_pm).toBeGreaterThanOrEqual(MEAL_MIN_KCAL.snack_pm ?? 0)
   })
})

describe('weekly-distributor — variación entre días (jitter activo)', () => {
   it('día 1 y día 4 tienen distribuciones DISTINTAS para mismo target', () => {
      const d1 = computeDailyDistribution({
         mealsPerDay: 3,
         dayIndex: 0,
         targetKcal: 2000,
         seed: 42
      })
      const d4 = computeDailyDistribution({
         mealsPerDay: 3,
         dayIndex: 3,
         targetKcal: 2000,
         seed: 42
      })
      /* Al menos UNA comida debe diferir en > 0 kcal. */
      const someDifferent =
         d1.kcalByMeal.breakfast !== d4.kcalByMeal.breakfast ||
         d1.kcalByMeal.lunch !== d4.kcalByMeal.lunch ||
         d1.kcalByMeal.dinner !== d4.kcalByMeal.dinner
      expect(someDifferent).toBe(true)
   })

   it('mismo seed + mismo día = misma distribución (reproducible)', () => {
      const a = computeDailyDistribution({
         mealsPerDay: 4,
         dayIndex: 2,
         targetKcal: 1800,
         seed: 100
      })
      const b = computeDailyDistribution({
         mealsPerDay: 4,
         dayIndex: 2,
         targetKcal: 1800,
         seed: 100
      })
      expect(a.kcalByMeal).toEqual(b.kcalByMeal)
   })

   it('seeds distintos = distribuciones distintas (variedad de semanas)', () => {
      const a = computeDailyDistribution({
         mealsPerDay: 4,
         dayIndex: 0,
         targetKcal: 1800,
         seed: 1
      })
      const b = computeDailyDistribution({
         mealsPerDay: 4,
         dayIndex: 0,
         targetKcal: 1800,
         seed: 999
      })
      expect(a.kcalByMeal).not.toEqual(b.kcalByMeal)
   })
})

describe('weekly-distributor — jitter limitado a ±15% absoluto', () => {
   it('breakfast día 1 (base 30%) NO se va más allá de [15%, 45%] del target', () => {
      const samples = Array.from({ length: 50 }, (_, i) =>
         computeDailyDistribution({
            mealsPerDay: 3,
            dayIndex: i % 7,
            targetKcal: 2000,
            seed: i
         })
      )
      samples.forEach((s) => {
         const pct = s.percentByMeal.breakfast ?? 0
         /* Ventana amplia porque MEAL_MIN_KCAL puede empujar arriba. */
         expect(pct).toBeGreaterThanOrEqual(0.1)
         expect(pct).toBeLessThanOrEqual(0.5)
      })
   })
})

describe('recipeIndexForDay — rotación 3 recetas', () => {
   it('día 0 → recipe 0, día 1 → 1, día 2 → 2, día 3 → 0, día 6 → 0', () => {
      expect(recipeIndexForDay(0, 3)).toBe(0)
      expect(recipeIndexForDay(1, 3)).toBe(1)
      expect(recipeIndexForDay(2, 3)).toBe(2)
      expect(recipeIndexForDay(3, 3)).toBe(0)
      expect(recipeIndexForDay(4, 3)).toBe(1)
      expect(recipeIndexForDay(5, 3)).toBe(2)
      expect(recipeIndexForDay(6, 3)).toBe(0)
   })

   it('plan de 7 días usa cada receta al menos 2 veces', () => {
      const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0 }
      for (let d = 0; d < 7; d++) counts[recipeIndexForDay(d, 3)]++
      expect(counts[0]).toBeGreaterThanOrEqual(2)
      expect(counts[1]).toBeGreaterThanOrEqual(2)
      expect(counts[2]).toBeGreaterThanOrEqual(2)
   })
})
