import type {
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
}

/* ============================================================
 *  Sprint 3 — Log de cargas + progresión
 * ============================================================ */

/** Una entrada de log = un ejercicio registrado en una sesión específica. */
export interface ItfWorkoutLog {
   id: string
   user_id: string
   logged_at: string
   exercise_id: string
   exercise_name: string
   sets_completed: number
   reps_completed: number
   weight_kg: number
   rpe_actual: number | null
   notes: string | null
   session_id: string | null
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
