import type {
   ItfExerciseModality,
   ItfOrganizedSession,
   ItfPrescribedExercise,
   ItfSessionFocus
} from '@/features/routine-generator'

export interface ItfWorkoutGenerationResponse {
   session: ItfOrganizedSession
   prescribed: ItfPrescribedExercise[]
   focus: ItfSessionFocus
   isDeloadWeek: boolean
   prescribedRpe: number
   source: 'ai' | 'ai_retry' | 'fallback'
}

export interface ItfGenerateWorkoutParams {
   day_of_week: number
   override_focus?: ItfSessionFocus
   /** Sprint 11.11: modalidad activa desde el programa del usuario. */
   modality?: ItfExerciseModality
}

/* ============================================================
 *  Sprint 3 — Log de cargas + progresión
 * ============================================================ */

/** Tipos de actividad soportados (Sprint 11.7).
 *   - strength: ejercicios con sets/reps/peso/RPE (default histórico).
 *   - cardio: corrida, bici, elíptica → duration + intensity.
 *   - sport: fútbol, vóley, tenis → duration + intensity + activity_name.
 *   - dance: bachata, zumba, ballet → duration + intensity + activity_name.
 *   - movement: caminata, yoga, estiramiento → duration + intensity.
 */
export type ItfActivityType = 'strength' | 'cardio' | 'sport' | 'dance' | 'movement'

/** Una entrada de log = un ejercicio o actividad registrada. */
export interface ItfWorkoutLog {
   id: string
   user_id: string
   logged_at: string
   activity_type: ItfActivityType
   /* Strength: */
   exercise_id: string | null
   exercise_name: string | null
   sets_completed: number | null
   reps_completed: number | null
   weight_kg: number | null
   rpe_actual: number | null
   /* No-strength: */
   activity_name: string | null /* "Fútbol", "Bachata", "Caminata" */
   duration_min: number | null
   intensity: number | null /* 1-5 */
   notes: string | null
   session_id: string | null
   /* Sprint 11.12 — rutina custom registrada por el usuario: */
   calories_burned: number | null
   workout_subtype: string | null
   perceived_effort: string | null
}

export interface ItfLogSetInput {
   exercise_id: string
   exercise_name: string
   sets_completed: number
   reps_completed: number
   weight_kg: number
   rpe_actual?: number
   notes?: string
   session_id?: string
}

/** Sprint 11.7: log de actividad no-strength. */
export interface ItfLogActivityInput {
   activity_type: 'cardio' | 'sport' | 'dance' | 'movement'
   activity_name: string
   duration_min: number
   intensity: 1 | 2 | 3 | 4 | 5
   notes?: string
}

/**
 * Sprint 11.12: log de rutina custom (cuando el usuario ya tiene SU propia
 * rutina y la registra para que la app calcule el impacto).
 *
 * Diferencia con ItfLogActivityInput:
 *   - workout_subtype categoriza la rutina (gym/hiit/yoga/etc) para MET correcto.
 *   - calories_burned se calcula en cliente con met-table + peso actual.
 *   - activity_type siempre 'movement' (rutinas custom no encajan en cardio/sport/dance).
 */
export interface ItfLogCustomRoutineInput {
   activity_name: string /* "Mi rutina del lunes", "Sesión rápida" */
   workout_subtype:
      | 'strength'
      | 'calistenia'
      | 'hiit'
      | 'yoga'
      | 'pilates'
      | 'barre'
      | 'crossfit'
      | 'cardio'
      | 'running'
      | 'cycling'
      | 'swimming'
      | 'dance'
      | 'sport'
      | 'mixed'
   duration_min: number /* 1-300 */
   intensity: 1 | 2 | 3 | 4 | 5
   calories_burned: number /* Calculado por cliente con met-table. */
   perceived_effort?: string /* "Tranquila", "Justa", "Intensa". Cualitativo. */
   notes?: string
}

/** Sugerencia de progresión para la próxima sesión de un ejercicio. */
export interface ItfProgressionSuggestion {
   /** Peso sugerido. */
   weightKg: number
   /** Repeticiones sugeridas (puede igualar la prescripción del prompt). */
   reps: number
   /** Mensaje al usuario que justifica la sugerencia. */
   reason: string
   /** Confianza: 'first_time' | 'maintain' | 'progress'. */
   kind: 'first_time' | 'maintain' | 'progress' | 'deload'
}
