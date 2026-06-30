import type {
   ItfMealLog,
   ItfMealOfToday,
   ItfMealPlan,
   ItfTodayState,
   ItfMacrosConsumed
} from '@/interface/itfMeals'
import type { ItfMealType } from '@/features/meal-generator'

/**
 * Calcula el "estado del día" para el HomePage.
 *
 * Toma el plan vigente + los logs del día actual y devuelve un snapshot:
 *   - ¿Qué comidas tiene programadas hoy?
 *   - ¿Cuáles ya marcó como comidas/sustituidas/skippeadas?
 *   - ¿Cuántas kcal y macros lleva consumidas?
 *
 * Reglas:
 *   - dayIndex se calcula desde plan.created_at (día 0 = día de creación).
 *   - Si pasaron más días que plan.days, dayIndex se loopea (lectura cómoda
 *     para el usuario). Si necesitamos rigor, decidir con producto.
 *   - Logs del día actual se filtran por logged_at en el rango [00:00, 24:00)
 *     en el huso horario LOCAL del cliente.
 */
interface ComputeInput {
   plan: ItfMealPlan | null
   /** Logs del usuario (al menos los de hoy). */
   logs: ItfMealLog[]
   /** Fecha "hoy" (parametrizable para tests). */
   now?: Date
}

const SAME_LOCAL_DAY = (a: Date, b: Date): boolean =>
   a.getFullYear() === b.getFullYear() &&
   a.getMonth() === b.getMonth() &&
   a.getDate() === b.getDate()

export const computeTodayState = ({
   plan,
   logs,
   now = new Date()
}: ComputeInput): ItfTodayState => {
   const empty: ItfTodayState = {
      hasPlan: false,
      dayIndex: null,
      targetKcal: 0,
      targetProteinG: 0,
      targetCarbsG: 0,
      targetFatsG: 0,
      meals: [],
      consumed: { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 }
   }
   if (!plan) return empty

   /* dayIndex = días pasados desde plan.created_at, modulado a [0, plan.days). */
   const createdAt = new Date(plan.created_at)
   const elapsedMs = now.getTime() - createdAt.getTime()
   const dayDiff = Math.floor(elapsedMs / (24 * 60 * 60 * 1000))
   const dayIndex = ((dayDiff % plan.days) + plan.days) % plan.days

   const todaySchedule = plan.daily_schedule[dayIndex]
   if (!todaySchedule) {
      /* Plan tiene un dayIndex válido pero no hay schedule (caso raro de
       * plan corto). Devolvemos dayIndex correcto y meals vacío. */
      return {
         hasPlan: true,
         dayIndex,
         targetKcal: plan.target_kcal,
         targetProteinG: plan.target_protein_g,
         targetCarbsG: plan.target_carbs_g,
         targetFatsG: plan.target_fats_g,
         meals: [],
         consumed: { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 }
      }
   }

   /* Filtrar logs del día actual. */
   const todaysLogs = logs.filter((l) => SAME_LOCAL_DAY(new Date(l.logged_at), now))

   /* Index los logs por meal_type para lookup rápido. */
   const logByMeal = new Map<ItfMealType, ItfMealLog>()
   for (const log of todaysLogs) {
      if (log.meal_type) logByMeal.set(log.meal_type, log)
   }

   /* Construir la lista de comidas con su estado. */
   const meals: ItfMealOfToday[] = []
   const consumed: ItfMacrosConsumed = { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 }

   /* Orden cronológico fijo: el usuario espera ver las comidas en el orden
    * natural del día (desayuno primero, cena al final). Object.entries() NO
    * garantiza orden por las llaves del jsonb. */
   const CHRONOLOGICAL_ORDER: ItfMealType[] = [
      'breakfast',
      'snack_am',
      'lunch',
      'snack_pm',
      'dinner'
   ]
   const mealEntries: Array<[ItfMealType, (typeof todaySchedule.meals)[ItfMealType]]> =
      CHRONOLOGICAL_ORDER.filter((mt) => todaySchedule.meals[mt]).map((mt) => [
         mt,
         todaySchedule.meals[mt]
      ])

   for (const [mealType, assignment] of mealEntries) {
      if (!assignment) continue
      const recipe = plan.recipes_by_meal_type[mealType]?.[assignment.recipeIdx]
      if (!recipe) continue

      const log = logByMeal.get(mealType)
      const status: ItfMealOfToday['status'] = log ? log.status : 'pending'

      const meal: ItfMealOfToday = {
         meal_type: mealType,
         recipe_name: recipe.name,
         plannedKcal: assignment.scaledKcal,
         plannedProteinG: Math.round(recipe.components.actualMacros.proteinG),
         plannedCarbsG: Math.round(recipe.components.actualMacros.carbsG),
         plannedFatsG: Math.round(recipe.components.actualMacros.fatsG),
         status,
         logId: log?.id ?? null
      }
      meals.push(meal)

      /* Acumular macros consumidos. */
      if (log && log.status !== 'skipped') {
         consumed.kcal += log.kcal ?? meal.plannedKcal
         consumed.proteinG += log.protein_g ?? meal.plannedProteinG
         consumed.carbsG += log.carbs_g ?? meal.plannedCarbsG
         consumed.fatsG += log.fats_g ?? meal.plannedFatsG
      }
   }

   return {
      hasPlan: true,
      dayIndex,
      targetKcal: plan.target_kcal,
      targetProteinG: plan.target_protein_g,
      targetCarbsG: plan.target_carbs_g,
      targetFatsG: plan.target_fats_g,
      meals,
      consumed: {
         kcal: Math.round(consumed.kcal),
         proteinG: Math.round(consumed.proteinG),
         carbsG: Math.round(consumed.carbsG),
         fatsG: Math.round(consumed.fatsG)
      }
   }
}

/** Saludo según hora del día. Neutro LATAM. */
export const getTimeGreeting = (hour: number): string => {
   if (hour < 6) return '¿Madrugaste?'
   if (hour < 12) return 'Buenos días'
   if (hour < 18) return 'Buenas tardes'
   return 'Buenas noches'
}

/** Mensaje contextual según estado del día. */
export const getContextMessage = (state: ItfTodayState): string => {
   if (!state.hasPlan) return 'Generemos tu plan cuando quieras 🌱'
   const pending = state.meals.filter((m) => m.status === 'pending').length
   const done = state.meals.length - pending
   if (state.meals.length === 0) return 'Hoy no tienes comidas programadas 🌿'
   if (pending === 0) return '¡Día completo! 🌱'
   if (done === 0) return `Hoy tienes ${state.meals.length} comidas pensadas 🌿`
   return `Llevas ${done} de ${state.meals.length} comidas registradas 🌱`
}
