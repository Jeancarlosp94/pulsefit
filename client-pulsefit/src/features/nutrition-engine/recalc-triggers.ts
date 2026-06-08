import type { ItfActivityLevel, ItfGoal, ItfRecalcReason } from './types'

interface RecalcInput {
   lastWeightKg: number
   currentWeightKg: number
   lastRecalcAt: Date | string
   now: Date
   lastActivityLevel: ItfActivityLevel
   currentActivityLevel: ItfActivityLevel
   lastGoal: ItfGoal
   currentGoal: ItfGoal
}

const FOUR_WEEKS_MS = 4 * 7 * 24 * 60 * 60 * 1000

/**
 * Decide si hay que recalcular TMB/GET/macros. Reglas de Lucía:
 *   1. Cambio de peso ≥ 2 kg vs último cálculo.
 *   2. Pasaron ≥ 4 semanas desde el último recálculo.
 *   3. Cambió `activity_level`.
 *   4. Cambió el objetivo (lose ↔ gain ↔ maintain ↔ feel_better).
 *
 * Devuelve la primera razón que dispara el recálculo, o 'none'.
 */
export const shouldRecalculate = ({
   lastWeightKg,
   currentWeightKg,
   lastRecalcAt,
   now,
   lastActivityLevel,
   currentActivityLevel,
   lastGoal,
   currentGoal
}: RecalcInput): ItfRecalcReason => {
   if (Math.abs(currentWeightKg - lastWeightKg) >= 2) {
      return 'weight_diff_significant'
   }

   const lastDate = lastRecalcAt instanceof Date ? lastRecalcAt : new Date(lastRecalcAt)
   if (now.getTime() - lastDate.getTime() >= FOUR_WEEKS_MS) {
      return 'four_weeks_passed'
   }

   if (lastActivityLevel !== currentActivityLevel) {
      return 'activity_changed'
   }

   if (lastGoal !== currentGoal) {
      return 'goal_changed'
   }

   return 'none'
}
