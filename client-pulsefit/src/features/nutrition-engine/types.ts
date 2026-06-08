/**
 * Tipos del motor nutricional. Todos los inputs y outputs son objetos
 * planos serializables — facilita testing y persistencia en Zustand.
 * Fuente de verdad de las fórmulas: files/formulas-nutricion.md (Lucía).
 */

export type ItfSex = 'male' | 'female' | 'prefer_not_to_say'

export type ItfGoal = 'lose' | 'gain' | 'maintain' | 'feel_better'

export type ItfActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export type ItfFitnessLevel = 'absolute_beginner' | 'beginner' | 'intermediate' | 'advanced'

export interface ItfTMBParams {
   weightKg: number
   heightCm: number
   age: number
   sex: ItfSex
}

export interface ItfGETParams {
   tmb: number
   activityLevel: ItfActivityLevel
}

export interface ItfTargetKcalParams {
   getKcal: number
   goal: ItfGoal
}

export interface ItfMacroParams {
   totalKcal: number
   weightKg: number
   goal: ItfGoal
}

export interface ItfMacroDistribution {
   proteinG: number
   carbsG: number
   fatsG: number
   totalKcal: number
}

export interface ItfPlanInput {
   sex: ItfSex
   targetKcal: number
   currentWeightKg: number
   targetWeightKg: number
   weeksToGoal: number
}

export type ItfValidationReason =
   | 'kcal_too_low'
   | 'loss_too_fast'
   | 'goal_inverted'
   | 'unrealistic_timeline'

export interface ItfValidationOk {
   ok: true
}

export interface ItfValidationFail {
   ok: false
   reason: ItfValidationReason
   message: string
   suggestedAdjustment?: Partial<{
      targetKcal: number
      weeksToGoal: number
      targetWeightKg: number
   }>
}

export type ItfValidationResult = ItfValidationOk | ItfValidationFail

export interface ItfNutritionSummary {
   tmb: number
   getKcal: number
   targetKcal: number
   proteinG: number
   carbsG: number
   fatsG: number
   hydrationMl: number
}

export type ItfRecalcReason =
   | 'weight_diff_significant'
   | 'four_weeks_passed'
   | 'activity_changed'
   | 'goal_changed'
   | 'none'
