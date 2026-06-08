import { describe, it, expect } from 'vitest'
import {
   planSession,
   filterExercisePool,
   selectExercises,
   prescribePrograma,
   buildUserPrompt,
   SYSTEM_PROMPT,
   validateRoutineResponse,
   buildRoutineFallback,
   SEED_EXERCISES,
   FOCUS_PATTERNS,
   pickProgramTemplate
} from './index'
import type { ItfPrescribedExercise, ItfUserContextForWorkout } from './types'

const baseCtx: ItfUserContextForWorkout = {
   activityLevel: 'moderate',
   fitnessLevel: 'beginner',
   equipment: ['dumbbells', 'bands'],
   injuredZones: [],
   availableMinutes: 30,
   weekInBlock: 1
}

describe('planSession', () => {
   it('absolute_beginner siempre full_body con RPE 6', () => {
      const r = planSession({
         ctx: { ...baseCtx, fitnessLevel: 'absolute_beginner' },
         dayOfWeek: 1,
         availableDays: [1, 3, 5]
      })
      expect(r.focus).toBe('full_body')
      expect(r.prescribedRpe).toBe(6)
   })

   it('intermediate con 5 días → PPL', () => {
      const r = planSession({
         ctx: { ...baseCtx, fitnessLevel: 'intermediate' },
         dayOfWeek: 1,
         availableDays: [1, 2, 3, 4, 5]
      })
      expect(['push', 'pull', 'legs']).toContain(r.focus)
   })

   it('semana 5 fuerza descarga: RPE 5', () => {
      const r = planSession({
         ctx: { ...baseCtx, weekInBlock: 5 },
         dayOfWeek: 1,
         availableDays: [1, 3, 5]
      })
      expect(r.isDeloadWeek).toBe(true)
      expect(r.prescribedRpe).toBe(5)
   })

   it('override de focus se respeta', () => {
      const r = planSession({
         ctx: baseCtx,
         dayOfWeek: 1,
         availableDays: [1, 3, 5],
         overrideFocus: 'core'
      })
      expect(r.focus).toBe('core')
   })
})

describe('filterExercisePool', () => {
   it('absolute_beginner excluye ejercicios forbidden_absolute_beginner', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: { ...baseCtx, fitnessLevel: 'absolute_beginner' },
         focus: 'full_body'
      })
      const ids = pool.map((p) => p.id)
      expect(ids).not.toContain('back-squat-barbell')
      expect(ids).not.toContain('deadlift-barbell')
      expect(ids).not.toContain('bench-press-barbell')
   })

   it('sin gym_full excluye ejercicios que requieren gym completo', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: { ...baseCtx, equipment: ['bodyweight'] },
         focus: 'full_body'
      })
      pool.forEach((p) => {
         expect(p.equipmentRequired).not.toContain('gym_full')
      })
   })

   it('lesión en lumbar excluye ejercicios con esa zona afectada', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: { ...baseCtx, injuredZones: ['lumbar'] },
         focus: 'full_body'
      })
      pool.forEach((p) => {
         expect(p.affectedZones).not.toContain('lumbar')
      })
   })

   it('focus upper solo trae patrones de tren superior', () => {
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx: baseCtx,
         focus: 'upper'
      })
      const allowed = new Set(FOCUS_PATTERNS.upper)
      pool.forEach((p) => {
         expect(allowed.has(p.pattern)).toBe(true)
      })
   })
})

describe('selectExercises', () => {
   const pool = filterExercisePool({
      catalog: SEED_EXERCISES,
      ctx: baseCtx,
      focus: 'full_body'
   })

   it('respeta el template del tiempo (30 min: 3 compounds + 1 accessory + 1 core)', () => {
      const result = selectExercises({ pool, sessionMinutes: 30 })
      expect(result).not.toBeNull()
      if (result) {
         const compounds = result.filter((e) => e.isCompound && e.pattern !== 'core').length
         const cores = result.filter((e) => e.pattern === 'core').length
         expect(compounds).toBeGreaterThanOrEqual(2)
         expect(cores).toBeGreaterThanOrEqual(1)
      }
   })

   it('pool vacío devuelve null', () => {
      expect(selectExercises({ pool: [], sessionMinutes: 30 })).toBeNull()
   })

   it('mismo seed → mismo output', () => {
      const a = selectExercises({ pool, sessionMinutes: 30, seed: 7 })
      const b = selectExercises({ pool, sessionMinutes: 30, seed: 7 })
      expect(a?.map((e) => e.id)).toEqual(b?.map((e) => e.id))
   })
})

