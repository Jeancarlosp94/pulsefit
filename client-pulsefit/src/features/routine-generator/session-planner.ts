import type { ItfFitnessLevel } from '@/features/nutrition-engine'
import type { ItfSessionFocus, ItfUserContextForWorkout } from './types'

/**
 * Planificador de sesión. Decide:
 *   - focus del día (qué patrones musculares trabajar)
 *   - tiempo asignado
 *   - RPE objetivo según semana del bloque
 *
 * Reglas de Carlos:
 *   - Absolute beginners: SIEMPRE full_body con RPE 6-7.
 *   - Beginners (3-12 meses): full_body 3 días/sem o upper/lower si entrenan 4.
 *   - Intermediate: split 4 días = upper/lower; 5+ días = push/pull/legs.
 *   - Advanced: PPL clásico, 5-6 días.
 *
 * Semana 5 de cada bloque → descarga forzada (RPE objetivo cae a 5).
 */

interface PlanInput {
   ctx: ItfUserContextForWorkout
   /** 0=Domingo, 1=Lunes, ..., 6=Sábado. */
   dayOfWeek: number
   /** Días disponibles del perfil (subset de 0..6). */
   availableDays: number[]
   /** Override manual. Útil si el usuario quiere cambiar el focus. */
   overrideFocus?: ItfSessionFocus
}

interface PlanOutput {
   focus: ItfSessionFocus
   sessionMinutes: number
   prescribedRpe: number
   isDeloadWeek: boolean
}

const DELOAD_RPE = 5

const RPE_BY_LEVEL: Record<ItfFitnessLevel, number> = {
   absolute_beginner: 6,
   beginner: 7,
   intermediate: 7,
   advanced: 8
}

/**
 * Decide el focus en función del nivel + posición del día en los días disponibles.
 */
const inferFocus = (
   level: ItfFitnessLevel,
   dayPositionIndex: number,
   totalDays: number
): ItfSessionFocus => {
   if (level === 'absolute_beginner') return 'full_body'

   if (level === 'beginner') {
      if (totalDays <= 3) return 'full_body'
      return dayPositionIndex % 2 === 0 ? 'upper' : 'lower'
   }

   if (level === 'intermediate') {
      if (totalDays <= 4) return dayPositionIndex % 2 === 0 ? 'upper' : 'lower'
      // 5+ días → PPL
      const ppl: ItfSessionFocus[] = ['push', 'pull', 'legs']
      return ppl[dayPositionIndex % 3]
   }

   // advanced
   const ppl: ItfSessionFocus[] = ['push', 'pull', 'legs']
   return ppl[dayPositionIndex % 3]
}

export const planSession = ({
   ctx,
   dayOfWeek,
   availableDays,
   overrideFocus
}: PlanInput): PlanOutput => {
   const totalDays = availableDays.length || 3

   /* Posición ordinal del día actual dentro de los días disponibles. */
   const sortedDays = [...availableDays].sort((a, b) => a - b)
   const positionIndex = Math.max(0, sortedDays.indexOf(dayOfWeek))

   const isDeloadWeek = ctx.weekInBlock === 5
   const baseRpe = RPE_BY_LEVEL[ctx.fitnessLevel]

   return {
      focus: overrideFocus ?? inferFocus(ctx.fitnessLevel, positionIndex, totalDays),
      sessionMinutes: ctx.availableMinutes,
      prescribedRpe: isDeloadWeek ? DELOAD_RPE : baseRpe,
      isDeloadWeek
   }
}
