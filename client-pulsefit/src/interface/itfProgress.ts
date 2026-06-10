/**
 * Tipos del feature de Progreso (Fase 9).
 */

export interface ItfWeightPoint {
   date: string /* YYYY-MM-DD */
   weight_kg: number
}

export interface ItfWellbeingPoint {
   date: string /* YYYY-MM-DD */
   energy: number
   mood: number
}

export interface ItfAdherenceSummary {
   /** Días con al menos 1 registro (mealLog / workoutLog / waterLog / weightLog / moodLog). */
   active_days_30: number
   /** Comidas registradas vs comidas planeadas en últimos 7 días (porcentaje 0-100). */
   meals_adherence_pct: number
   /** Cantidad de entrenamientos registrados en los últimos 7 días. */
   workouts_last_week: number
   /** Racha actual: días consecutivos con al menos 1 registro hasta hoy. */
   current_streak: number
}

export interface ItfStrengthProgressPoint {
   exercise_id: string
   exercise_name: string
   /** Series de logs ordenadas por fecha. */
   history: Array<{ date: string; weight_kg: number; reps: number; rpe: number | null }>
   /** Máximo peso registrado. */
   pr_kg: number
   /** Cambio vs la primera entrada (positivo = mejoró). */
   delta_kg: number
}

export interface ItfAchievement {
   id: string
   code: string
   name: string
   description: string
   icon: string
   criteria: Record<string, unknown>
}

export interface ItfUserAchievement {
   id: string
   user_id: string
   achievement_id: string
   unlocked_at: string
   achievement: ItfAchievement
}

/** Snapshot completo del progreso, lo que consume ProgresoPage. */
export interface ItfProgressData {
   weight: ItfWeightPoint[]
   wellbeing: ItfWellbeingPoint[]
   adherence: ItfAdherenceSummary
   strength: ItfStrengthProgressPoint[]
}
