/**
 * Tipos del motor de Rescates Adaptativos (Fase 8).
 *
 * Filosofía: el usuario tap'ea "Hoy no puedo" → recibe 3 alternativas
 * inteligentes que mantienen su objetivo del día sin juicio. Cada rescate
 * se registra en `rescue_events` para alimentar la revisión semanal.
 */

export type ItfRescueDomain = 'workout' | 'meal' | 'emotional'

export type ItfWorkoutTrigger = 'no_time' | 'no_energy' | 'low_mood' | 'away_from_home' | 'injury'

export type ItfMealTrigger =
   | 'no_cooking'
   | 'no_ingredients'
   | 'eating_out'
   | 'craving'
   | 'low_budget_today'

export type ItfEmotionalTrigger = 'overwhelmed' | 'binge' | 'low_mood_streak'

export type ItfRescueTrigger = ItfWorkoutTrigger | ItfMealTrigger | ItfEmotionalTrigger

export type ItfRescueSeverity = 'info' | 'warn' | 'escalation'

/** Una alternativa concreta que ofrecemos al usuario. */
export interface ItfRescueAlternative {
   id: string
   /** Tono breve para el botón principal (≤ 30 chars). */
   title: string
   /** Descripción accionable (≤ 140 chars). */
   description: string
   icon: string
   /** Para registrar qué eligió el usuario después. */
   action_label: string
}

/** Input que recibe el router de rescates. */
export interface ItfRescueRequest {
   domain: ItfRescueDomain
   trigger: ItfRescueTrigger
   /** Contexto opcional (ej: nombre del plato original, focus del entrenamiento). */
   context?: {
      meal_name?: string
      meal_type?: string
      workout_focus?: string
      affected_zone?: string
      cuisine?: string
   }
}

/** Output que la UI consume para presentar las opciones. */
export interface ItfRescueResponse {
   domain: ItfRescueDomain
   trigger: ItfRescueTrigger
   /** Texto compasivo que precede a las opciones. */
   intro: string
   alternatives: ItfRescueAlternative[]
   /** Indica si esto debe escalar (banderas rojas, mood persistente). */
   severity: ItfRescueSeverity
}

/** Registro persistido en la tabla `rescue_events`. */
export interface ItfRescueEvent {
   id: string
   user_id: string
   event_date: string
   event_time: string
   trigger_type: ItfRescueTrigger
   reason: string | null
   alternatives_offered: ItfRescueAlternative[]
   alternative_chosen: ItfRescueAlternative | null
   user_completed: boolean | null
}
