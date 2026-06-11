/**
 * Tipos del motor de Revisión Semanal (Fase 10).
 *
 * Filosofía: cada 7 días, mostramos al usuario un resumen empático de
 * su semana + ajustes sugeridos al plan. El analizador es 100%
 * determinístico. La IA SOLO redacta el mensaje narrativo (sin inventar
 * números). El validador rechaza outputs con palabras prohibidas o
 * métricas alucinadas.
 */

export interface ItfWeeklyMetrics {
   /** Rango ISO YYYY-MM-DD. */
   week_start: string
   week_end: string
   /** % comidas registradas (status != skipped) vs esperadas en la semana. */
   meal_adherence_pct: number
   /** # entrenamientos registrados en la semana. */
   workouts_count: number
   /** Promedio RPE de la semana (null si no hay logs). */
   rpe_average: number | null
   /** Cambio de peso entre primer y último registro de la semana. */
   weight_change_kg: number | null
   /** Días con registro de mood. */
   mood_days: number
   energy_average: number | null
   mood_average: number | null
   /** Cantidad de rescates usados en la semana. */
   rescues_used: number
   /** Vasos de agua promedio por día. */
   water_avg_glasses: number
   /** Racha actual a final de semana. */
   streak_days: number
}

export type ItfAdjustmentType =
   | 'kcal_increase'
   | 'kcal_decrease'
   | 'kcal_keep'
   | 'workout_progress'
   | 'workout_simplify'
   | 'rest_more'
   | 'hydration_focus'
   | 'mood_check_in'

export interface ItfAdjustment {
   id: string
   type: ItfAdjustmentType
   /** Texto corto que el usuario verá (≤ 60 chars). */
   title: string
   /** Por qué proponemos esto (≤ 160 chars). */
   reason: string
   /** Severidad para priorizar visualmente. */
   priority: 'high' | 'medium' | 'low'
   /** Datos para aplicar el ajuste (ej: { kcalDelta: -100 }). */
   payload?: Record<string, number | string>
}

export interface ItfReviewSummary {
   /** Saludo personalizado (1 oración). */
   greeting: string
   /** Resumen empático de la semana (2-3 oraciones). */
   summary: string
   /** Logros concretos (chips). */
   highlights: string[]
   /** Frase introduciendo los ajustes. */
   adjustments_intro: string
   /** Mensaje de apoyo de cierre (1 oración). */
   closing: string
   /** De dónde vino el texto: IA o fallback determinístico. */
   source: 'ai' | 'fallback'
}

export interface ItfWeeklyReview {
   metrics: ItfWeeklyMetrics
   adjustments: ItfAdjustment[]
   summary: ItfReviewSummary
}

/** Decisión del usuario sobre cada ajuste — la persistimos en `reviews`. */
export interface ItfReviewDecisions {
   accepted_ids: string[]
   rejected_ids: string[]
}
