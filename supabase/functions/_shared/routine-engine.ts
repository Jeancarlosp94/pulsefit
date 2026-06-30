/**
 * Motor `routine-generator` portado a Deno (mirror del frontend).
 * Cuando actualices uno, sincronizá el otro.
 * Source: files/generadores-hibridos.md + files/reglas-fitness.md
 */

// ============================================================ TYPES
export type SessionFocus =
   | 'full_body'
   | 'upper'
   | 'lower'
   | 'push'
   | 'pull'
   | 'legs'
   | 'core'
export type ExercisePattern =
   | 'squat'
   | 'hinge'
   | 'push_horizontal'
   | 'push_vertical'
   | 'pull_horizontal'
   | 'pull_vertical'
   | 'lunge'
   | 'core'
   | 'carry'
export type FitnessLevel =
   | 'absolute_beginner'
   | 'beginner'
   | 'intermediate'
   | 'advanced'

export interface Exercise {
   id: string
   name: string
   pattern: ExercisePattern
   muscleGroups: string[]
   equipmentRequired: string[]
   difficulty:
      | 'beginner'
      | 'intermediate'
      | 'advanced'
      | 'forbidden_absolute_beginner'
   affectedZones: string[]
   description: string
   formTips: string[]
   alternatives: string[]
   isCompound: boolean
   videoUrl?: string
   /** Sprint 11.11: modalidades compatibles. Default ['gym','calistenia','hybrid']. */
   modalities?: ExerciseModality[]
}

export interface PrescribedExercise {
   exerciseId: string
   name: string
   sets: number
   reps: string
   restSec: number
   prescribedRpe: number
   isCompound: boolean
   orderCategory: 'compound' | 'accessory' | 'core'
}

export interface OrganizedBlock {
   exercise_id: string
   name: string
   sets: number
   reps: string
   rest_sec: number
   tip: string
}
export interface OrganizedSession {
   warmup: { duration_min: number; movements: string[] }
   blocks: OrganizedBlock[]
   cooldown: { duration_min: number; movements: string[] }
   estimated_total_min: number
}

/** Sprint 11.11: modalidades. Mirror del tipo del cliente. */
export type ExerciseModality =
   | 'gym'
   | 'hiit'
   | 'calistenia'
   | 'yoga'
   | 'barre'
   | 'pilates'
   | 'crossfit'
   | 'hybrid'

export interface UserContextForWorkout {
   activityLevel: string
   fitnessLevel: FitnessLevel
   equipment: string[]
   injuredZones: string[]
   availableMinutes: number
   weekInBlock: number
   /** Sprint 11.11: modalidad activa del programa del usuario (opcional). */
   modality?: ExerciseModality
}

export type RoutineValidationResult =
   | { valid: true; session: OrganizedSession }
   | { valid: false; reason: string; detail?: string }

export const FOCUS_PATTERNS: Record<SessionFocus, ExercisePattern[]> = {
   full_body: ['squat', 'hinge', 'push_horizontal', 'push_vertical', 'pull_horizontal', 'pull_vertical', 'core'],
   upper: ['push_horizontal', 'push_vertical', 'pull_horizontal', 'pull_vertical', 'core'],
   lower: ['squat', 'hinge', 'lunge'],
   push: ['push_horizontal', 'push_vertical', 'core'],
   pull: ['pull_horizontal', 'pull_vertical', 'core'],
   legs: ['squat', 'hinge', 'lunge', 'carry'],
   core: ['core']
}

// ============================================================ PLANNER
const RPE_BY_LEVEL: Record<FitnessLevel, number> = {
   absolute_beginner: 6,
   beginner: 7,
   intermediate: 7,
   advanced: 8
}

const inferFocus = (
   level: FitnessLevel,
   dayPos: number,
   totalDays: number
): SessionFocus => {
   if (level === 'absolute_beginner') return 'full_body'
   if (level === 'beginner') {
      if (totalDays <= 3) return 'full_body'
      return dayPos % 2 === 0 ? 'upper' : 'lower'
   }
   if (level === 'intermediate') {
      if (totalDays <= 4) return dayPos % 2 === 0 ? 'upper' : 'lower'
      return (['push', 'pull', 'legs'] as SessionFocus[])[dayPos % 3]
   }
   return (['push', 'pull', 'legs'] as SessionFocus[])[dayPos % 3]
}

