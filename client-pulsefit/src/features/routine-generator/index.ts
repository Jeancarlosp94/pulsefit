/* Motor híbrido de generación de rutinas (Fase 6).
 * Source of truth: files/generadores-hibridos.md secciones 5-7 + files/reglas-fitness.md
 */

export type {
   ItfSessionFocus,
   ItfExercisePattern,
   ItfExerciseDifficulty,
   ItfExercise,
   ItfPrescribedExercise,
   ItfWarmup,
   ItfCooldown,
   ItfOrganizedBlock,
   ItfOrganizedSession,
   ItfGeneratedSession,
   ItfRoutineValidationResult,
   ItfRoutineValidationReason,
   ItfUserContextForWorkout
} from './types'
export { FOCUS_PATTERNS } from './types'

export { planSession } from './session-planner'
export { filterExercisePool, partitionByCompoundType } from './exercise-pool'
export { selectExercises } from './exercise-selector'
export { prescribePrograma, PROGRAM_TEMPLATES, pickProgramTemplate } from './set-rep-calculator'
export { SYSTEM_PROMPT, buildUserPrompt } from './compose-prompt'
export { validateRoutineResponse } from './routine-validator'
export { buildRoutineFallback } from './fallback-templates'
export { SEED_EXERCISES } from './seed-exercises'
export { findVideoUrlForExercise } from './find-video'
export { suggestNextWeight, formatLastSession } from './progression-suggester'
