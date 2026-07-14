import { describe, it, expect } from 'vitest'
import { filterExercisePool } from './exercise-pool'
import { SEED_EXERCISES } from './seed-exercises'
import { getSportTransfer, SPORT_FOCUS_LABEL, SPORT_FOCUS_EMOJI } from './sport-transfer-map'
import { EQUIPMENT_PRESETS, inferLocationPreset } from './equipment-presets'
import type { ItfSportFocus, ItfUserContextForWorkout } from './types'

const baseCtx = (overrides: Partial<ItfUserContextForWorkout> = {}): ItfUserContextForWorkout => ({
   activityLevel: 'moderate',
   fitnessLevel: 'intermediate',
   equipment: ['bodyweight', 'dumbbells', 'kettlebell'],
   injuredZones: [],
   availableMinutes: 45,
   weekInBlock: 1,
   ...overrides
})

describe('Sport Focus — Sprint 11.16', () => {
   it('sin sportFocus el pool tiene orden natural (histórico)', () => {
      const noSport = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx(),
         focus: 'full_body'
      })
      const withSportNinguno = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ sportFocus: 'ninguno' }),
         focus: 'full_body'
      })
      expect(noSport.map((e) => e.id)).toEqual(withSportNinguno.map((e) => e.id))
   })

   it('sportFocus=futbol prioriza búlgara, hip thrust, RDL, jump squats', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ sportFocus: 'futbol' }),
         focus: 'full_body'
      })
      const topIds = pool.slice(0, 15).map((e) => e.id)
      /* Al menos 3 de los "gold standard" para fútbol deben estar en el top 15. */
      const goldStandard = ['bulgarian-split-squat', 'rdl-db', 'hip-thrust-db', 'hiit-jump-squat']
      const matches = goldStandard.filter((id) => topIds.includes(id))
      expect(matches.length).toBeGreaterThanOrEqual(3)
   })

   it('sportFocus=basketball prioriza búlgara + hip thrust + kb swing', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({
            sportFocus: 'basketball',
            equipment: ['bodyweight', 'dumbbells', 'kettlebell']
         }),
         focus: 'full_body'
      })
      const topIds = pool.slice(0, 15).map((e) => e.id)
      const goldStandard = ['bulgarian-split-squat', 'hip-thrust-db', 'kb-swing', 'goblet-squat']
      const matches = goldStandard.filter((id) => topIds.includes(id))
      expect(matches.length).toBeGreaterThanOrEqual(3)
   })

   it('sportFocus=running prioriza cadena posterior + core (RDL, plank, side-plank)', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ sportFocus: 'running' }),
         focus: 'full_body'
      })
      const topIds = pool.slice(0, 15).map((e) => e.id)
      const goldStandard = ['rdl-db', 'hip-thrust-db', 'plank', 'side-plank', 'walking-lunge-db']
      const matches = goldStandard.filter((id) => topIds.includes(id))
      expect(matches.length).toBeGreaterThanOrEqual(3)
   })

   it('sportFocus=natacion prioriza pull horizontal + face pull', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({
            sportFocus: 'natacion',
            equipment: ['bodyweight', 'dumbbells', 'bands', 'pull_up_bar']
         }),
         focus: 'upper'
      })
      const topIds = pool.slice(0, 10).map((e) => e.id)
      const goldStandard = ['db-row', 'face-pull', 'band-pull-apart', 'lat-pulldown']
      const matches = goldStandard.filter((id) => topIds.includes(id))
      expect(matches.length).toBeGreaterThanOrEqual(2)
   })

   it('sportFocus NO excluye ejercicios sin transferencia', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx({ sportFocus: 'futbol' }),
         focus: 'full_body'
      })
      /* El pool completo debe seguir teniendo N ejercicios, sin exclusión. */
      const noSport = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx(),
         focus: 'full_body'
      })
      expect(pool.length).toBe(noSport.length)
   })

   it('todas las modalidades de deporte tienen label + emoji', () => {
      const sports: ItfSportFocus[] = [
         'futbol',
         'basketball',
         'volley',
         'padel',
         'tenis',
         'boxeo',
         'running',
         'ciclismo',
         'natacion',
         'crossfit',
         'ninguno'
      ]
      for (const s of sports) {
         expect(SPORT_FOCUS_LABEL[s]).toBeTruthy()
         expect(SPORT_FOCUS_EMOJI[s]).toBeTruthy()
      }
   })

   it('getSportTransfer devuelve arreglo vacío para ejercicio no listado', () => {
      expect(getSportTransfer('inexistente-xyz')).toEqual([])
   })
})

describe('Equipment presets — Sprint 11.16', () => {
   it('5 presets disponibles ordenados de menos a más equipo', () => {
      expect(EQUIPMENT_PRESETS.length).toBe(5)
      const ids = EQUIPMENT_PRESETS.map((p) => p.id)
      expect(ids).toEqual([
         'casa_minima',
         'casa_bandas',
         'casa_pesas',
         'gym_completo',
         'crossfit_box'
      ])
   })

   it('cada preset incluye bodyweight + none como mínimo', () => {
      for (const p of EQUIPMENT_PRESETS) {
         expect(p.equipment).toContain('bodyweight')
         expect(p.equipment).toContain('none')
      }
   })

   it('crossfit_box tiene el set más completo (>10 items)', () => {
      const cb = EQUIPMENT_PRESETS.find((p) => p.id === 'crossfit_box')!
      expect(cb.equipment.length).toBeGreaterThan(10)
   })

   it('inferLocationPreset detecta correctamente casa_bandas si solo tiene bandas', () => {
      const inferred = inferLocationPreset(['bodyweight', 'none', 'bands'])
      expect(inferred).toBe('casa_bandas')
   })

   it('inferLocationPreset detecta gym_completo con pull_up_bar + dumbbells + gym_full', () => {
      const inferred = inferLocationPreset([
         'bodyweight',
         'none',
         'dumbbells',
         'kettlebell',
         'gym_full',
         'pull_up_bar',
         'bench'
      ])
      expect(inferred).toBe('gym_completo')
   })
})