export const planSession = (input: {
   ctx: UserContextForWorkout
   dayOfWeek: number
   availableDays: number[]
   overrideFocus?: SessionFocus
}) => {
   const totalDays = input.availableDays.length || 3
   const sorted = [...input.availableDays].sort((a, b) => a - b)
   const positionIndex = Math.max(0, sorted.indexOf(input.dayOfWeek))
   const isDeloadWeek = input.ctx.weekInBlock === 5
   const baseRpe = RPE_BY_LEVEL[input.ctx.fitnessLevel]
   return {
      focus:
         input.overrideFocus ??
         inferFocus(input.ctx.fitnessLevel, positionIndex, totalDays),
      sessionMinutes: input.ctx.availableMinutes,
      prescribedRpe: isDeloadWeek ? 5 : baseRpe,
      isDeloadWeek
   }
}

// ============================================================ POOL
/* Sprint 11.11: filtro por modalidad. */
const DEFAULT_MODALITIES: ExerciseModality[] = ['gym', 'calistenia', 'hybrid']
const exerciseMatchesModality = (ex: Exercise, modality: ExerciseModality): boolean => {
   const supported = ex.modalities ?? DEFAULT_MODALITIES
   return supported.includes(modality)
}

export const filterExercisePool = (input: {
   catalog: Exercise[]
   ctx: UserContextForWorkout
   focus: SessionFocus
}): Exercise[] => {
   const isAB = input.ctx.fitnessLevel === 'absolute_beginner'
   const allowed = new Set(FOCUS_PATTERNS[input.focus])
   const userEq = new Set([
      ...input.ctx.equipment.map((e) => e.toLowerCase()),
      'bodyweight',
      'none'
   ])
   const injured = new Set(input.ctx.injuredZones.map((z) => z.toLowerCase().trim()))
   const modality = input.ctx.modality
   return input.catalog.filter((ex) => {
      /* Sprint 11.11: filtro por modalidad. */
      if (modality) {
         if (!exerciseMatchesModality(ex, modality)) return false
      } else if (ex.modalities && !ex.modalities.some((m) => DEFAULT_MODALITIES.includes(m))) {
         /* Sin modality declarada: excluir exclusivos de yoga/barre/pilates. */
         return false
      }
      if (!allowed.has(ex.pattern)) return false
      if (isAB && ex.difficulty === 'forbidden_absolute_beginner') return false
      if (isAB && ex.difficulty === 'advanced') return false
      if (
         ex.equipmentRequired.length > 0 &&
         !ex.equipmentRequired.some((req) => userEq.has(req.toLowerCase()))
      ) {
         return false
      }
      if (
         injured.size > 0 &&
         ex.affectedZones.some((z) => injured.has(z.toLowerCase()))
      ) {
         return false
      }
      return true
   })
}

// ============================================================ SELECTOR + CALC
const TIME_TEMPLATES = {
   15: { compounds: 2, accessories: 0, core: 1 },
   30: { compounds: 3, accessories: 1, core: 1 },
   45: { compounds: 4, accessories: 2, core: 1 },
   60: { compounds: 5, accessories: 2, core: 1 },
   90: { compounds: 5, accessories: 3, core: 2 }
}
const pickTemplate = (m: number) => {
   if (m <= 17) return TIME_TEMPLATES[15]
   if (m <= 35) return TIME_TEMPLATES[30]
   if (m <= 50) return TIME_TEMPLATES[45]
   if (m <= 75) return TIME_TEMPLATES[60]
   return TIME_TEMPLATES[90]
}

