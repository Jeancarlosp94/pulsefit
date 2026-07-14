import { supabase } from './supabaseConf'
import type { ItfMealPlan, ItfMealAssignment, ItfMealComponentSummary } from '@/interface/itfMeals'
import type { ItfMealType } from '@/features/meal-generator'

interface SwapInput {
   plan: ItfMealPlan
   dayIndex: number /* 0..days-1 */
   mealType: ItfMealType
   slot: 'protein' | 'carb' | 'fat' | 'vegetable'
   newComponent: ItfMealComponentSummary
   /** Nuevo gramaje re-escalado (calculado por rescaleGrams). */
   newGrams: number
}

/**
 * Sustituye UN componente de una comida específica de un día específico
 * sin regenerar el plan completo.
 *
 * Estrategia:
 *   1. Copia el daily_schedule completo.
 *   2. En el día/mealType target, mete el override en componentOverrides
 *      y actualiza scaledGrams[slot] al nuevo gramaje.
 *   3. UPDATE en meal_plans (RLS verifica que el user_id sea el dueño).
 *   4. Devuelve el plan actualizado.
 *
 * NOTA: NO recalcula scaledKcal — la diferencia es típicamente pequeña
 * porque rescaleGrams mantiene aprox las mismas kcal del slot.
 */
export const fntSwapIngredient = async (input: SwapInput): Promise<ItfMealPlan> => {
   const { plan, dayIndex, mealType, slot, newComponent, newGrams } = input

   const updatedSchedule = plan.daily_schedule.map((day, idx) => {
      if (idx !== dayIndex) return day
      const meal = day.meals[mealType]
      if (!meal) return day
      const updatedMeal: ItfMealAssignment = {
         ...meal,
         scaledGrams: {
            ...meal.scaledGrams,
            [slot]: newGrams
         },
         componentOverrides: {
            ...meal.componentOverrides,
            [slot]: newComponent
         }
      }
      return {
         ...day,
         meals: {
            ...day.meals,
            [mealType]: updatedMeal
         }
      }
   })

   /* Cast a never para esquivar el typing estricto de supabase-js v2 cuando
    * la columna jsonb no está modelada. RLS protege que solo el dueño actualice.
    *
    * Sprint 11.17: usamos .maybeSingle() en lugar de .single() para detectar
    * el caso RLS-bloquea (0 filas retornadas, sin error). Sin este chequeo el
    * usuario veía toast de éxito pero el cambio no persistía. */
   const { data, error } = await supabase
      .from('meal_plans')
      .update({ daily_schedule: updatedSchedule } as never)
      .eq('id', plan.id)
      .select('*')
      .maybeSingle()

   if (error) {
      const wrapped = new Error(
         `No pudimos cambiar el ingrediente: ${error.message.slice(0, 100)} 🌿`
      )
      ;(wrapped as { status?: number }).status = 500
      throw wrapped
   }
   if (!data) {
      const wrapped = new Error(
         'Falta permiso de escritura en tu plan. Aplica la migración 20260714000000 y vuelve a intentar 🌿'
      )
      ;(wrapped as { status?: number }).status = 403
      throw wrapped
   }
   return data as ItfMealPlan
}
