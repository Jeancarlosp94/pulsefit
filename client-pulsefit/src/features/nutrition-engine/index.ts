/* Motor nutricional. Lógica pura: TMB, GET, macros, validaciones de seguridad. */
export type {
   ItfSex,
   ItfGoal,
   ItfActivityLevel,
   ItfFitnessLevel,
   ItfTMBParams,
   ItfGETParams,
   ItfTargetKcalParams,
   ItfMacroParams,
   ItfMacroDistribution,
   ItfPlanInput,
   ItfValidationResult,
   ItfValidationReason,
   ItfNutritionSummary,
   ItfRecalcReason
} from './types'
export { calculateTMB } from './tmb'
export { calculateGET, ACTIVITY_FACTORS } from './get'
export { calculateTargetKcal } from './target-kcal'
export { distributeMacros } from './macros'
export { validateNutritionPlan, SAFETY_LIMITS } from './safety'
export { calculateHydrationMl } from './hydration'
export { shouldRecalculate } from './recalc-triggers'
export { computeNutritionSummary } from './summary'
