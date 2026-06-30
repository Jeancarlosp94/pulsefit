import { describe, it, expect } from 'vitest'
import { filterIngredientPool } from './ingredient-pool'
import { SEED_INGREDIENTS } from './seed-ingredients'
import type { ItfUserContextForMeal } from './types'

const baseCtx = (overrides: Partial<ItfUserContextForMeal> = {}): ItfUserContextForMeal => ({
   region: 'LATAM',
   goal: 'lose',
   dietaryRestrictions: [],
   allergies: '',
   dislikedFoods: [],
   budgetLevel: 'medium',
   cooksAtHome: 'yes',
   mealsPerDay: 3,
   ...overrides
})

describe('filterIngredientPool — Sprint 11.8A condiciones médicas', () => {
   it('hipertension excluye ingredientes high_sodium (atún en lata)', () => {
      const pool = filterIngredientPool(
         SEED_INGREDIENTS,
         baseCtx({ medicalConditions: ['hipertension'] })
      )
      const ids = pool.map((p) => p.id)
      expect(ids).not.toContain('tuna-can')
   })

   it('diabetes excluye simple_carb (arroz blanco, papa)', () => {
      const pool = filterIngredientPool(
         SEED_INGREDIENTS,
         baseCtx({ medicalConditions: ['diabetes'] })
      )
      const ids = pool.map((p) => p.id)
      expect(ids).not.toContain('rice-white')
      expect(ids).not.toContain('potato')
   })

   it('diabetes excluye high_sugar (banana, plátano maduro)', () => {
      const pool = filterIngredientPool(
         SEED_INGREDIENTS,
         baseCtx({ medicalConditions: ['diabetes'] })
      )
      const ids = pool.map((p) => p.id)
      expect(ids).not.toContain('banana')
      expect(ids).not.toContain('plantain')
   })

   it('sin condiciones médicas no filtra los tags médicos', () => {
      const pool = filterIngredientPool(SEED_INGREDIENTS, baseCtx())
      const ids = pool.map((p) => p.id)
      expect(ids).toContain('tuna-can')
      expect(ids).toContain('rice-white')
      expect(ids).toContain('banana')
   })

   it('múltiples condiciones se acumulan', () => {
      const pool = filterIngredientPool(
         SEED_INGREDIENTS,
         baseCtx({ medicalConditions: ['hipertension', 'diabetes'] })
      )
      const ids = pool.map((p) => p.id)
      expect(ids).not.toContain('tuna-can')
      expect(ids).not.toContain('rice-white')
      expect(ids).not.toContain('banana')
   })

   it('alias normalizados: hypertension (en inglés) también filtra high_sodium', () => {
      const pool = filterIngredientPool(
         SEED_INGREDIENTS,
         baseCtx({ medicalConditions: ['hypertension'] })
      )
      const ids = pool.map((p) => p.id)
      expect(ids).not.toContain('tuna-can')
   })

   it('diabetes_type_2 también filtra simple_carb', () => {
      const pool = filterIngredientPool(
         SEED_INGREDIENTS,
         baseCtx({ medicalConditions: ['diabetes_type_2'] })
      )
      const ids = pool.map((p) => p.id)
      expect(ids).not.toContain('rice-white')
   })

   it('condición desconocida no afecta el pool', () => {
      const baselinePool = filterIngredientPool(SEED_INGREDIENTS, baseCtx())
      const unknownPool = filterIngredientPool(
         SEED_INGREDIENTS,
         baseCtx({ medicalConditions: ['condicion_inventada_xyz'] })
      )
      expect(unknownPool.length).toBe(baselinePool.length)
   })

   it('hipertension deja disponibles alternativas low-sodium (pollo, lentejas, huevo)', () => {
      const pool = filterIngredientPool(
         SEED_INGREDIENTS,
         baseCtx({ medicalConditions: ['hipertension'] })
      )
      const ids = pool.map((p) => p.id)
      expect(ids).toContain('chicken-breast')
      expect(ids).toContain('lentils-cooked')
      expect(ids).toContain('eggs')
   })

   it('diabetes deja disponibles carbos complejos (camote, lentejas, avena)', () => {
      const pool = filterIngredientPool(
         SEED_INGREDIENTS,
         baseCtx({ medicalConditions: ['diabetes'] })
      )
      const ids = pool.map((p) => p.id)
      expect(ids).toContain('sweet-potato')
      expect(ids).toContain('lentils-cooked')
   })
})
