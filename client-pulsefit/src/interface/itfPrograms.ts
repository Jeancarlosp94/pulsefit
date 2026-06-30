/**
 * Tipos del sistema de Programas "Crear mi PulseFit" (Sprint 11.10).
 *
 * Filosofía: el usuario define una meta + duración + modalidad por fase.
 * La app entrega contexto al motor de rutinas para que cada sesión respete
 * la modalidad actual. Si el usuario está en fase de Yoga, no le sugerimos
 * sentadillas con barra; si está en HIIT, no le sugerimos asanas.
 */

export type ItfProgramGoal = 'lose_weight' | 'gain_muscle' | 'feel_better' | 'event' | 'maintenance'

export type ItfProgramStatus = 'active' | 'completed' | 'paused' | 'cancelled'

export type ItfModality =
   | 'hiit'
   | 'gym'
   | 'calistenia'
   | 'yoga'
   | 'barre'
   | 'pilates'
   | 'running'
   | 'cycling'
   | 'swimming'
   | 'sport'
   | 'hybrid'

export type ItfPhaseFocus = 'full_body' | 'upper' | 'lower' | 'core' | 'cardio'

export type ItfPhaseIntensity = 'light' | 'moderate' | 'intense'

export interface ItfTrainingPhase {
   id: string
   program_id: string
   phase_order: number
   phase_name: string
   modality: ItfModality
   weeks: number
   sessions_per_week: number
   intensity_target: ItfPhaseIntensity
   focus: ItfPhaseFocus
   description: string | null
}

export interface ItfTrainingProgram {
   id: string
   user_id: string
   created_at: string
   updated_at: string
   name: string
   goal_type: ItfProgramGoal
   target_weight_kg: number | null
   target_date: string | null
   total_weeks: number
   start_date: string
   status: ItfProgramStatus
   notes: string | null
   /* Cargados con join. */
   phases: ItfTrainingPhase[]
}

/** Input para crear un programa nuevo desde el wizard. */
export interface ItfCreateProgramInput {
   name: string
   goal_type: ItfProgramGoal
   target_weight_kg?: number | null
   target_date?: string | null
   total_weeks: number
   start_date?: string /* default: hoy */
   notes?: string
   phases: Array<Omit<ItfTrainingPhase, 'id' | 'program_id'>>
}

/** Fase activa en una fecha dada (típicamente hoy). */
export interface ItfActivePhase {
   phase: ItfTrainingPhase
   /** Semana actual dentro de la fase (1-indexed). */
   week_in_phase: number
   /** Semana global dentro del programa (1-indexed). */
   week_in_program: number
   /** Cuántas semanas restan en esta fase. */
   weeks_remaining: number
   /** Cuántas semanas restan en el programa entero. */
   total_weeks_remaining: number
}