export const selectExercises = (input: {
   pool: Exercise[]
   sessionMinutes: number
   seed?: number
}): Exercise[] | null => {
   if (input.pool.length === 0) return null
   const seed = input.seed ?? 0
   const compounds = input.pool.filter((p) => p.isCompound && p.pattern !== 'core')
   const accessories = input.pool.filter((p) => !p.isCompound && p.pattern !== 'core')
   const cores = input.pool.filter((p) => p.pattern === 'core')
   const tpl = pickTemplate(input.sessionMinutes)
   const rotated = <T>(arr: T[], n: number): T[] => {
      if (arr.length === 0) return arr
      const o = Math.abs(n) % arr.length
      return [...arr.slice(o), ...arr.slice(0, o)]
   }
   const combined = [
      ...rotated(compounds, seed).slice(0, tpl.compounds),
      ...rotated(accessories, seed + 1).slice(0, tpl.accessories),
      ...rotated(cores, seed + 2).slice(0, tpl.core)
   ]
   return combined.length === 0 ? null : combined
}

const restForReps = (reps: number, isAB: boolean): number => {
   if (isAB) return 90
   if (reps <= 5) return 150
   if (reps <= 12) return 75
   return 45
}
const repsForLevel = (isAB: boolean, c: boolean): string =>
   isAB ? (c ? '10' : '12') : c ? '8' : '12'
const setsForLevel = (isAB: boolean, c: boolean): number =>
   isAB ? (c ? 3 : 2) : 3

export const prescribePrograma = (input: {
   selected: Exercise[]
   ctx: UserContextForWorkout
   isDeloadWeek: boolean
   prescribedRpe: number
}): PrescribedExercise[] => {
   const isAB = input.ctx.fitnessLevel === 'absolute_beginner'
   return input.selected.map((ex) => {
      const repsStr = repsForLevel(isAB, ex.isCompound)
      const repsNum = Number.parseInt(repsStr, 10) || 10
      let sets = setsForLevel(isAB, ex.isCompound)
      let rest = restForReps(repsNum, isAB)
      if (input.isDeloadWeek) {
         sets = Math.max(2, sets - 1)
         rest = Math.round(rest * 1.2)
      }
      const orderCategory =
         ex.pattern === 'core' ? 'core' : ex.isCompound ? 'compound' : 'accessory'
      return {
         exerciseId: ex.id,
         name: ex.name,
         sets,
         reps: repsStr,
         restSec: rest,
         prescribedRpe: input.prescribedRpe,
         isCompound: ex.isCompound,
         orderCategory: orderCategory as PrescribedExercise['orderCategory']
      }
   })
}

// ============================================================ PROMPT
const FOCUS_LABEL: Record<SessionFocus, string> = {
   full_body: 'cuerpo completo',
   upper: 'tren superior',
   lower: 'tren inferior',
   push: 'push (empuje)',
   pull: 'pull (jalón)',
   legs: 'piernas',
   core: 'core'
}

export const SYSTEM_PROMPT = `Eres un asistente de coaching fitness que organiza sesiones de entrenamiento usando EXCLUSIVAMENTE los ejercicios y prescripciones que se te proporcionan.

REGLAS INVIOLABLES:
- NUNCA agregas ejercicios nuevos.
- NUNCA quitas ejercicios de la lista.
- NUNCA modificas series, repeticiones, descansos o cargas.
- NUNCA calculas progresión.
- NUNCA das consejos médicos.
- NUNCA usas tono punitivo ni motivacional vacío ("¡vamos!", "¡tú puedes!").
- Devuelves SOLO JSON válido, sin texto adicional, sin markdown.

Tu única tarea es ORGANIZAR el orden de los ejercicios siguiendo estas pautas y agregar UN tip motivacional contextual breve por ejercicio:

REGLAS DE ORDEN:
1. Calentamiento siempre primero.
2. Compuestos antes que accesorios.
3. Alternar grupos musculares en ejercicios consecutivos cuando sea posible.
4. Cool-down siempre al final.

REGLAS DE TIPS:
- Tono cálido, en español, máximo 120 caracteres.
- Enfocado en forma, foco mental, respiración o sensación.
- NUNCA consejo médico ni diagnóstico ("previene lesiones", "cura").
- NUNCA promesas estéticas ("tonifica", "quema grasa").`