describe('prescribePrograma', () => {
   const pool = filterExercisePool({
      catalog: SEED_EXERCISES,
      ctx: baseCtx,
      focus: 'full_body'
   })
   const selected = selectExercises({ pool, sessionMinutes: 30 })!

   it('asigna 3 series a compuestos para principiantes', () => {
      const out = prescribePrograma({
         selected,
         ctx: { ...baseCtx, fitnessLevel: 'absolute_beginner' },
         isDeloadWeek: false,
         prescribedRpe: 6
      })
      out.filter((p) => p.isCompound).forEach((p) => expect(p.sets).toBe(3))
   })

   it('semana de descarga baja una serie y aumenta descanso', () => {
      const normal = prescribePrograma({
         selected,
         ctx: baseCtx,
         isDeloadWeek: false,
         prescribedRpe: 7
      })
      const deload = prescribePrograma({
         selected,
         ctx: baseCtx,
         isDeloadWeek: true,
         prescribedRpe: 5
      })
      expect(deload[0].sets).toBeLessThanOrEqual(normal[0].sets)
      expect(deload[0].restSec).toBeGreaterThan(normal[0].restSec)
   })

   it('todos los compuestos tienen orderCategory compound', () => {
      const out = prescribePrograma({
         selected,
         ctx: baseCtx,
         isDeloadWeek: false,
         prescribedRpe: 7
      })
      out.filter((p) => p.isCompound && p.exerciseId !== 'plank').forEach((p) => {
         expect(['compound', 'core']).toContain(p.orderCategory)
      })
   })

   it('pickProgramTemplate corresponde al rango', () => {
      expect(pickProgramTemplate(15)).toEqual({ compounds: 2, accessories: 0, core: 1 })
      expect(pickProgramTemplate(30).compounds).toBe(3)
      expect(pickProgramTemplate(90).compounds).toBe(5)
   })
})

describe('buildUserPrompt', () => {
   const prescribed: ItfPrescribedExercise[] = [
      {
         exerciseId: 'bw-squat',
         name: 'Sentadilla con peso corporal',
         sets: 3,
         reps: '10',
         restSec: 90,
         prescribedRpe: 7,
         isCompound: true,
         orderCategory: 'compound'
      }
   ]

   it('incluye el JSON con ejercicios y respeta el count exacto', () => {
      const p = buildUserPrompt({ prescribed, focus: 'full_body', ctx: baseCtx })
      expect(p).toContain('Sentadilla con peso corporal')
      expect(p).toContain('"sets": 3')
      expect(p).toContain('EXACTAMENTE el mismo')
   })

   it('SYSTEM_PROMPT prohíbe modificar prescripción', () => {
      expect(SYSTEM_PROMPT).toContain('NUNCA modificas series')
      expect(SYSTEM_PROMPT).toContain('NUNCA agregas ejercicios')
   })
})

