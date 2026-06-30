import { describe, it, expect } from 'vitest'
import { estimateKcal, WORKOUT_SUBTYPE_LABEL, WORKOUT_SUBTYPE_EMOJI } from './met-table'

describe('estimateKcal — Sprint 11.12 fórmula MET', () => {
   it('persona 70kg, 30min HIIT intensidad 3 → ~280 kcal (MET 8)', () => {
      const kcal = estimateKcal({ subtype: 'hiit', durationMin: 30, intensity: 3, weightKg: 70 })
      /* 8 × 70 × 0.5 = 280 */
      expect(kcal).toBe(280)
   })

   it('persona 60kg, 60min yoga intensidad 2 → ~150 kcal (MET 2.5)', () => {
      const kcal = estimateKcal({ subtype: 'yoga', durationMin: 60, intensity: 2, weightKg: 60 })
      /* 2.5 × 60 × 1.0 = 150 */
      expect(kcal).toBe(150)
   })

   it('persona 80kg, 45min CrossFit intensidad 4 → ~600 kcal (MET 10)', () => {
      const kcal = estimateKcal({
         subtype: 'crossfit',
         durationMin: 45,
         intensity: 4,
         weightKg: 80
      })
      /* 10 × 80 × 0.75 = 600 */
      expect(kcal).toBe(600)
   })

   it('persona 75kg, 60min strength intensidad 3 → 375 kcal (MET 5)', () => {
      const kcal = estimateKcal({
         subtype: 'strength',
         durationMin: 60,
         intensity: 3,
         weightKg: 75
      })
      /* 5 × 75 × 1.0 = 375 */
      expect(kcal).toBe(375)
   })

   it('peso null → usa default 70kg', () => {
      const a = estimateKcal({ subtype: 'cardio', durationMin: 30, intensity: 3, weightKg: null })
      const b = estimateKcal({ subtype: 'cardio', durationMin: 30, intensity: 3, weightKg: 70 })
      expect(a).toBe(b)
   })

   it('peso fuera de rango (10kg, 500kg) → fallback a 70kg', () => {
      const tiny = estimateKcal({ subtype: 'cardio', durationMin: 30, intensity: 3, weightKg: 10 })
      const huge = estimateKcal({ subtype: 'cardio', durationMin: 30, intensity: 3, weightKg: 500 })
      const ref = estimateKcal({ subtype: 'cardio', durationMin: 30, intensity: 3, weightKg: 70 })
      expect(tiny).toBe(ref)
      expect(huge).toBe(ref)
   })

   it('duración 0 o negativa → 0 kcal (no se loggea)', () => {
      expect(estimateKcal({ subtype: 'hiit', durationMin: 0, intensity: 3, weightKg: 70 })).toBe(0)
      expect(estimateKcal({ subtype: 'hiit', durationMin: -5, intensity: 3, weightKg: 70 })).toBe(0)
   })

   it('duración > 600min → cap a 600 (sanity)', () => {
      const cap = estimateKcal({ subtype: 'running', durationMin: 600, intensity: 3, weightKg: 70 })
      const insane = estimateKcal({
         subtype: 'running',
         durationMin: 99999,
         intensity: 3,
         weightKg: 70
      })
      expect(insane).toBe(cap)
   })

   it('intensidad 1 (suave) < intensidad 5 (intensa) para mismo subtype/duración/peso', () => {
      const suave = estimateKcal({
         subtype: 'cycling',
         durationMin: 30,
         intensity: 1,
         weightKg: 70
      })
      const intensa = estimateKcal({
         subtype: 'cycling',
         durationMin: 30,
         intensity: 5,
         weightKg: 70
      })
      expect(intensa).toBeGreaterThan(suave)
   })

   it('yoga light < HIIT intenso (mismo peso/duración)', () => {
      const yoga = estimateKcal({ subtype: 'yoga', durationMin: 30, intensity: 1, weightKg: 70 })
      const hiit = estimateKcal({ subtype: 'hiit', durationMin: 30, intensity: 5, weightKg: 70 })
      expect(hiit).toBeGreaterThan(yoga * 3)
   })

   it('todos los subtypes tienen label y emoji', () => {
      const subtypes = Object.keys(WORKOUT_SUBTYPE_LABEL)
      expect(subtypes.length).toBeGreaterThan(10)
      subtypes.forEach((s) => {
         expect(WORKOUT_SUBTYPE_LABEL[s as keyof typeof WORKOUT_SUBTYPE_LABEL]).toBeTruthy()
         expect(WORKOUT_SUBTYPE_EMOJI[s as keyof typeof WORKOUT_SUBTYPE_EMOJI]).toBeTruthy()
      })
   })
})
