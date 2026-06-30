import { describe, it, expect } from 'vitest'
import { computeActivePhase, validatePhases, getPresetById, PROGRAM_PRESETS } from './index'
import type { ItfTrainingProgram } from '@/interface/itfPrograms'

const makeProgram = (overrides: Partial<ItfTrainingProgram> = {}): ItfTrainingProgram => ({
   id: 'p1',
   user_id: 'u',
   created_at: '2026-06-01T00:00:00Z',
   updated_at: '2026-06-01T00:00:00Z',
   name: 'Test',
   goal_type: 'lose_weight',
   target_weight_kg: null,
   target_date: null,
   total_weeks: 12,
   start_date: '2026-06-01',
   status: 'active',
   notes: null,
   phases: [
      {
         id: 'ph1',
         program_id: 'p1',
         phase_order: 1,
         phase_name: 'Adaptación',
         modality: 'hiit',
         weeks: 4,
         sessions_per_week: 3,
         intensity_target: 'moderate',
         focus: 'full_body',
         description: null
      },
      {
         id: 'ph2',
         program_id: 'p1',
         phase_order: 2,
         phase_name: 'Carga',
         modality: 'gym',
         weeks: 8,
         sessions_per_week: 4,
         intensity_target: 'moderate',
         focus: 'full_body',
         description: null
      }
   ],
   ...overrides
})

describe('computeActivePhase', () => {
   it('día 0 → fase 1, semana 1', () => {
      const prog = makeProgram()
      const result = computeActivePhase(prog, new Date('2026-06-01'))
      expect(result).not.toBeNull()
      expect(result?.phase.phase_order).toBe(1)
      expect(result?.week_in_phase).toBe(1)
      expect(result?.week_in_program).toBe(1)
   })

   it('semana 4 → todavía fase 1, semana 4', () => {
      const prog = makeProgram()
      const day = new Date('2026-06-01')
      day.setDate(day.getDate() + 21) /* 3 semanas */
      const result = computeActivePhase(prog, day)
      expect(result?.phase.phase_order).toBe(1)
      expect(result?.week_in_phase).toBe(4)
   })

   it('semana 5 → cambia a fase 2', () => {
      const prog = makeProgram()
      const day = new Date('2026-06-01')
      day.setDate(day.getDate() + 28) /* 4 semanas */
      const result = computeActivePhase(prog, day)
      expect(result?.phase.phase_order).toBe(2)
      expect(result?.week_in_phase).toBe(1)
   })

   it('después del programa → null', () => {
      const prog = makeProgram()
      const day = new Date('2026-06-01')
      day.setDate(day.getDate() + 12 * 7) /* 12 semanas exactas = terminó */
      const result = computeActivePhase(prog, day)
      expect(result).toBeNull()
   })

   it('programa en el futuro → fase 1 upcoming', () => {
      const prog = makeProgram({ start_date: '2027-01-01' })
      const result = computeActivePhase(prog, new Date('2026-06-01'))
      expect(result?.week_in_program).toBe(0)
      expect(result?.phase.phase_order).toBe(1)
   })
})

describe('validatePhases', () => {
   it('suma exacta → valid', () => {
      const r = validatePhases([{ weeks: 4 }, { weeks: 8 }], 12)
      expect(r.valid).toBe(true)
   })

   it('suma menor → invalid', () => {
      const r = validatePhases([{ weeks: 4 }, { weeks: 4 }], 12)
      expect(r.valid).toBe(false)
      expect(r.message).toContain('8 semanas')
   })

   it('lista vacía → invalid', () => {
      const r = validatePhases([], 12)
      expect(r.valid).toBe(false)
   })

   it('más de 6 fases → invalid', () => {
      const r = validatePhases(
         [
            { weeks: 1 },
            { weeks: 1 },
            { weeks: 1 },
            { weeks: 1 },
            { weeks: 1 },
            { weeks: 1 },
            { weeks: 1 }
         ],
         7
      )
      expect(r.valid).toBe(false)
   })
})

describe('PROGRAM_PRESETS', () => {
   it('cada preset suma exactamente sus total_weeks', () => {
      for (const preset of PROGRAM_PRESETS) {
         const built = preset.build()
         const phaseSum = built.phases.reduce((s, p) => s + p.weeks, 0)
         expect(phaseSum).toBe(built.total_weeks)
      }
   })

   it('getPresetById devuelve el preset correcto', () => {
      expect(getPresetById('lose_3kg_12w')?.label).toContain('Bajar')
      expect(getPresetById('inexistente')).toBeUndefined()
   })
})