export const buildUserPrompt = (input: {
   prescribed: PrescribedExercise[]
   focus: SessionFocus
   ctx: UserContextForWorkout
}): string => {
   const exercisesJson = JSON.stringify(
      input.prescribed.map((p) => ({
         exercise_id: p.exerciseId,
         name: p.name,
         sets: p.sets,
         reps: p.reps,
         rest_sec: p.restSec,
         is_compound: p.isCompound
      })),
      null,
      2
   )
   return `Organiza esta sesión de entrenamiento. Devuelve los MISMOS ejercicios en el mejor orden, con calentamiento al inicio y cool-down al final, y agrega un tip por ejercicio.

Ejercicios a organizar (NO modificar series/reps/descansos):

${exercisesJson}

Tiempo total disponible: ${input.ctx.availableMinutes} minutos.
Foco de la sesión: ${FOCUS_LABEL[input.focus]}.
Nivel del usuario: ${input.ctx.fitnessLevel}.

Devuelve JSON con esta estructura EXACTA:

{
  "warmup": { "duration_min": número entre 3 y 15, "movements": ["..."] },
  "blocks": [
    {
      "exercise_id": "id literal del input",
      "name": "nombre literal del input",
      "sets": número (literal del input),
      "reps": "literal del input",
      "rest_sec": número (literal del input),
      "tip": "tip motivacional breve, máximo 120 chars"
    }
  ],
  "cooldown": { "duration_min": número entre 3 y 15, "movements": ["..."] },
  "estimated_total_min": número entero
}

El número de elementos en "blocks" debe ser EXACTAMENTE ${input.prescribed.length}. Los ids, nombres, sets, reps, rest_sec deben ser LITERALMENTE los del input.`
}

// ============================================================ VALIDATOR
const FORBIDDEN_WORDS_R = [
   'fallaste',
   'incorrecto',
   'debes',
   'tienes que',
   'tonifica',
   'tonificar',
   'quemar grasa',
   'transformación',
   'antes y después',
   'sin dolor no hay'
]
const MEDICAL_WORDS = [
   'previene lesiones',
   'cura',
   'reemplaza el médico',
   'recupera lesión',
   'tratamiento',
   'diagnóstico',
   'enfermedad'
]

export const validateRoutineResponse = (input: {
   raw: string
   prescribed: PrescribedExercise[]
   sessionMinutes: number
}): RoutineValidationResult => {
   let parsed: Partial<OrganizedSession>
   try {
      parsed = JSON.parse(input.raw)
   } catch {
      return { valid: false, reason: 'invalid_json' }
   }
   const { warmup, blocks, cooldown, estimated_total_min } = parsed
   if (!warmup || !blocks || !cooldown || estimated_total_min === undefined) {
      return { valid: false, reason: 'missing_top_fields' }
   }
   if (!Array.isArray(blocks) || blocks.length !== input.prescribed.length) {
      return {
         valid: false,
         reason: 'block_count_mismatch',
         detail: `esperaba ${input.prescribed.length}`
      }
   }
   if (
      typeof warmup.duration_min !== 'number' ||
      warmup.duration_min < 3 ||
      warmup.duration_min > 15
   ) {
      return { valid: false, reason: 'warmup_out_of_range' }
   }
   if (
      typeof cooldown.duration_min !== 'number' ||
      cooldown.duration_min < 3 ||
      cooldown.duration_min > 15
   ) {
      return { valid: false, reason: 'cooldown_out_of_range' }
   }
   if (
      typeof estimated_total_min !== 'number' ||
      estimated_total_min < input.sessionMinutes * 0.6 ||
      estimated_total_min > input.sessionMinutes * 1.4
   ) {
      return { valid: false, reason: 'total_time_unrealistic' }
   }
   const byId = new Map(input.prescribed.map((p) => [p.exerciseId, p]))
   for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i]
      if (
         !b ||
         typeof b.exercise_id !== 'string' ||
         typeof b.name !== 'string' ||
         typeof b.sets !== 'number' ||
         typeof b.rest_sec !== 'number' ||
         typeof b.reps !== 'string' ||
         typeof b.tip !== 'string'
      ) {
         return { valid: false, reason: 'block_count_mismatch' }
      }
      const ref = byId.get(b.exercise_id)
      if (!ref) return { valid: false, reason: 'exercise_modified' }
      if (b.sets !== ref.sets || b.reps !== ref.reps || b.rest_sec !== ref.restSec) {
         return { valid: false, reason: 'exercise_modified' }
      }
      if (b.name !== ref.name) return { valid: false, reason: 'exercise_modified' }
      const tip = b.tip.trim()
      if (tip.length < 10) return { valid: false, reason: 'tip_too_short' }
      if (tip.length > 120) return { valid: false, reason: 'tip_too_long' }
      const tl = tip.toLowerCase()
      if (FORBIDDEN_WORDS_R.some((w) => tl.includes(w))) {
         return { valid: false, reason: 'forbidden_words_in_tip' }
      }
      if (MEDICAL_WORDS.some((w) => tl.includes(w))) {
         return { valid: false, reason: 'medical_advice_in_tip' }
      }
   }
   return {
      valid: true,
      session: {
         warmup: warmup as OrganizedSession['warmup'],
         blocks: blocks as OrganizedSession['blocks'],
         cooldown: cooldown as OrganizedSession['cooldown'],
         estimated_total_min
      }
   }
}

