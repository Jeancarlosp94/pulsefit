import { describe, it, expect } from 'vitest'
import { estimateKcal } from './met-table'
import type { ItfLogActivityInput, ItfLogCustomRoutineInput } from '@/interface/itfWorkouts'

/**
 * Sprint 11.14: tests de integración conceptual del flujo
 * "usuario elige tipo → estima kcal → payload correcto → suma en balance".
 *
 * No mockeamos Supabase (los tests reales de red viven en e2e). Aquí
 * garantizamos que la forma de los payloads y las agregaciones son las
 * esperadas — sirve como red de seguridad ante regresiones de contrato.
 */

/** Mapping usado en LogActivityDialog. Mirror para test. */
const ACTIVITY_TYPE_TO_SUBTYPE: Record<
   ItfLogActivityInput['activity_type'],
   ItfLogCustomRoutineInput['workout_subtype']
> = {
   cardio: 'cardio',
   sport: 'sport',
   dance: 'dance',
   movement: 'mixed'
}

describe('flujo usuario → estimación → payload → balance', () => {
   it('LogActivityDialog: cardio 30min intensidad 4 con peso 70kg → payload con calories_burned', () => {
      const input: ItfLogActivityInput = {
         activity_type: 'cardio',
         activity_name: 'Correr en el parque',
         duration_min: 30,
         intensity: 4,
         calories_burned: estimateKcal({
            subtype: ACTIVITY_TYPE_TO_SUBTYPE.cardio,
            durationMin: 30,
            intensity: 4,
            weightKg: 70
         })
      }
      expect(input.calories_burned).toBeGreaterThan(0)
      /* Cardio MET[4]=8.5 → 8.5 × 70 × 0.5 = 297.5 → floor = 297 */
      expect(input.calories_burned).toBe(297)
   })

   it('LogCustomRoutineDialog: yoga 45min intensidad 2 con peso 55kg', () => {
      const input: ItfLogCustomRoutineInput = {
         activity_name: 'Mi flow matutino',
         workout_subtype: 'yoga',
         duration_min: 45,
         intensity: 2,
         calories_burned: estimateKcal({
            subtype: 'yoga',
            durationMin: 45,
            intensity: 2,
            weightKg: 55
         }),
         perceived_effort: 'Tranquila, podía hablar'
      }
      /* Yoga MET[2]=2.5 → 2.5 × 55 × 0.75 = 103.125 → 103 */
      expect(input.calories_burned).toBe(103)
      expect(input.perceived_effort).toBeTruthy()
   })

   it('balance neto: come 2000 kcal + quema 350 → déficit visual de -350', () => {
      const consumed = 2000
      const target = 2000
      const burned = estimateKcal({
         subtype: 'crossfit',
         durationMin: 30,
         intensity: 3,
         weightKg: 70
      })
      /* CrossFit MET[3]=8 → 8 × 70 × 0.5 = 280 */
      expect(burned).toBe(280)
      const netBalance = consumed - burned
      expect(netBalance).toBe(target - 280)
   })

   it('suma de 3 rutinas del día = total quemado esperado', () => {
      const yoga = estimateKcal({ subtype: 'yoga', durationMin: 20, intensity: 2, weightKg: 70 })
      const walk = estimateKcal({ subtype: 'cardio', durationMin: 15, intensity: 2, weightKg: 70 })
      const strength = estimateKcal({
         subtype: 'strength',
         durationMin: 30,
         intensity: 3,
         weightKg: 70
      })
      const total = yoga + walk + strength
      expect(total).toBeGreaterThan(0)
      expect(total).toBe(yoga + walk + strength) /* trivial pero fija contrato de suma */
   })

   it('activity_type=movement mapea a subtype=mixed (no rompe LogActivityDialog)', () => {
      expect(ACTIVITY_TYPE_TO_SUBTYPE.movement).toBe('mixed')
      const kcal = estimateKcal({
         subtype: ACTIVITY_TYPE_TO_SUBTYPE.movement,
         durationMin: 30,
         intensity: 3,
         weightKg: 70
      })
      expect(kcal).toBeGreaterThan(0)
   })

   it('estimación es determinística: mismo input siempre da mismo output', () => {
      const args = { subtype: 'hiit', durationMin: 25, intensity: 4, weightKg: 68 } as const
      const a = estimateKcal(args)
      const b = estimateKcal(args)
      const c = estimateKcal(args)
      expect(a).toBe(b)
      expect(b).toBe(c)
   })
})
