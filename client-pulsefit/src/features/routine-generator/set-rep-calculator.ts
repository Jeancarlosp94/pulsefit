import type { ItfExercise, ItfPrescribedExercise, ItfUserContextForWorkout } from './types'
import type { ItfModalityConfig } from './session-planner'

/**
 * Plantillas por tiempo (regla de Carlos en files/reglas-fitness.md):
 *   15 min: 1 compound principal + 1 compound secundario + 1 core.
 *   30 min: 5 min warmup + 3 compounds + 1 accessory + 5 min cooldown.
 *   45 min: 5 min warmup + 4 compounds + 2 accessories + core + 5 min cooldown.
 *   60+ min: 5-10 min warmup + 5-6 ejercicios + cooldown.
 */
const TIME_TEMPLATES = {
   15: { compounds: 2, accessories: 0, core: 1 },
   30: { compounds: 3, accessories: 1, core: 1 },
   45: { compounds: 4, accessories: 2, core: 1 },
   60: { compounds: 5, accessories: 2, core: 1 },
   90: { compounds: 5, accessories: 3, core: 2 }
}

const pickTemplate = (minutes: number) => {
   if (minutes <= 17) return TIME_TEMPLATES[15]
   if (minutes <= 35) return TIME_TEMPLATES[30]
   if (minutes <= 50) return TIME_TEMPLATES[45]
   if (minutes <= 75) return TIME_TEMPLATES[60]
   return TIME_TEMPLATES[90]
}

/**
 * Tiempos de descanso por rango de reps (Carlos):
 *   1-5 reps (fuerza): 120-180s.
 *   6-12 (hipertrofia): 60-90s.
 *   12+ (resistencia): 30-60s.
 *   Principiantes default: 90s.
 */
const restForReps = (reps: number, isAbsoluteBeginner: boolean): number => {
   if (isAbsoluteBeginner) return 90
   if (reps <= 5) return 150
   if (reps <= 12) return 75
   return 45
}

/**
 * Reps prescritas según objetivo + nivel.
 * Principiantes siempre rangos de hipertrofia (8-12).
 * Avanzados pueden bajar a 6 reps si la prescripción del coach lo dice.
 */
const repsForLevel = (isAbsoluteBeginner: boolean, isCompound: boolean): string => {
   if (isAbsoluteBeginner) {
      return isCompound ? '10' : '12'
   }
   return isCompound ? '8' : '12'
}

const setsForLevel = (isAbsoluteBeginner: boolean, isCompound: boolean): number => {
   if (isAbsoluteBeginner) return isCompound ? 3 : 2
   return isCompound ? 3 : 3
}

interface CalcInput {
   selected: ItfExercise[]
   ctx: ItfUserContextForWorkout
   isDeloadWeek: boolean
   prescribedRpe: number
   /** Sprint 11.14: config de modalidad (yoga → "5 respiraciones", HIIT → "30s"). */
   modalityConfig?: ItfModalityConfig
}

/**
 * Convierte la lista de ejercicios seleccionados en prescripciones formales
 * (sets, reps, rest, RPE). Aplica descarga si la semana toca.
 *
 * Sprint 11.14: si viene modalityConfig, sus valores dominan sobre los defaults
 * de nivel. Ejemplo yoga → reps='5 respiraciones', rest=5s.
 */
export const prescribePrograma = ({
   selected,
   ctx,
   isDeloadWeek,
   prescribedRpe,
   modalityConfig
}: CalcInput): ItfPrescribedExercise[] => {
   const isAbsoluteBeginner = ctx.fitnessLevel === 'absolute_beginner'

   return selected.map((ex) => {
      /* Sprint 11.14: si hay modalityConfig, sus reps ganan. */
      const repsStr = modalityConfig
         ? ex.isCompound
            ? modalityConfig.compoundReps
            : modalityConfig.accessoryReps
         : repsForLevel(isAbsoluteBeginner, ex.isCompound)

      /* Parseo defensivo: "30 segundos", "5 respiraciones" o "10" → número. */
      const parsed = Number.parseInt(repsStr, 10)
      const repsNum = Number.isFinite(parsed) && parsed > 0 ? parsed : 10

      let sets = setsForLevel(isAbsoluteBeginner, ex.isCompound)
      let rest = modalityConfig
         ? modalityConfig.restBaseSec
         : restForReps(repsNum, isAbsoluteBeginner)

      if (isDeloadWeek) {
         /* Descarga: -30% volumen aproximado = una serie menos, descanso un poco más largo. */
         sets = Math.max(2, sets - 1)
         rest = Math.round(rest * 1.2)
      }

      const orderCategory: ItfPrescribedExercise['orderCategory'] =
         ex.pattern === 'core' ? 'core' : ex.isCompound ? 'compound' : 'accessory'

      return {
         exerciseId: ex.id,
         name: ex.name,
         sets,
         reps: repsStr,
         restSec: rest,
         prescribedRpe,
         isCompound: ex.isCompound,
         orderCategory
      }
   })
}

export const PROGRAM_TEMPLATES = TIME_TEMPLATES
export const pickProgramTemplate = pickTemplate
