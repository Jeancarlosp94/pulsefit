import { describe, it, expect } from 'vitest'
import { suggestNextWeight, formatLastSession } from './progression-suggester'
import type { ItfWorkoutLog } from '@/interface/itfWorkouts'

const makeLog = (overrides: Partial<ItfWorkoutLog> = {}): ItfWorkoutLog => ({
   id: 'l',
   user_id: 'u',
   logged_at: new Date().toISOString(),
   exercise_id: 'goblet-squat',
   exercise_name: 'Goblet squat',
   sets_completed: 3,
   reps_completed: 8,
   weight_kg: 20,
   rpe_actual: 7,
   notes: null,
   session_id: null,
   ...overrides
})

describe('suggestNextWeight — primera vez', () => {
   it('sin logs previos sugiere first_time', () => {
      const out = suggestNextWeight({
         recentLogs: [],
         targetRpe: 7,
         isCompound: true,
         prescribedReps: 8
      })
      expect(out.kind).toBe('first_time')
      expect(out.weightKg).toBe(0)
      expect(out.reason).toContain('cómodo')
   })
})

describe('suggestNextWeight — progresión compound', () => {
   it('2 sesiones al RPE objetivo o menor → +2.5 kg compound', () => {
      const recent = [
         makeLog({ weight_kg: 22.5, rpe_actual: 7 }),
         makeLog({
            weight_kg: 22.5,
            rpe_actual: 6,
            logged_at: new Date(Date.now() - 3 * 86400000).toISOString()
         })
      ]
      const out = suggestNextWeight({
         recentLogs: recent,
         targetRpe: 7,
         isCompound: true,
         prescribedReps: 8
      })
      expect(out.kind).toBe('progress')
      expect(out.weightKg).toBe(25)
      expect(out.reason).toContain('25')
   })

   it('último RPE > target → mantener', () => {
      const recent = [
         makeLog({ weight_kg: 22.5, rpe_actual: 9 }),
         makeLog({
            weight_kg: 22.5,
            rpe_actual: 6,
            logged_at: new Date(Date.now() - 3 * 86400000).toISOString()
         })
      ]
      const out = suggestNextWeight({
         recentLogs: recent,
         targetRpe: 7,
         isCompound: true,
         prescribedReps: 8
      })
      expect(out.kind).toBe('maintain')
      expect(out.weightKg).toBe(22.5)
   })

   it('solo 1 sesión previa → mantener (necesita 2 confirmaciones)', () => {
      const recent = [makeLog({ weight_kg: 20, rpe_actual: 6 })]
      const out = suggestNextWeight({
         recentLogs: recent,
         targetRpe: 7,
         isCompound: true,
         prescribedReps: 8
      })
      expect(out.kind).toBe('maintain')
   })
})

describe('suggestNextWeight — accesorios', () => {
   it('2 sesiones al RPE objetivo → +1.25 kg accesorio', () => {
      const recent = [
         makeLog({ weight_kg: 10, rpe_actual: 7 }),
         makeLog({
            weight_kg: 10,
            rpe_actual: 7,
            logged_at: new Date(Date.now() - 5 * 86400000).toISOString()
         })
      ]
      const out = suggestNextWeight({
         recentLogs: recent,
         targetRpe: 7,
         isCompound: false,
         prescribedReps: 12
      })
      expect(out.kind).toBe('progress')
      expect(out.weightKg).toBe(11.25)
   })
})

describe('suggestNextWeight — peso corporal', () => {
   it('2 sesiones al RPE objetivo → +1 rep en lugar de +peso', () => {
      const recent = [
         makeLog({ weight_kg: 0, reps_completed: 10, rpe_actual: 7 }),
         makeLog({
            weight_kg: 0,
            reps_completed: 10,
            rpe_actual: 6,
            logged_at: new Date(Date.now() - 4 * 86400000).toISOString()
         })
      ]
      const out = suggestNextWeight({
         recentLogs: recent,
         targetRpe: 7,
         isCompound: true,
         isBodyweight: true,
         prescribedReps: 10
      })
      expect(out.kind).toBe('progress')
      expect(out.weightKg).toBe(0)
      expect(out.reps).toBe(11)
   })
})

describe('suggestNextWeight — descondicionamiento', () => {
   it('último log > 14 días → deload con -10%', () => {
      const old = makeLog({
         weight_kg: 30,
         rpe_actual: 7,
         logged_at: new Date(Date.now() - 20 * 86400000).toISOString()
      })
      const out = suggestNextWeight({
         recentLogs: [old],
         targetRpe: 7,
         isCompound: true,
         prescribedReps: 8
      })
      expect(out.kind).toBe('deload')
      expect(out.weightKg).toBeLessThan(30)
      expect(out.reason).toContain('días')
   })
})

describe('suggestNextWeight — deload week explícita', () => {
   it('isDeloadWeek=true → mantener carga aunque haya progress válido', () => {
      const recent = [
         makeLog({ weight_kg: 25, rpe_actual: 6 }),
         makeLog({
            weight_kg: 25,
            rpe_actual: 6,
            logged_at: new Date(Date.now() - 3 * 86400000).toISOString()
         })
      ]
      const out = suggestNextWeight({
         recentLogs: recent,
         targetRpe: 7,
         isCompound: true,
         prescribedReps: 8,
         isDeloadWeek: true
      })
      expect(out.kind).toBe('maintain')
      expect(out.weightKg).toBe(25)
   })
})

describe('formatLastSession', () => {
   it('con peso y RPE: "3×8 @ 20 kg (RPE 7)"', () => {
      const log = makeLog({ sets_completed: 3, reps_completed: 8, weight_kg: 20, rpe_actual: 7 })
      expect(formatLastSession(log)).toBe('3×8 @ 20 kg (RPE 7)')
   })

   it('sin RPE: solo sets×reps×peso', () => {
      const log = makeLog({ rpe_actual: null })
      const result = formatLastSession(log)
      expect(result).toContain('3×8 @ 20 kg')
      expect(result).not.toContain('RPE')
   })

   it('peso corporal (0 kg): omite el peso', () => {
      const log = makeLog({ weight_kg: 0, reps_completed: 10 })
      const result = formatLastSession(log)
      expect(result).toContain('3×10')
      expect(result).not.toContain('@ 0')
   })
})
