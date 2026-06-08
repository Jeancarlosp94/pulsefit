/**
 * Tipos del lado cliente para el generador de comidas (Fase 5).
 * Espejan la respuesta de la Edge Function `generate-meal-options`.
 */

import type { ItfMacroTarget, ItfMealType, ItfPlateOption } from '@/features/meal-generator'

export interface ItfMealComponentSummary {
   name: string
   grams: number
}

export interface ItfMealGenerationResponse {
   options: ItfPlateOption[]
   target: ItfMacroTarget
   components: {
      protein: ItfMealComponentSummary
      carb: ItfMealComponentSummary
      fat: ItfMealComponentSummary
      vegetable: ItfMealComponentSummary | null
      actualMacros: ItfMacroTarget
   }
   source: 'ai' | 'ai_retry' | 'fallback'
}

export interface ItfGenerateMealParams {
   meal_type: ItfMealType
   override_target?: ItfMacroTarget
}
