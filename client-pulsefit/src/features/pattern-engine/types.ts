/**
 * Tipos del motor de Detección de Patrones (Fase 11).
 *
 * Filosofía: aprendemos del usuario en el tiempo sin invadir su intimidad.
 * Detectamos preferencias implícitas (qué le gusta, qué evita) y patrones
 * recurrentes (días difíciles, correlaciones bienestar↔actividad) para
 * proponerle ajustes suaves en su propio perfil "Lo que sabemos sobre ti".
 *
 * Todo es transparente: el usuario ve cada insight, puede borrar su
 * historial y desactivar la detección.
 */

export type ItfPatternSeverity = 'low' | 'medium' | 'high'

export type ItfPatternType =
   /** Comidas que sustituye con frecuencia (≥ 3 veces). */
   | 'frequently_substituted'
   /** Tipo de comida que se salta más del 50% del tiempo. */
   | 'often_skipped_meal_type'
   /** Usó "no_cooking" como trigger de rescate 3+ veces en el mes. */
   | 'avoids_cooking'
   /** Día de la semana con menor adherencia a comidas. */
   | 'low_adherence_day'
   /** Día de la semana con más entrenamientos. */
   | 'high_workout_day'
   /** Ánimo promedio es ≥ 0.5 puntos mejor los días que entrena. */
   | 'mood_better_with_workouts'
   /** Mood promedio < 2.5 los últimos 3+ registros. */
   | 'persistent_low_mood'
   /** Racha de hidratación (≥ 6 vasos/día) en los últimos 7 días. */
   | 'good_hydration_streak'
   /** Le cuesta seguir el plan de comidas (skipped > 40% de los logs). */
   | 'struggles_with_meals'

export interface ItfPattern {
   type: ItfPatternType
   /** Datos brutos del patrón (para la card de transparencia). */
   data: Record<string, string | number | string[]>
}

export interface ItfRecommendation {
   id: string
   pattern_type: ItfPatternType
   severity: ItfPatternSeverity
   icon: string
   /** Título corto (≤ 60 chars). */
   title: string
   /** Mensaje compasivo con tono cálido (≤ 220 chars). */
   message: string
}

/** Input que recibe el motor — datos crudos ya cargados del cliente. */
export interface PatternEngineInput {
   meals: Array<{ logged_at: string; status: string; meal_type: string; recipe_name: string }>
   workouts: Array<{ logged_at: string }>
   moods: Array<{ log_date: string; energy_level: number; mood_level: number }>
   water: Array<{ logged_at: string; delta_glasses: number }>
   rescues: Array<{ event_date: string; trigger_type: string }>
}
