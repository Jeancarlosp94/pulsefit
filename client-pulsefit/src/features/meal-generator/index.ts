/* Motor híbrido de generación de comidas (Fase 5).
 * Source of truth: files/generadores-hibridos.md
 */

export type {
   ItfMealType,
   ItfMealsPerDay,
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
export { MEAL_DISTRIBUTION, MEAL_DISTRIBUTIONS, MEAL_MIN_KCAL } from './types'

export { computeMealTarget, getActiveMealTypes } from './nutritional-target'
export { filterIngredientPool, prioritizeByRegion } from './ingredient-pool'
export { selectComponents, selectMultipleComponents, isWithinTolerance } from './component-selector'
export {
   SYSTEM_PROMPT,
   buildUserPrompt,
   buildSinglePlatePrompt,
   maxPrepTimeForUser,
   STYLE_HINTS
} from './compose-prompt'
export { validateMealResponse, validateSinglePlate } from './plate-validator'
export type { ItfSinglePlateValidation } from './plate-validator'
export { buildMealFallback } from './fallback-templates'
export { SEED_INGREDIENTS } from './seed-ingredients'
export { CANONICAL_DISHES, filterDishesByCuisines } from './seed-canonical-dishes'
export type { ItfCanonicalDish, ItfCuisine } from './seed-canonical-dishes'
