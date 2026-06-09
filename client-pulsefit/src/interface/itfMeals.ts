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
