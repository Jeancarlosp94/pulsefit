import { describe, it, expect } from 'vitest'
import { planSession, getModalityConfig } from './session-planner'
import { prescribePrograma } from './set-rep-calculator'
import type { ItfExercise, ItfUserContextForWorkout } from './types'

const ctx = (mod?: ItfUserContextForWorkout['modality']): ItfUserContextForWorkout => ({
   activityLevel: 'moderate',
   fitnessLevel: 'beginner',
   equipment: ['bodyweight'],
   injuredZones: [],
   availableMinutes: 60,
   weekInBlock: 1,
   modality: mod
})

const dummyExercise = (id: string, isCompound = true): ItfExercise => ({
   id,
   name: id,
   pattern: 'squat',
   muscleGroups: [],
   equipmentRequired: ['none'],
   difficulty: 'beginner',
   affectedZones: [],
   description: '',
   formTips: [],
   alternatives: [],
   isCompound
})

describe('getModalityConfig — Sprint 11.14', () => {
   it('yoga: flow + descanso ~5s + "respiraciones"', () => {
      const c = getModalityConfig('yoga')
      expect(c.structure).toBe('flow')
      expect(c.restBaseSec).toBeLessThan(15)
      expect(c.compoundReps).toMatch(/respiracion/i)
   })

   it('hiit: circuit + descanso corto + reps en tiempo', () => {
      const c = getModalityConfig('hiit')
      expect(c.structure).toBe('circuit')
      expect(c.restBaseSec).toBeLessThanOrEqual(30)
      expect(c.compoundReps).toMatch(/segundos/i)
   })

   it('crossfit: metcon + duración corta', () => {
      const c = getModalityConfig('crossfit')
      expect(c.structure).toBe('metcon')
      expect(c.idealMinutes).toBeLessThanOrEqual(35)
   })

   it('gym: traditional + reps numéricas + descanso ~90s', () => {
      const c = getModalityConfig('gym')
      expect(c.structure).toBe('traditional')
      expect(c.restBaseSec).toBeGreaterThanOrEqual(60)
      expect(Number.parseInt(c.compoundReps, 10)).toBeGreaterThan(0)
   })

   it('sin modalidad → defaults tipo gym', () => {
      const c = getModalityConfig()
      expect(c.structure).toBe('traditional')
   })
})

describe('planSession — sessionMinutes por modalidad', () => {
   it('yoga con 60 min disponibles → ~60 min (ideal yoga)', () => {
      const r = planSession({ ctx: ctx('yoga'), dayOfWeek: 1, availableDays: [1, 3, 5] })
      expect(r.sessionMinutes).toBe(60)
   })

   it('hiit con 60 min disponibles → 25 min (cap por ideal HIIT)', () => {
      const r = planSession({ ctx: ctx('hiit'), dayOfWeek: 1, availableDays: [1, 3, 5] })
      expect(r.sessionMinutes).toBe(25)
   })

   it('crossfit con 60 min disponibles → 30 min (cap por ideal CrossFit)', () => {
      const r = planSession({ ctx: ctx('crossfit'), dayOfWeek: 1, availableDays: [1, 3, 5] })
      expect(r.sessionMinutes).toBe(30)
   })

   it('gym con 30 min disponibles → 30 min (cap por lo disponible)', () => {
      const c = { ...ctx('gym'), availableMinutes: 30 }
      const r = planSession({ ctx: c, dayOfWeek: 1, availableDays: [1, 3, 5] })
      expect(r.sessionMinutes).toBe(30)
   })

   it('modalityConfig se expone en el output', () => {
      const r = planSession({ ctx: ctx('yoga'), dayOfWeek: 1, availableDays: [1, 3, 5] })
      expect(r.modalityConfig).toBeDefined()
      expect(r.modalityConfig.structure).toBe('flow')
   })
})

describe('prescribePrograma — modalityConfig ajusta reps/rest', () => {
   const exercises = [dummyExercise('a', true), dummyExercise('b', false)]

   it('yoga: reps = "5 respiraciones", rest = 5s', () => {
      const cfg = getModalityConfig('yoga')
      const p = prescribePrograma({
         selected: exercises,
         ctx: ctx('yoga'),
         isDeloadWeek: false,
         prescribedRpe: 7,
         modalityConfig: cfg
      })
      expect(p[0].reps).toBe('5 respiraciones')
      expect(p[0].restSec).toBe(5)
   })

   it('hiit: reps = "30 segundos", rest = 20s', () => {
      const cfg = getModalityConfig('hiit')
      const p = prescribePrograma({
         selected: exercises,
         ctx: ctx('hiit'),
         isDeloadWeek: false,
         prescribedRpe: 7,
         modalityConfig: cfg
      })
      expect(p[0].reps).toBe('30 segundos')
      expect(p[0].restSec).toBe(20)
   })

   it('sin modalityConfig → comportamiento histórico (reps numérico)', () => {
      const p = prescribePrograma({
         selected: exercises,
         ctx: ctx(),
         isDeloadWeek: false,
         prescribedRpe: 7
      })
      expect(Number.parseInt(p[0].reps, 10)).toBeGreaterThan(0)
      /* Gym default rest > 30s. */
      expect(p[0].restSec).toBeGreaterThan(30)
   })

   it('deload aplica igual sobre modalityConfig (sets -1)', () => {
      const cfg = getModalityConfig('gym')
      const p = prescribePrograma({
         selected: exercises,
         ctx: ctx('gym'),
         isDeloadWeek: true,
         prescribedRpe: 5,
         modalityConfig: cfg
      })
      expect(p[0].sets).toBeGreaterThanOrEqual(2)
      /* Rest deload = base * 1.2 */
      expect(p[0].restSec).toBe(Math.round(90 * 1.2))
   })
})
