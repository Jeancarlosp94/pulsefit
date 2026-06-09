/**
 * Tipos del generador híbrido de comidas.
 * Source of truth: files/generadores-hibridos.md (secciones 2-4).
 */

import type { ItfGoal } from '@/features/nutrition-engine'

export type ItfMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack_am' | 'snack_pm'

export type ItfDifficulty = 'easy' | 'medium' | 'hard'

export interface ItfMacroTarget {
   kcal: number
   proteinG: number
   carbsG: number
   fatsG: number
}

export interface ItfIngredient {
   id: string
   name: string
   /** Categoría que usa el component-selector. */
   category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'condiment' | 'fruit' | 'dairy'
   kcalPer100g: number
   proteinPer100g: number
   carbsPer100g: number
   fatsPer100g: number
   /** Etiquetas que ayudan al filtrado: 'vegan', 'gluten_free', 'cheap', 'LATAM'… */
   tags: string[]
   /** Etiqueta de origen para auditoría. */
   source: 'openfoodfacts' | 'manual' | 'foods_cache'
   /**
    * meal_types apropiados para este ingrediente (validado por Lucía).
    * Si está vacío o no se especifica, se asume apto para todos.
    */
   appropriateMealTypes?: ItfMealType[]
}

export interface ItfIngredientServing {
   ingredient: ItfIngredient
   grams: number
}

export interface ItfMealComponents {
   protein: ItfIngredientServing
   carb: ItfIngredientServing
   fat: ItfIngredientServing
   vegetable: ItfIngredientServing
   condiments: ItfIngredient[]
   /** Resumen de macros REAL de la combinación (lo que la IA NO debe alterar). */
   actualMacros: ItfMacroTarget
}

export interface ItfPlateOption {
   name: string
   description: string
   prep_time_min: number
   difficulty: ItfDifficulty
   steps: string[]
}

export interface ItfGeneratedMeal {
   options: ItfPlateOption[]
   components: ItfMealComponents
   target: ItfMacroTarget
   source: 'ai' | 'ai_retry' | 'fallback'
}

export type ItfValidationReason =
   | 'invalid_json'
   | 'wrong_option_count'
   | 'missing_fields'
   | 'unknown_ingredient'
   | 'prep_time_out_of_range'
   | 'steps_out_of_range'
   | 'step_length'
   | 'bad_difficulty'
   | 'forbidden_words'

export interface ItfValidationOk {
   valid: true
   options: ItfPlateOption[]
}

export interface ItfValidationFail {
   valid: false
   reason: ItfValidationReason
   detail?: string
}

export type ItfValidationResult = ItfValidationOk | ItfValidationFail

export interface ItfUserContextForMeal {
   region: string
   goal: ItfGoal
   dietaryRestrictions: string[]
   allergies: string
   dislikedFoods: string[]
   budgetLevel: 'low' | 'medium' | 'high'
   cooksAtHome: 'yes' | 'sometimes' | 'rarely'
   /** Cuántas comidas por día hace el usuario (2-5). Default 3. */
   mealsPerDay: 2 | 3 | 4 | 5
}

export type ItfMealsPerDay = 2 | 3 | 4 | 5

/**
 * Distribuciones validadas por Lucía según `meals_per_day`:
 *   2 → ayuno intermitente 16:8 (almuerzo + cena).
 *   3 → patrón clásico (desayuno + almuerzo + cena).
 *   4 → + snack media tarde.
 *   5 → atletas / hipertrofia, distribuye proteína en más ingestas.
 *
 * Los ratios suman 1.0 en cada caso (sumas validadas en tests).
 */
export const MEAL_DISTRIBUTIONS: Record<ItfMealsPerDay, Partial<Record<ItfMealType, number>>> = {
   2: { lunch: 0.4, dinner: 0.6 },
   3: { breakfast: 0.3, lunch: 0.4, dinner: 0.3 },
   4: { breakfast: 0.25, lunch: 0.35, snack_pm: 0.15, dinner: 0.25 },
   5: {
      breakfast: 0.2,
      snack_am: 0.125,
      lunch: 0.3,
      snack_pm: 0.125,
      dinner: 0.25
   }
}

/** Compat: distribución por defecto (5 comidas). Mantener para no romper imports. */
export const MEAL_DISTRIBUTION: Record<ItfMealType, number> = {
   breakfast: 0.2,
   snack_am: 0.125,
   lunch: 0.3,
   snack_pm: 0.125,
   dinner: 0.25
}

/** Mínimos por meal_type según Lucía (en kcal absolutas, no proporciones). */
export const MEAL_MIN_KCAL: Record<ItfMealType, number> = {
   breakfast: 250,
   lunch: 350,
   dinner: 250,
   snack_am: 100,
   snack_pm: 100
}
