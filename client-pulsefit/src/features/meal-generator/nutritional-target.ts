import { MEAL_DISTRIBUTION, type ItfMacroTarget, type ItfMealType } from './types'

interface CalcInput {
   dailyKcal: number
   dailyProteinG: number
   dailyCarbsG: number
   dailyFatsG: number
   mealType: ItfMealType
}

/**
 * Calcula el target macroespecífico de una comida concreta a partir del
 * objetivo diario del perfil. La distribución (25 / 35 / 30 / 5 / 5) es
 * la convención de Lucía validada en files/formulas-nutricion.md.
 *
 * Función PURA, totalmente testeable. Cero red, cero stores.
 */
export const computeMealTarget = ({
   dailyKcal,
   dailyProteinG,
   dailyCarbsG,
   dailyFatsG,
   mealType
}: CalcInput): ItfMacroTarget => {
   const ratio = MEAL_DISTRIBUTION[mealType]
   return {
      kcal: Math.round(dailyKcal * ratio),
      proteinG: Math.round(dailyProteinG * ratio),
      carbsG: Math.round(dailyCarbsG * ratio),
      fatsG: Math.round(dailyFatsG * ratio)
   }
}
