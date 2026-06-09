import {
   MEAL_DISTRIBUTIONS,
   MEAL_MIN_KCAL,
   type ItfMacroTarget,
   type ItfMealsPerDay,
   type ItfMealType
} from './types'

interface CalcInput {
   dailyKcal: number
   dailyProteinG: number
   dailyCarbsG: number
   dailyFatsG: number
   mealType: ItfMealType
   /** Cuántas comidas hace el usuario por día (2-5). Default 3. */
   mealsPerDay?: ItfMealsPerDay
}

/**
 * Devuelve los `meal_types` activos según `meals_per_day`. Útil para que la
 * UI muestre solo las opciones que corresponden y para validar requests.
 */
export const getActiveMealTypes = (mealsPerDay: ItfMealsPerDay): ItfMealType[] => {
   return Object.keys(MEAL_DISTRIBUTIONS[mealsPerDay]) as ItfMealType[]
}

/**
 * Calcula el target macroespecífico de una comida concreta a partir del
 * objetivo diario del perfil.
 *
 * La distribución es DINÁMICA según `mealsPerDay`:
 *   2 → 40 / 60 (lunch / dinner)
 *   3 → 30 / 40 / 30 (breakfast / lunch / dinner)
 *   4 → 25 / 35 / 15 / 25 (+ snack_pm)
 *   5 → 20 / 12.5 / 30 / 12.5 / 25 (+ snack_am)
 *
 * Si el `mealType` solicitado NO existe en la distribución (ej. pedir snack_am
 * en plan de 3 comidas), devuelve `null`.
 *
 * Función PURA, sin red, sin stores.
 */
export const computeMealTarget = ({
   dailyKcal,
   dailyProteinG,
   dailyCarbsG,
   dailyFatsG,
   mealType,
   mealsPerDay = 3
}: CalcInput): ItfMacroTarget | null => {
   const distribution = MEAL_DISTRIBUTIONS[mealsPerDay]
   const ratio = distribution[mealType]
   if (ratio === undefined) return null

   /* Validación de Lucía: el target calórico nunca debe quedar por debajo
    * del mínimo absoluto de la comida (250 kcal breakfast/dinner, 350
    * lunch, 100 snacks). */
   const minKcal = MEAL_MIN_KCAL[mealType]
   const rawKcal = dailyKcal * ratio
   const kcal = Math.max(minKcal, Math.round(rawKcal))

   return {
      kcal,
      proteinG: Math.round(dailyProteinG * ratio),
      carbsG: Math.round(dailyCarbsG * ratio),
      fatsG: Math.round(dailyFatsG * ratio)
   }
}
