import type { ItfAdjustment, ItfAdjustmentType, ItfWeeklyMetrics } from './types'

export interface ProfileForReview {
   target_kcal: number | null
   weight_kg: number | null
   goal: 'lose' | 'gain' | 'maintain' | 'feel_better' | null
   /** Sprint 11.5A: si true → modo intuitivo, sin sugerencias calóricas. */
   eating_disorder_history?: boolean
}

let idCounter = 0
const nextId = (type: ItfAdjustmentType): string => `adj_${type}_${++idCounter}`

/**
 * Reglas firmadas por Lucía + Carlos. Aplican límites de seguridad
 * (Lucía: máx -150 kcal/sem; Carlos: nunca progresar si adherencia < 50%).
 * Devuelve los ajustes ordenados por prioridad.
 */
export const proposeAdjustments = (
   metrics: ItfWeeklyMetrics,
   profile: ProfileForReview
): ItfAdjustment[] => {
   idCounter = 0
   const adjustments: ItfAdjustment[] = []
   const weight = profile.weight_kg ?? 70
   const targetKcal = profile.target_kcal ?? 2000

   /* === MODO INTUITIVO (TCA history): saltar todas las reglas calóricas. === */
   const intuitiveMode = profile.eating_disorder_history === true

   /* === CALORÍAS === */
   if (!intuitiveMode && metrics.weight_change_kg !== null) {
      const pctChange = (metrics.weight_change_kg / weight) * 100
      if (pctChange < -1.0 && profile.goal === 'lose') {
         /* Bajaste más del 1% en una semana → restituir 200 kcal (regla Lucía). */
         adjustments.push({
            id: nextId('kcal_increase'),
            type: 'kcal_increase',
            title: `Subir calorías a ${targetKcal + 200} kcal`,
            reason:
               'Estás bajando más rápido que el ritmo seguro. Subir un poco protege músculo y energía.',
            priority: 'high',
            payload: { kcalDelta: 200, newTarget: targetKcal + 200 }
         })
      } else if (
         Math.abs(pctChange) < 0.2 &&
         profile.goal === 'lose' &&
         metrics.meal_adherence_pct > 70
      ) {
         /* Estancamiento con buena adherencia → -100 kcal. */
         adjustments.push({
            id: nextId('kcal_decrease'),
            type: 'kcal_decrease',
            title: `Bajar calorías a ${targetKcal - 100} kcal`,
            reason:
               'Tu peso se estancó esta semana con buena adherencia. Un ajuste suave puede reactivar el progreso.',
            priority: 'medium',
            payload: { kcalDelta: -100, newTarget: targetKcal - 100 }
         })
      } else {
         adjustments.push({
            id: nextId('kcal_keep'),
            type: 'kcal_keep',
            title: 'Mantener calorías como están',
            reason:
               'Tu cambio de peso esta semana fue razonable. No hace falta tocar nada todavía.',
            priority: 'low'
         })
      }
   }

   /* === ENTRENAMIENTO === */
   if (metrics.workouts_count >= 3 && metrics.rpe_average !== null) {
      if (metrics.rpe_average < 6.5) {
         adjustments.push({
            id: nextId('workout_progress'),
            type: 'workout_progress',
            title: 'Subir un poco la intensidad',
            reason:
               'Promediaste RPE bajo. Cumpliendo bien la frecuencia, podemos subir 5% peso o 1 rep.',
            priority: 'medium'
         })
      } else if (metrics.rpe_average > 8.5) {
         adjustments.push({
            id: nextId('workout_simplify'),
            type: 'workout_simplify',
            title: 'Aliviar el entreno la próxima semana',
            reason:
               'Tu RPE promedio fue muy alto. Una semana al 80% protege articulaciones y motivación.',
            priority: 'high'
         })
      }
   }
   if (metrics.workouts_count === 0) {
      adjustments.push({
         id: nextId('rest_more'),
         type: 'rest_more',
         title: 'Una micro-rutina la próxima semana',
         reason:
            'Esta semana no hubo entrenamientos. Probemos con 1-2 sesiones cortas, sin obligación.',
         priority: 'low'
      })
   }

   /* === HIDRATACIÓN === */
   if (metrics.water_avg_glasses < 5) {
      adjustments.push({
         id: nextId('hydration_focus'),
         type: 'hydration_focus',
         title: 'Subir hidratación esta semana',
         reason:
            'Promediaste menos de 5 vasos por día. Llegar a 6-8 mejora energía y digestión rapidísimo.',
         priority: 'medium'
      })
   }

   /* === ÁNIMO === */
   if (metrics.mood_average !== null && metrics.mood_average < 2.5 && metrics.mood_days >= 3) {
      adjustments.push({
         id: nextId('mood_check_in'),
         type: 'mood_check_in',
         title: 'Considerá hablar con un profesional',
         reason:
            'Tu ánimo promedio fue bajo esta semana. Buscar apoyo psicológico es valentía, no debilidad 🌿',
         priority: 'high'
      })
   }

   /* Orden: high → medium → low. */
   const rank: Record<ItfAdjustment['priority'], number> = { high: 0, medium: 1, low: 2 }
   adjustments.sort((a, b) => rank[a.priority] - rank[b.priority])
   return adjustments
}