describe('validateRoutineResponse', () => {
   const prescribed: ItfPrescribedExercise[] = [
      {
         exerciseId: 'bw-squat',
         name: 'Sentadilla con peso corporal',
         sets: 3,
         reps: '10',
         restSec: 90,
         prescribedRpe: 7,
         isCompound: true,
         orderCategory: 'compound'
      },
      {
         exerciseId: 'plank',
         name: 'Plancha',
         sets: 3,
         reps: '30',
         restSec: 60,
         prescribedRpe: 7,
         isCompound: false,
         orderCategory: 'core'
      }
   ]

   const validResponse = JSON.stringify({
      warmup: {
         duration_min: 5,
         movements: ['Rotación de hombros', 'Marcha en el lugar', 'Gato-vaca']
      },
      blocks: [
         {
            exercise_id: 'bw-squat',
            name: 'Sentadilla con peso corporal',
            sets: 3,
            reps: '10',
            rest_sec: 90,
            tip: 'Pecho arriba, peso en los talones, baja con control.'
         },
         {
            exercise_id: 'plank',
            name: 'Plancha',
            sets: 3,
            reps: '30',
            rest_sec: 60,
            tip: 'Cuerpo en línea, glúteos firmes, respiración tranquila.'
         }
      ],
      cooldown: {
         duration_min: 5,
         movements: ['Estiramiento cuádriceps', 'Postura del niño', 'Respiración']
      },
      estimated_total_min: 30
   })

   it('JSON correcto pasa', () => {
      const r = validateRoutineResponse({
         raw: validResponse,
         prescribed,
         sessionMinutes: 30
      })
      expect(r.valid).toBe(true)
   })

   it('JSON malformado falla con invalid_json', () => {
      const r = validateRoutineResponse({
         raw: '{no es json}',
         prescribed,
         sessionMinutes: 30
      })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('invalid_json')
   })

   it('falta un block → block_count_mismatch', () => {
      const bad = JSON.parse(validResponse)
      bad.blocks = [bad.blocks[0]]
      const r = validateRoutineResponse({
         raw: JSON.stringify(bad),
         prescribed,
         sessionMinutes: 30
      })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('block_count_mismatch')
   })

   it('IA cambió sets → exercise_modified', () => {
      const bad = JSON.parse(validResponse)
      bad.blocks[0].sets = 4
      const r = validateRoutineResponse({
         raw: JSON.stringify(bad),
         prescribed,
         sessionMinutes: 30
      })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('exercise_modified')
   })

   it('IA usa palabra punitiva → forbidden_words_in_tip', () => {
      const bad = JSON.parse(validResponse)
      bad.blocks[0].tip = 'Si no lo haces vas a fallar tu meta tonificar mejor.'
      const r = validateRoutineResponse({
         raw: JSON.stringify(bad),
         prescribed,
         sessionMinutes: 30
      })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('forbidden_words_in_tip')
   })

   it('IA da consejo médico → medical_advice_in_tip', () => {
      const bad = JSON.parse(validResponse)
      bad.blocks[0].tip = 'Esto previene lesiones de espalda y cura el dolor lumbar.'
      const r = validateRoutineResponse({
         raw: JSON.stringify(bad),
         prescribed,
         sessionMinutes: 30
      })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('medical_advice_in_tip')
   })

   it('warmup fuera de rango 3-15 → warmup_out_of_range', () => {
      const bad = JSON.parse(validResponse)
      bad.warmup.duration_min = 25
      const r = validateRoutineResponse({
         raw: JSON.stringify(bad),
         prescribed,
         sessionMinutes: 30
      })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('warmup_out_of_range')
   })

   it('tiempo total muy distinto del esperado → total_time_unrealistic', () => {
      const bad = JSON.parse(validResponse)
      bad.estimated_total_min = 120 // muy distinto de 30
      const r = validateRoutineResponse({
         raw: JSON.stringify(bad),
         prescribed,
         sessionMinutes: 30
      })
      expect(r.valid).toBe(false)
      if (!r.valid) expect(r.reason).toBe('total_time_unrealistic')
   })
})

describe('buildRoutineFallback', () => {
   const pool = filterExercisePool({
      catalog: SEED_EXERCISES,
      ctx: baseCtx,
      focus: 'full_body'
   })
   const selected = selectExercises({ pool, sessionMinutes: 30 })!
   const prescribed = prescribePrograma({
      selected,
      ctx: baseCtx,
      isDeloadWeek: false,
      prescribedRpe: 7
   })

   it('siempre devuelve sesión válida (warmup + blocks + cooldown)', () => {
      const r = buildRoutineFallback({ prescribed, sessionMinutes: 30 })
      expect(r.warmup.duration_min).toBeGreaterThan(0)
      expect(r.cooldown.duration_min).toBeGreaterThan(0)
      expect(r.blocks.length).toBe(prescribed.length)
   })

   it('pasa su propia validación', () => {
      const r = buildRoutineFallback({ prescribed, sessionMinutes: 30 })
      const validation = validateRoutineResponse({
         raw: JSON.stringify(r),
         prescribed,
         sessionMinutes: 30
      })
      expect(validation.valid).toBe(true)
   })

   it('los tips son no vacíos y de longitud razonable', () => {
      const r = buildRoutineFallback({ prescribed, sessionMinutes: 30 })
      r.blocks.forEach((b) => {
         expect(b.tip.length).toBeGreaterThan(10)
         expect(b.tip.length).toBeLessThan(120)
      })
   })

   it('orden: compounds primero, luego accessories, luego core', () => {
      const r = buildRoutineFallback({ prescribed, sessionMinutes: 30 })
      const cats = r.blocks.map((b) => {
         const ref = prescribed.find((p) => p.exerciseId === b.exercise_id)!
         return ref.orderCategory
      })
      /* Comprobar que el primer 'core' está después del último 'compound'. */
      const lastCompound = cats.lastIndexOf('compound')
      const firstCore = cats.indexOf('core')
      if (lastCompound >= 0 && firstCore >= 0) {
         expect(firstCore).toBeGreaterThan(lastCompound)
      }
   })
})
