/* Motor híbrido de generación de comidas (Fase 5).
 * Source of truth: files/generadores-hibridos.md
 */

export type {
   ItfMealType,
   ItfDifficulty,
   ItfMacroTarget,
   ItfIngredient,
   ItfIngredientServing,
   ItfMealComponents,
   ItfPlateOption,
   ItfGeneratedMeal,
   ItfValidationResult,
   ItfValidationReason,
   ItfUserContextForMeal
} from './types'
export { MEAL_DISTRIBUTION } from './types'

export { computeMealTarget } from './nutritional-target'
export { filterIngredientPool, prioritizeByRegion } from './ingredient-pool'
export { selectComponents, isWithinTolerance } from './component-selector'
export { SYSTEM_PROMPT, buildUserPrompt, maxPrepTimeForUser } from './compose-prompt'
export { validateMealResponse } from './plate-validator'
export { buildMealFallback } from './fallback-templates'
export { SEED_INGREDIENTS } from './seed-ingredients'
