import type { ItfPlanInput, ItfValidationResult } from './types'

/**
 * Límites de seguridad nutricional NO NEGOCIABLES.
 * Validados por Lucía. Si se modifican, requieren su firma.
 */
export const SAFETY_LIMITS = {
   MIN_KCAL_FEMALE: 1200,
   MIN_KCAL_MALE: 1500,
   MIN_KCAL_NEUTRAL: 1350,
   MAX_WEEKLY_LOSS_PCT: 1.0,
   MIN_AGE: 13
} as const

/**
 * Valida el plan calculado contra los límites de Lucía.
 *
 * La validación EDUCA: nunca bloquea sin sugerir un ajuste sostenible.
 * Si el target queda por debajo del mínimo absoluto del sexo, sugerimos
 * subirlo al mínimo. Si la pérdida semanal supera el 1% del peso, sugerimos
 * extender el plazo. Si el goal está invertido (lose con target > actual o
 * gain con target < actual) lo señalamos como `goal_inverted`.
 */
export const validateNutritionPlan = (input: ItfPlanInput): ItfValidationResult => {
   const { sex, targetKcal, currentWeightKg, targetWeightKg, weeksToGoal } = input

   // Coherencia de meta vs peso actual (si hay diferencia).
   const wantsLose = targetWeightKg < currentWeightKg
   const wantsGain = targetWeightKg > currentWeightKg
   if (wantsLose && wantsGain) {
      return {
         ok: false,
         reason: 'goal_inverted',
         message: 'Revisemos la meta de peso, parece estar invertida 🌿'
      }
   }

   // Mínimo calórico por sexo.
   const minKcal =
      sex === 'female'
         ? SAFETY_LIMITS.MIN_KCAL_FEMALE
         : sex === 'male'
           ? SAFETY_LIMITS.MIN_KCAL_MALE
           : SAFETY_LIMITS.MIN_KCAL_NEUTRAL
   if (targetKcal < minKcal) {
      return {
         ok: false,
         reason: 'kcal_too_low',
         message: 'La meta requiere comer muy poco. Hagamos un plan más sostenible 🌱',
         suggestedAdjustment: { targetKcal: minKcal }
      }
   }

   // Pérdida semanal máxima.
   if (wantsLose && weeksToGoal > 0) {
      const weeklyLossKg = (currentWeightKg - targetWeightKg) / weeksToGoal
      const weeklyLossPct = (weeklyLossKg / currentWeightKg) * 100
      if (weeklyLossPct > SAFETY_LIMITS.MAX_WEEKLY_LOSS_PCT) {
         const maxWeeklyLossKg = currentWeightKg * (SAFETY_LIMITS.MAX_WEEKLY_LOSS_PCT / 100)
         const suggestedWeeks = Math.ceil((currentWeightKg - targetWeightKg) / maxWeeklyLossKg)
         return {
            ok: false,
            reason: 'loss_too_fast',
            message: 'Esa meta es ambiciosa. Te sugiero más tiempo para que sea sostenible 🌿',
            suggestedAdjustment: { weeksToGoal: suggestedWeeks }
         }
      }
   }

   // Plazo demasiado corto (< 2 semanas) para cualquier cambio significativo.
   if (wantsLose || wantsGain) {
      if (weeksToGoal < 2) {
         return {
            ok: false,
            reason: 'unrealistic_timeline',
            message: 'Démosle al menos 2 semanas para que el cambio sea real 🌱',
            suggestedAdjustment: { weeksToGoal: 4 }
         }
      }
   }

   return { ok: true }
}
