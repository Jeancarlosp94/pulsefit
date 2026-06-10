import { supabase } from './supabaseConf'
import type {
   ItfAdherenceSummary,
   ItfStrengthProgressPoint,
   ItfWeightPoint,
   ItfWellbeingPoint
} from '@/interface/itfProgress'

const daysAgoIso = (days: number): string => {
   const d = new Date()
   d.setDate(d.getDate() - days)
   return d.toISOString().slice(0, 10)
}

/** Historial de peso (default últimos 90 días). */
export const fntGetWeightHistory = async (days = 90): Promise<ItfWeightPoint[]> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return []

   const { data, error } = await supabase
      .from('weight_logs')
      .select('log_date, weight_kg')
      .eq('user_id', userId)
      .gte('log_date', daysAgoIso(days))
      .order('log_date', { ascending: true })

   if (error) throw new Error(error.message)
   return ((data as Array<{ log_date: string; weight_kg: number }> | null) ?? []).map((r) => ({
      date: r.log_date,
      weight_kg: Number(r.weight_kg)
   }))
}

/** Historial de mood (energía + ánimo, default últimos 30 días). */
export const fntGetWellbeingHistory = async (days = 30): Promise<ItfWellbeingPoint[]> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return []

   const { data, error } = await supabase
      .from('mood_logs')
      .select('log_date, energy_level, mood_level')
      .eq('user_id', userId)
      .gte('log_date', daysAgoIso(days))
      .order('log_date', { ascending: true })

   if (error) throw new Error(error.message)
   return (
      (data as Array<{ log_date: string; energy_level: number; mood_level: number }> | null) ?? []
   ).map((r) => ({
      date: r.log_date,
      energy: r.energy_level,
      mood: r.mood_level
   }))
}

/**
 * Resumen de adherencia: días activos en 30, % comidas, # entrenamientos,
 * racha actual. Calculado client-side a partir de varias queries.
 */
export const fntGetAdherenceSummary = async (): Promise<ItfAdherenceSummary> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) {
      return {
         active_days_30: 0,
         meals_adherence_pct: 0,
         workouts_last_week: 0,
         current_streak: 0
      }
   }

   const since30 = new Date(Date.now() - 30 * 86400000).toISOString()
   const since7 = new Date(Date.now() - 7 * 86400000).toISOString()

   /* Logs de comidas + entrenamientos + agua + peso + mood (todos los con fecha). */
   const [meals, workouts, water, weights, moods] = await Promise.all([
      supabase
         .from('meal_logs')
         .select('logged_at, status')
         .eq('user_id', userId)
         .gte('logged_at', since30),
      supabase
         .from('workout_logs')
         .select('logged_at')
         .eq('user_id', userId)
         .gte('logged_at', since30),
      supabase
         .from('water_logs')
         .select('logged_at')
         .eq('user_id', userId)
         .gte('logged_at', since30),
      supabase
         .from('weight_logs')
         .select('log_date')
         .eq('user_id', userId)
         .gte('log_date', since30.slice(0, 10)),
      supabase
         .from('mood_logs')
         .select('log_date')
         .eq('user_id', userId)
         .gte('log_date', since30.slice(0, 10))
   ])

   /* Conjunto único de días activos (YYYY-MM-DD). */
   const days = new Set<string>()
   const collect = (arr: Array<{ logged_at?: string; log_date?: string }> | null) => {
      if (!arr) return
      for (const r of arr) {
         const d = r.logged_at?.slice(0, 10) ?? r.log_date
         if (d) days.add(d)
      }
   }
   collect(meals.data as never)
   collect(workouts.data as never)
   collect(water.data as never)
   collect(weights.data as never)
   collect(moods.data as never)

   /* Adherencia comidas: count(status != 'skipped') / total esperado en 7 días.
    * Estimamos esperado como días * meals_per_day promedio (3 si no sabemos). */
   const last7MealLogs =
      (meals.data as Array<{ logged_at: string; status: string }> | null)?.filter(
         (m) => m.logged_at >= since7
      ) ?? []
   const consumed = last7MealLogs.filter((m) => m.status !== 'skipped').length
   /* Estimado: 7 días × 3 comidas = 21. Usamos eso como meta neutral. */
   const meals_adherence_pct = Math.min(100, Math.round((consumed / 21) * 100))

   const workouts_last_week =
      (workouts.data as Array<{ logged_at: string }> | null)?.filter((w) => w.logged_at >= since7)
         .length ?? 0

   /* Racha: contar días consecutivos hacia atrás hasta hoy. */
   const today = new Date()
   today.setHours(0, 0, 0, 0)
   let streak = 0
   for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      if (days.has(iso)) streak++
      else break
   }

   return {
      active_days_30: days.size,
      meals_adherence_pct,
      workouts_last_week,
      current_streak: streak
   }
}

/**
 * Top 3 ejercicios por número de logs en los últimos 90 días con su
 * progresión de carga.
 */
export const fntGetStrengthProgress = async (): Promise<ItfStrengthProgressPoint[]> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return []

   const since = new Date(Date.now() - 90 * 86400000).toISOString()

   const { data, error } = await supabase
      .from('workout_logs')
      .select('exercise_id, exercise_name, weight_kg, reps_completed, rpe_actual, logged_at')
      .eq('user_id', userId)
      .gte('logged_at', since)
      .order('logged_at', { ascending: true })

   if (error) throw new Error(error.message)
   const rows =
      (data as Array<{
         exercise_id: string
         exercise_name: string
         weight_kg: number
         reps_completed: number
         rpe_actual: number | null
         logged_at: string
      }> | null) ?? []

   const byExercise = new Map<string, ItfStrengthProgressPoint>()
   for (const r of rows) {
      const existing = byExercise.get(r.exercise_id) ?? {
         exercise_id: r.exercise_id,
         exercise_name: r.exercise_name,
         history: [],
         pr_kg: 0,
         delta_kg: 0
      }
      existing.history.push({
         date: r.logged_at.slice(0, 10),
         weight_kg: Number(r.weight_kg),
         reps: r.reps_completed,
         rpe: r.rpe_actual
      })
      existing.pr_kg = Math.max(existing.pr_kg, Number(r.weight_kg))
      byExercise.set(r.exercise_id, existing)
   }

   const all = Array.from(byExercise.values())
   for (const ex of all) {
      if (ex.history.length >= 2) {
         ex.delta_kg = ex.history[ex.history.length - 1].weight_kg - ex.history[0].weight_kg
      }
   }
   /* Top 3 por count de logs. */
   all.sort((a, b) => b.history.length - a.history.length)
   return all.slice(0, 3)
}
