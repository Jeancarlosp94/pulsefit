import { calculateTMB } from './tmb'
import { calculateGET } from './get'
import { calculateTargetKcal } from './target-kcal'
import { distributeMacros } from './macros'
import { calculateHydrationMl } from './hydration'
import type { ItfActivityLevel, ItfGoal, ItfNutritionSummary, ItfSex } from './types'

interface SummaryInput {
   weightKg: number
   heightCm: number
   age: number
   sex: ItfSex
   activityLevel: ItfActivityLevel
   goal: ItfGoal
}

/**
 * Orquesta el cálculo completo TMB → GET → targetKcal → macros → hidratación.
 * Devuelve TODO lo que persistimos en `profiles` al cerrar Step 7 del onboarding.
 *
 * Función pura: misma entrada → misma salida. Totalmente testeable.
 */
export const computeNutritionSummary = ({
   weightKg,
   heightCm,
   age,
   sex,
   activityLevel,
   goal
}: SummaryInput): ItfNutritionSummary => {
   const tmb = calculateTMB({ weightKg, heightCm, age, sex })
   const getKcal = calculateGET({ tmb, activityLevel })
   const targetKcal = calculateTargetKcal({ getKcal, goal })
   const macros = distributeMacros({ totalKcal: targetKcal, weightKg, goal })
   const hydrationMl = calculateHydrationMl(weightKg)

   return {
      tmb,
      getKcal,
      targetKcal,
      proteinG: macros.proteinG,
      carbsG: macros.carbsG,
      fatsG: macros.fatsG,
      hydrationMl
   }
}
