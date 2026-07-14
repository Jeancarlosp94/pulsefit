import type { ItfFitnessLevel } from '@/features/nutrition-engine'
import type { ItfExerciseModality, ItfSessionFocus, ItfUserContextForWorkout } from './types'

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
 *
 * Sprint 11.14: modality ajusta duración, descanso base, estructura y reps.
 *   - yoga → flow largo, descansos casi nulos, "5 respiraciones" en vez de reps.
 *   - hiit → circuito corto (20-25 min), 20s descanso, "30s" en vez de reps.
 *   - crossfit → metcon 25-30 min, 30s descanso, WOD-style.
 *   - gym/calistenia → traditional 45-60 min.
 */

export type ItfSessionStructure = 'traditional' | 'circuit' | 'flow' | 'metcon'

export interface ItfModalityConfig {
   /** Duración ideal en min. Sujeta a Math.min(availableMinutes, idealMinutes). */
   idealMinutes: number
   /** Descanso base entre sets/movimientos (segundos). */
   restBaseSec: number
   /** Reps default para compounds/movimientos principales. */
   compoundReps: string
   /** Reps default para accessories/movimientos accesorios. */
   accessoryReps: string
   /** Estructura sugerida — informa al LLM y a la UI. */
   structure: ItfSessionStructure
}

/**
 * Configuraciones por modalidad. Firmadas por Carlos + Lucía.
 * Todos los descansos son valores base que set-rep-calculator puede ajustar por reps.
 */
const MODALITY_CONFIGS: Record<ItfExerciseModality, ItfModalityConfig> = {
   gym: {
      idealMinutes: 60,
      restBaseSec: 90,
      compoundReps: '8',
      accessoryReps: '12',
      structure: 'traditional'
   },
   hiit: {
      idealMinutes: 25,
      restBaseSec: 20,
      compoundReps: '30 segundos',
      accessoryReps: '20 segundos',
      structure: 'circuit'
   },
   calistenia: {
      idealMinutes: 45,
      restBaseSec: 60,
      compoundReps: '10',
      accessoryReps: '15',
      structure: 'traditional'
   },
   yoga: {
      idealMinutes: 60,
      restBaseSec: 5,
      compoundReps: '5 respiraciones',
      accessoryReps: '5 respiraciones',
      structure: 'flow'
   },
   barre: {
      idealMinutes: 45,
      restBaseSec: 15,
      compoundReps: '15',
      accessoryReps: '20',
      structure: 'circuit'
   },
   pilates: {
      idealMinutes: 45,
      restBaseSec: 15,
      compoundReps: '10',
      accessoryReps: '12',
      structure: 'flow'
   },
   crossfit: {
      idealMinutes: 30,
      restBaseSec: 30,
      compoundReps: '10',
      accessoryReps: '15',
      structure: 'metcon'
   },
   hybrid: {
      idealMinutes: 45,
      restBaseSec: 60,
      compoundReps: '8',
      accessoryReps: '12',
      structure: 'traditional'
   }
}

/** Config por defecto (sin modality declarada). Comportamiento histórico. */
const DEFAULT_CONFIG: ItfModalityConfig = MODALITY_CONFIGS.gym

export const getModalityConfig = (modality?: ItfExerciseModality): ItfModalityConfig =>
   modality ? MODALITY_CONFIGS[modality] : DEFAULT_CONFIG

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
   /** Sprint 11.14: config aplicada según modalidad (o defaults si no hay). */
   modalityConfig: ItfModalityConfig
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
   const modalityConfig = getModalityConfig(ctx.modality)

   /* Sprint 11.14: sessionMinutes respeta el ideal de la modalidad,
    * capado por lo que el usuario declaró disponible. */
   const sessionMinutes = Math.min(ctx.availableMinutes, modalityConfig.idealMinutes)

   return {
      focus: overrideFocus ?? inferFocus(ctx.fitnessLevel, positionIndex, totalDays),
      sessionMinutes,
      prescribedRpe: isDeloadWeek ? DELOAD_RPE : baseRpe,
      isDeloadWeek,
      modalityConfig
   }
}
