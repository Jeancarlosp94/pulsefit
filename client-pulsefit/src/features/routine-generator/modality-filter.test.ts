import { describe, it, expect } from 'vitest'
import { filterExercisePool } from './exercise-pool'
import { SEED_EXERCISES } from './seed-exercises'
import type { ItfUserContextForWorkout } from './types'

const baseCtx = (overrides: Partial<ItfUserContextForWorkout> = {}): ItfUserContextForWorkout => ({
   activityLevel: 'moderate',
   fitnessLevel: 'beginner',
   equipment: ['bodyweight'],
   injuredZones: [],
   availableMinutes: 30,
   weekInBlock: 1,
   ...overrides
})

describe('filterExercisePool — Sprint 11.11 modalidades', () => {
   it('SIN modality → trae default (gym/calistenia/hybrid) y excluye exclusivos yoga/barre/pilates', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx(),
         focus: 'full_body'
      })
      const ids = pool.map((e) => e.id)
      /* Histórico (gym/calistenia): debe estar disponible. */
      expect(ids).toContain('bw-squat')
      /* Exclusivos yoga: NO deben estar. */
      expect(ids).not.toContain('yoga-mountain')
      expect(ids).not.toContain('yoga-downdog')
      /* Exclusivos barre/pilates: NO deben estar. */
      expect(ids).not.toContain('pilates-hundred')
      expect(ids).not.toContain('pilates-roll-up')
   })

   it('modality=yoga → SOLO asanas', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ modality: 'yoga' }),
         focus: 'full_body'
      })
      const ids = pool.map((e) => e.id)
      expect(ids).toContain('yoga-mountain')
      expect(ids).toContain('yoga-downdog')
      expect(ids).toContain('yoga-childpose')
      /* Y debe excluir compounds de gym (sentadilla con barra, peso muerto). */
      expect(ids).not.toContain('bw-squat')
      expect(ids).not.toContain('hiit-burpee')
   })

   it('modality=hiit → solo movimientos HIIT', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ modality: 'hiit' }),
         focus: 'full_body'
      })
      const ids = pool.map((e) => e.id)
      expect(ids).toContain('hiit-burpee')
      expect(ids).toContain('hiit-mountain-climber')
      expect(ids).toContain('hiit-jump-squat')
      expect(ids).not.toContain('yoga-mountain')
      expect(ids).not.toContain('pilates-hundred')
   })

   it('modality=pilates → asanas pilates + barre cuando overlap', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ modality: 'pilates' }),
         focus: 'full_body'
      })
      const ids = pool.map((e) => e.id)
      expect(ids).toContain('pilates-hundred')
      expect(ids).toContain('pilates-roll-up')
      /* barre-plie y barre-pulse tienen modalities ['barre','pilates']. */
      expect(ids).toContain('barre-plie')
      expect(ids).not.toContain('hiit-burpee')
   })

   it('modality=barre → barre + pilates con overlap', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ modality: 'barre' }),
         focus: 'full_body'
      })
      const ids = pool.map((e) => e.id)
      expect(ids).toContain('barre-plie')
      expect(ids).toContain('barre-pulse')
      /* Pilates-hundred es ['pilates'] only → NO. */
      expect(ids).not.toContain('pilates-hundred')
   })

   it('modality=hybrid → default (gym/calistenia/hybrid)', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ modality: 'hybrid' }),
         focus: 'full_body'
      })
      const ids = pool.map((e) => e.id)
      expect(ids).toContain('bw-squat')
      expect(ids).not.toContain('yoga-mountain')
      expect(ids).not.toContain('hiit-burpee')
   })

   it('modality=crossfit → trae ejercicios CrossFit (thruster, wall ball, box jump)', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ modality: 'crossfit', equipment: ['dumbbells', 'kettlebell', 'box'] }),
         focus: 'full_body'
      })
      const ids = pool.map((e) => e.id)
      expect(ids).toContain('crossfit-thruster')
      expect(ids).toContain('crossfit-wall-ball')
      expect(ids).toContain('crossfit-box-jump')
      /* Asanas yoga NO deben aparecer. */
      expect(ids).not.toContain('yoga-mountain')
      expect(ids).not.toContain('pilates-hundred')
   })

   it('SIN modality → exclusivos CrossFit (toes-to-bar, wall-ball) NO aparecen', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ equipment: ['pull_up_bar', 'med_ball', 'dumbbells'] }),
         focus: 'full_body'
      })
      const ids = pool.map((e) => e.id)
      /* toes-to-bar es exclusivo (['crossfit']) → NO en default. */
      expect(ids).not.toContain('crossfit-toes-to-bar')
      /* wall-ball es ['crossfit', 'hiit'] → NO en default (sin gym/calistenia/hybrid). */
      expect(ids).not.toContain('crossfit-wall-ball')
      /* Pero thruster ['crossfit', 'hiit', 'hybrid'] SÍ pasa (tiene 'hybrid'). */
      expect(ids).toContain('crossfit-thruster')
   })

   it('modality + injured zone se acumulan', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ modality: 'yoga', injuredZones: ['rodilla'] }),
         focus: 'full_body'
      })
      const ids = pool.map((e) => e.id)
      /* yoga-warrior2 tiene affectedZones: ['rodilla'] → excluido. */
      expect(ids).not.toContain('yoga-warrior2')
      /* yoga-mountain SIN affectedZones → permitido. */
      expect(ids).toContain('yoga-mountain')
   })
})