// ============================================================ FALLBACK
const TIPS_BY_PATTERN: Record<string, string> = {
   squat: 'Pecho arriba, peso en los talones, respira tranquilo al subir.',
   hinge: 'Bisagra desde la cadera, espalda neutra, escapulas firmes.',
   push_horizontal: 'Codos a 45°, baja con control, sube exhalando.',
   push_vertical: 'Mira al frente, sube en línea recta sin trabar codos.',
   pull_horizontal: 'Codo cerca del cuerpo, escápula al final del rango.',
   pull_vertical: 'Lleva la barra al pecho, no encojas los hombros.',
   lunge: 'Tronco erguido, rodilla detrás de la punta, paso firme.',
   core: 'Cuerpo firme, respiración tranquila, calidad sobre cantidad.',
   carry: 'Hombros bajos, abdomen activado, pasos cortos y seguros.',
   default: 'Forma sobre velocidad, respira y siente cada repetición.'
}

const tipFor = (name: string): string => {
   const l = name.toLowerCase()
   if (l.includes('sentadilla') || l.includes('squat')) return TIPS_BY_PATTERN.squat
   if (l.includes('muerto') || l.includes('puente')) return TIPS_BY_PATTERN.hinge
   if (l.includes('flexion') || (l.includes('press') && l.includes('banca')))
      return TIPS_BY_PATTERN.push_horizontal
   if (l.includes('press') && l.includes('hombros'))
      return TIPS_BY_PATTERN.push_vertical
   if (l.includes('remo')) return TIPS_BY_PATTERN.pull_horizontal
   if (l.includes('dominada') || l.includes('jalón'))
      return TIPS_BY_PATTERN.pull_vertical
   if (l.includes('zancada')) return TIPS_BY_PATTERN.lunge
   if (l.includes('plancha') || l.includes('core') || l.includes('abdomen'))
      return TIPS_BY_PATTERN.core
   if (l.includes('caminata')) return TIPS_BY_PATTERN.carry
   return TIPS_BY_PATTERN.default
}

export const buildRoutineFallback = (input: {
   prescribed: PrescribedExercise[]
   sessionMinutes: number
}): OrganizedSession => {
   const ordered = [...input.prescribed].sort((a, b) => {
      const order = { compound: 0, accessory: 1, core: 2 }
      return order[a.orderCategory] - order[b.orderCategory]
   })
   return {
      warmup: {
         duration_min: 5,
         movements: [
            'Rotación de hombros 30 segundos',
            'Círculos de cadera 30 segundos',
            'Gato-vaca x 8 reps',
            'Marcha en el lugar 1 minuto'
         ]
      },
      blocks: ordered.map((ex) => ({
         exercise_id: ex.exerciseId,
         name: ex.name,
         sets: ex.sets,
         reps: ex.reps,
         rest_sec: ex.restSec,
         tip: tipFor(ex.name)
      })),
      cooldown: {
         duration_min: 5,
         movements: [
            'Estiramiento de cuádriceps 30s por lado',
            'Estiramiento de pectoral en marco 30s por lado',
            'Postura del niño 1 minuto',
            'Respiración diafragmática 1 minuto'
         ]
      },
      estimated_total_min: input.sessionMinutes
   }
}
