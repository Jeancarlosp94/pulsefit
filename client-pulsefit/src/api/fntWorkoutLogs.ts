import { supabase } from './supabaseConf'
import type { ItfLogSetInput, ItfWorkoutLog } from '@/interface/itfWorkouts'

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
      const arr = out[row.exercise_id] ?? []
      if (arr.length < limit) {
         arr.push(row)
         out[row.exercise_id] = arr
      }
   }
   return out
}
