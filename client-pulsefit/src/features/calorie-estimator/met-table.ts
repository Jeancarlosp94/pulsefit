/**
 * Tabla MET (Metabolic Equivalent of Task) por tipo de actividad e intensidad.
 *
 * Fuente:
 *   - Ainsworth BE et al. "2011 Compendium of Physical Activities: A Second
 *     Update of Codes and MET Values." Med Sci Sports Exerc. 2011;43(8):1575-81.
 *   - Para CrossFit/HIIT (no estaban en 2011) usamos rangos publicados en
 *     Crawford 2018 y Kliszczewicz 2015.
 *
 * Fórmula:
 *   kcal = MET × peso_kg × (duration_min / 60)
 *
 * Intensidad subjetiva 1-5 mapea a:
 *   1 = muy ligera, 2 = ligera, 3 = moderada, 4 = vigorosa, 5 = muy vigorosa
 *
 * IMPORTANTE: esto es una estimación. La variabilidad individual real
 * puede ser ±20%. No se usa para prescripción médica.
 */

import type { ItfLogCustomRoutineInput } from '@/interface/itfWorkouts'

export type ItfWorkoutSubtype = ItfLogCustomRoutineInput['workout_subtype']

/**
 * METs por subtipo × intensidad (1-5).
 * Los rangos son representativos del Compendium.
 */
const MET_TABLE: Record<ItfWorkoutSubtype, [number, number, number, number, number]> = {
   /* Fuerza con pesas: 3.5 light → 6.0 vigorous. */
   strength: [3.0, 3.5, 5.0, 5.5, 6.0],
   /* Calistenia (bodyweight): puede ser más alta por la naturaleza de los movimientos. */
   calistenia: [3.0, 3.8, 5.5, 7.0, 8.0],
   /* HIIT: el verdadero rango es ancho según intervalos. */
   hiit: [4.0, 6.0, 8.0, 9.0, 10.0],
   /* Yoga: hatha 2.5, vinyasa 4.0, power yoga 6.0. */
   yoga: [2.0, 2.5, 3.0, 3.8, 5.0],
   /* Pilates: mat 3.0, reformer 3.8, advanced 5.0. */
   pilates: [2.5, 3.0, 3.8, 4.5, 5.5],
   /* Barre: combinación de pilates + ballet + isométricos. */
   barre: [3.0, 4.0, 5.0, 5.8, 6.5],
   /* CrossFit: MET observados 5-11 (Kliszczewicz 2015). */
   crossfit: [4.5, 6.0, 8.0, 10.0, 11.0],
   /* Cardio general (elíptica, escalada moderada). */
   cardio: [3.5, 5.0, 7.0, 8.5, 9.5],
   /* Running: 4 mph 6.0, 6 mph 9.8, 7 mph 11.5. */
   running: [4.5, 6.5, 8.3, 10.0, 11.5],
   /* Cycling: leisure 4, moderate 7, vigorous 10. */
   cycling: [3.5, 4.5, 7.0, 8.5, 10.5],
   /* Swimming: 5.8 free, 8.3 fast, 9.8 sprint. */
   swimming: [4.0, 5.8, 7.0, 8.5, 9.8],
   /* Dance: ballroom 3, salsa/aerobic 6.5, zumba 8. */
   dance: [3.0, 4.5, 6.0, 7.3, 9.0],
   /* Sport: deporte general — promedio entre tenis, basket, fútbol. */
   sport: [3.5, 5.0, 7.0, 8.0, 9.0],
   /* Mixed: rutina combinada — promedio defensivo. */
   mixed: [3.5, 4.5, 6.0, 7.0, 8.0]
}

/** Peso por defecto si el usuario no tiene perfil cargado. */
const DEFAULT_WEIGHT_KG = 70

export interface EstimateKcalInput {
   subtype: ItfWorkoutSubtype
   durationMin: number
   intensity: 1 | 2 | 3 | 4 | 5
   /** Peso del usuario en kg. Si null/undefined, usa 70kg. */
   weightKg?: number | null
}

/**
 * Calcula calorías quemadas con la fórmula MET clásica.
 * Devuelve un entero (redondeo hacia abajo para no inflar).
 *
 * Reglas defensivas:
 *   - duration < 1 → 0 (no se loggea).
 *   - duration > 600 → cap a 600 (10 horas, sanity).
 *   - peso fuera de 30-300 → usa default 70.
 */
export const estimateKcal = ({
   subtype,
   durationMin,
   intensity,
   weightKg
}: EstimateKcalInput): number => {
   if (durationMin < 1) return 0
   const safeDuration = Math.min(durationMin, 600)
   const safeWeight = weightKg && weightKg >= 30 && weightKg <= 300 ? weightKg : DEFAULT_WEIGHT_KG
   const mets = MET_TABLE[subtype][intensity - 1]
   const kcal = mets * safeWeight * (safeDuration / 60)
   return Math.floor(kcal)
}

/** Labels para mostrar en la UI. */
export const WORKOUT_SUBTYPE_LABEL: Record<ItfWorkoutSubtype, string> = {
   strength: 'Fuerza con pesas',
   calistenia: 'Calistenia',
   hiit: 'HIIT',
   yoga: 'Yoga',
   pilates: 'Pilates',
   barre: 'Barre',
   crossfit: 'CrossFit',
   cardio: 'Cardio general',
   running: 'Correr',
   cycling: 'Bici',
   swimming: 'Natación',
   dance: 'Bailar',
   sport: 'Deporte',
   mixed: 'Rutina mixta'
}

export const WORKOUT_SUBTYPE_EMOJI: Record<ItfWorkoutSubtype, string> = {
   strength: '🏋️',
   calistenia: '🤸',
   hiit: '🔥',
   yoga: '🧘',
   pilates: '🌀',
   barre: '🩰',
   crossfit: '🪨',
   cardio: '💗',
   running: '🏃',
   cycling: '🚴',
   swimming: '🏊',
   dance: '💃',
   sport: '⚽',
   mixed: '⚡'
}

export const INTENSITY_LABEL: Record<1 | 2 | 3 | 4 | 5, string> = {
   1: 'Muy ligera',
   2: 'Ligera',
   3: 'Moderada',
   4: 'Vigorosa',
   5: 'Muy intensa'
}

/** Mapeo de intensidad → frase cualitativa para perceived_effort. */
export const PERCEIVED_EFFORT_LABEL: Record<1 | 2 | 3 | 4 | 5, string> = {
   1: 'Suave, casi de descanso',
   2: 'Tranquila, podía hablar',
   3: 'Cómoda, algo agitada',
   4: 'Justa, costaba hablar',
   5: 'Intensa, máximo esfuerzo'
}
