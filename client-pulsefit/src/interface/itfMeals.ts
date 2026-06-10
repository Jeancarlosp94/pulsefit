/**
 * Tipos del lado cliente para el generador de comidas (Fase 5).
 * Espejan la respuesta de la Edge Function `generate-meal-options`.
 */

import type { ItfMacroTarget, ItfMealType, ItfPlateOption } from '@/features/meal-generator'

export interface ItfMealComponentSummary {
   name: string
   /** Ingredient id (para que el cliente pueda bloquearlo de futuras generaciones). */
   id?: string
   grams: number
}

export interface ItfOptionComponents {
   protein: ItfMealComponentSummary
   carb: ItfMealComponentSummary
   fat: ItfMealComponentSummary
   vegetable: ItfMealComponentSummary | null
   actualMacros: ItfMacroTarget
}

/** Cada opción ahora trae SUS componentes (variedad real entre las 3). */
export interface ItfPlateOptionWithComponents extends ItfPlateOption {
   components: ItfOptionComponents
   /** Origen de esta opción específica (la opción puede ser ai u opción puede ser fallback aunque otra sea ai). */
   source?: 'ai' | 'ai_retry' | 'fallback'
}

export interface ItfMealGenerationResponse {
   options: ItfPlateOptionWithComponents[]
   target: ItfMacroTarget
   /** Source global: 'ai' si todas las opciones vinieron de IA, 'fallback' si todas son plantilla. */
   source: 'ai' | 'ai_retry' | 'fallback' | 'mixed'
}

export interface ItfGenerateMealParams {
   meal_type: ItfMealType
   override_target?: ItfMacroTarget
   /** IDs de ingredientes a excluir en esta generación (botón X en el cliente). */
   excluded_ingredient_ids?: string[]
}

/* ============================================================
 *  Fase 6 — Plan Semanal Dinámico
 * ============================================================ */

/** Receta abstracta (mismo formato para todas las 3 opciones de un meal_type). */
export interface ItfRecipe {
   name: string
   description: string
   prep_time_min: number
   difficulty: 'easy' | 'medium' | 'hard'
   steps: string[]
   components: ItfOptionComponents
   /** Kcal de referencia con que se generaron las gramas base de los componentes. */
   baseKcal: number
   source: 'ai' | 'ai_retry' | 'fallback'
}

/** Asignación de un slot (meal_type) en un día específico. */
export interface ItfMealAssignment {
   /** Índice 0..2 de cuál receta rota a este día. */
   recipeIdx: number
   /** Kcal real escalada para que la suma diaria == target_kcal. */
   scaledKcal: number
   /** Gramos por componente escalados al scaledKcal. */
   scaledGrams: {
      protein: number
      carb: number
      fat: number
      vegetable: number
   }
   /** Sustituciones manuales del usuario para ese día específico.
    * Cuando está presente, el cliente renderiza el override en lugar del
    * componente original de la receta. NO afecta a otros días que usan
    * la misma receta. */
   componentOverrides?: Partial<{
      protein: ItfMealComponentSummary
      carb: ItfMealComponentSummary
      fat: ItfMealComponentSummary
      vegetable: ItfMealComponentSummary
   }>
}

/** Schedule de un día completo. */
export interface ItfDailySchedule {
   day: number /* 1..N */
   meals: Partial<Record<ItfMealType, ItfMealAssignment>>
   /** Suma de kcal del día (debe == target_kcal del plan, EXACTO). */
   totalKcal: number
}

/** Plan completo persistido en `meal_plans`. */
export interface ItfMealPlan {
   id: string
   user_id: string
   created_at: string
   days: number
   meals_per_day: 2 | 3 | 4 | 5
   target_kcal: number
   target_protein_g: number
   target_carbs_g: number
   target_fats_g: number
   excluded_ingredient_ids: string[]
   /** 3 recetas por meal_type activo. */
   recipes_by_meal_type: Partial<Record<ItfMealType, ItfRecipe[]>>
   daily_schedule: ItfDailySchedule[]
   source: 'ai' | 'fallback' | 'mixed'
}

export interface ItfGenerateMealPlanParams {
   days: number /* 1..7 */
   excluded_ingredient_ids?: string[]
}

export interface ItfMealPlanResponse {
   plan: ItfMealPlan
}

/* ============================================================
 *  Fase 7 — Estado del día + registro rápido
 * ============================================================ */

export type ItfMealLogStatus = 'planned' | 'substituted' | 'skipped'

export interface ItfMealLog {
   id: string
   user_id: string
   logged_at: string
   plan_id: string | null
   day_index: number | null
   meal_type: ItfMealType | null
   status: ItfMealLogStatus
   recipe_name: string | null
   kcal: number | null
   protein_g: number | null
   carbs_g: number | null
   fats_g: number | null
   notes: string | null
}

export interface ItfLogMealInput {
   plan_id?: string
   day_index?: number
   meal_type: ItfMealType
   status: ItfMealLogStatus
   recipe_name?: string
   kcal?: number
   protein_g?: number
   carbs_g?: number
   fats_g?: number
   notes?: string
}

/** Snapshot del día: lo que el usuario tiene "pendiente vs hecho" hoy. */
export interface ItfMealOfToday {
   meal_type: ItfMealType
   recipe_name: string
   plannedKcal: number
   plannedProteinG: number
   plannedCarbsG: number
   plannedFatsG: number
   status: ItfMealLogStatus | 'pending'
   logId: string | null
}

export interface ItfMacrosConsumed {
   kcal: number
   proteinG: number
   carbsG: number
   fatsG: number
}

export interface ItfTodayState {
   /** ¿La persona tiene un plan vigente? */
   hasPlan: boolean
   /** Índice del día actual dentro del plan (0..days-1). null si está fuera de rango. */
   dayIndex: number | null
   /** Total target del día (del plan). */
   targetKcal: number
   targetProteinG: number
   targetCarbsG: number
   targetFatsG: number
   /** Comidas del día con su estado. */
   meals: ItfMealOfToday[]
   /** Macros ya consumidas (suma de status != skipped). */
   consumed: ItfMacrosConsumed
}
