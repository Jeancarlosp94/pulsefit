import type {
   ItfOrganizedSession,
   ItfPrescribedExercise,
   ItfRoutineValidationResult,
   ItfRoutineValidationReason
} from './types'

const FORBIDDEN_WORDS = [
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

const fail = (reason: ItfRoutineValidationReason, detail?: string): ItfRoutineValidationResult => ({
   valid: false,
   reason,
   ...(detail ? { detail } : {})
})

interface ValidateInput {
   raw: string
   prescribed: ItfPrescribedExercise[]
   sessionMinutes: number
}

/**
 * Valida que la IA NO haya modificado la prescripción.
 * Reglas de files/generadores-hibridos.md sección 7.
 */
export const validateRoutineResponse = ({
   raw,
   prescribed,
   sessionMinutes
}: ValidateInput): ItfRoutineValidationResult => {
   let parsed: Partial<ItfOrganizedSession>
   try {
      parsed = JSON.parse(raw)
   } catch {
      return fail('invalid_json')
   }

   const { warmup, blocks, cooldown, estimated_total_min } = parsed
   if (!warmup || !blocks || !cooldown || estimated_total_min === undefined) {
      return fail('missing_top_fields')
   }

   if (!Array.isArray(blocks) || blocks.length !== prescribed.length) {
      return fail(
         'block_count_mismatch',
         `esperaba ${prescribed.length}, recibí ${Array.isArray(blocks) ? blocks.length : 0}`
      )
   }

   if (
      typeof warmup.duration_min !== 'number' ||
      warmup.duration_min < 3 ||
      warmup.duration_min > 15
   ) {
      return fail('warmup_out_of_range')
   }
   if (
      typeof cooldown.duration_min !== 'number' ||
      cooldown.duration_min < 3 ||
      cooldown.duration_min > 15
   ) {
      return fail('cooldown_out_of_range')
   }

   /* Tiempo total razonable (±25% del session_minutes). */
   if (
      typeof estimated_total_min !== 'number' ||
      estimated_total_min < sessionMinutes * 0.6 ||
      estimated_total_min > sessionMinutes * 1.4
   ) {
      return fail(
         'total_time_unrealistic',
         `recibí ${estimated_total_min}, esperaba ~${sessionMinutes}`
      )
   }

   const prescribedById = new Map(prescribed.map((p) => [p.exerciseId, p]))

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
         return fail('block_count_mismatch', `block ${i} mal formado`)
      }

      const ref = prescribedById.get(b.exercise_id)
      if (!ref) return fail('exercise_modified', `id desconocido: ${b.exercise_id}`)

      /* La IA NO puede modificar sets/reps/rest_sec. */
      if (b.sets !== ref.sets) {
         return fail('exercise_modified', `${b.exercise_id}: sets ${b.sets} ≠ ${ref.sets}`)
      }
      if (b.reps !== ref.reps) {
         return fail('exercise_modified', `${b.exercise_id}: reps ${b.reps} ≠ ${ref.reps}`)
      }
      if (b.rest_sec !== ref.restSec) {
         return fail('exercise_modified', `${b.exercise_id}: rest ${b.rest_sec} ≠ ${ref.restSec}`)
      }
      if (b.name !== ref.name) {
         return fail('exercise_modified', `${b.exercise_id}: nombre cambió`)
      }

      const tip = b.tip.trim()
      if (tip.length < 10) return fail('tip_too_short', `block ${i}`)
      if (tip.length > 120) return fail('tip_too_long', `block ${i}`)

      const tipLower = tip.toLowerCase()
      if (FORBIDDEN_WORDS.some((w) => tipLower.includes(w))) {
         return fail('forbidden_words_in_tip', `block ${i}`)
      }
      if (MEDICAL_WORDS.some((w) => tipLower.includes(w))) {
         return fail('medical_advice_in_tip', `block ${i}`)
      }
   }

   return {
      valid: true,
      session: {
         warmup: warmup as ItfOrganizedSession['warmup'],
         blocks: blocks as ItfOrganizedSession['blocks'],
         cooldown: cooldown as ItfOrganizedSession['cooldown'],
         estimated_total_min
      }
   }
}
