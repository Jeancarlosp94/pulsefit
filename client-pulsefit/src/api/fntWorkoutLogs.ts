import { supabase } from './supabaseConf'
import type {
   ItfLogActivityInput,
   ItfLogCustomRoutineInput,
   ItfLogSetInput,
   ItfWorkoutLog
} from '@/interface/itfWorkouts'

/**
 * Inserta una entrada de log para un ejercicio terminado en una sesión.
 * RLS verifica que user_id sea el dueño.
 */
export const fntLogSet = async (input: ItfLogSetInput): Promise<ItfWorkoutLog> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   const { data, error } = await supabase
      .from('workout_logs')
      .insert({
         user_id: userId,
         activity_type: 'strength',
         exercise_id: input.exercise_id,
         exercise_name: input.exercise_name,
         sets_completed: input.sets_completed,
         reps_completed: input.reps_completed,
         weight_kg: input.weight_kg,
         rpe_actual: input.rpe_actual ?? null,
         notes: input.notes ?? null,
         session_id: input.session_id ?? null
      } as never)
      .select('*')
      .single()

   if (error) {
      throw new Error(`No pudimos guardar el set: ${error.message.slice(0, 100)} 🌿`)
   }
   return data as ItfWorkoutLog
}

/**
 * Sprint 11.7: log de actividad no-strength (cardio, deporte, baile,
 * movimiento). Reconoce que el ejercicio del usuario real va más allá del
 * gym (Esteban juega fútbol los sábados, Brigitte baila bachata 4h).
 *
 * Estas actividades CUENTAN como entrenamiento para adherencia y racha,
 * pero no aportan sets/reps al historial de fuerza.
 */
export const fntLogActivity = async (input: ItfLogActivityInput): Promise<ItfWorkoutLog> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   const { data, error } = await supabase
      .from('workout_logs')
      .insert({
         user_id: userId,
         activity_type: input.activity_type,
         activity_name: input.activity_name,
         duration_min: input.duration_min,
         intensity: input.intensity,
         notes: input.notes ?? null,
         /* Strength fields NULL para actividades no-strength. */
         exercise_id: null,
         exercise_name: null,
         sets_completed: null,
         reps_completed: null,
         weight_kg: null,
         rpe_actual: null,
         session_id: null
      } as never)
      .select('*')
      .single()

   if (error) {
      throw new Error(`No pudimos guardar la actividad: ${error.message.slice(0, 100)} 🌿`)
   }
   return data as ItfWorkoutLog
}

/**
 * Sprint 11.12: log de RUTINA CUSTOM. El usuario hizo su propia rutina
 * (no la del motor) y la app calcula calorías quemadas + impacta racha.
 *
 * activity_type='movement' para reuso del CHECK constraint existente.
 * El detalle real va en workout_subtype (gym/hiit/yoga/crossfit/...) que
 * permite mostrar emoji + label correcto en historial.
 */
export const fntLogCustomRoutine = async (
   input: ItfLogCustomRoutineInput
): Promise<ItfWorkoutLog> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   const { data, error } = await supabase
      .from('workout_logs')
      .insert({
         user_id: userId,
         activity_type: 'movement',
         activity_name: input.activity_name,
         workout_subtype: input.workout_subtype,
         duration_min: input.duration_min,
         intensity: input.intensity,
         calories_burned: input.calories_burned,
         perceived_effort: input.perceived_effort ?? null,
         notes: input.notes ?? null,
         exercise_id: null,
         exercise_name: null,
         sets_completed: null,
         reps_completed: null,
         weight_kg: null,
         rpe_actual: null,
         session_id: null
      } as never)
      .select('*')
      .single()

   if (error) {
      throw new Error(`No pudimos guardar tu rutina: ${error.message.slice(0, 100)} 🌿`)
   }
   return data as ItfWorkoutLog
}

/**
 * Devuelve los últimos N logs de un ejercicio para el usuario actual.
 * Ordenados por fecha descendente.
 */
export const fntGetRecentLogs = async (exerciseId: string, limit = 5): Promise<ItfWorkoutLog[]> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return []

   const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .order('logged_at', { ascending: false })
      .limit(limit)

   if (error) throw new Error(error.message)
   return (data as ItfWorkoutLog[] | null) ?? []
}

/**
 * Devuelve TODOS los logs recientes del usuario (todos los ejercicios)
 * agrupados por exercise_id. Útil para la dashboard de progreso futuro
 * o para pre-fetch en RegistrarPage.
 */
export const fntGetRecentLogsByExercise = async (
   exerciseIds: string[],
   limit = 3
): Promise<Record<string, ItfWorkoutLog[]>> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId || exerciseIds.length === 0) return {}

   const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .in('exercise_id', exerciseIds)
      .order('logged_at', { ascending: false })
      .limit(limit * exerciseIds.length)

   if (error) throw new Error(error.message)
   const out: Record<string, ItfWorkoutLog[]> = {}
   for (const row of (data as ItfWorkoutLog[] | null) ?? []) {
      /* Sprint 11.7: solo strength tiene exercise_id; ignorar otros. */
      if (!row.exercise_id) continue
      const arr = out[row.exercise_id] ?? []
      if (arr.length < limit) {
         arr.push(row)
         out[row.exercise_id] = arr
      }
   }
   return out
}
