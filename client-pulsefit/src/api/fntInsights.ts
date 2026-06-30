import { supabase } from './supabaseConf'
import {
   buildRecommendations,
   detectAllPatterns,
   prioritizeInsights,
   type ItfPattern,
   type ItfRecommendation
} from '@/features/pattern-engine'

/**
 * Carga 60 días de actividad del usuario y devuelve insights priorizados.
 * 100% client-side, sin Edge Function (todo el motor es determinístico).
 */
export const fntGetInsights = async (): Promise<{
   patterns: ItfPattern[]
   recommendations: ItfRecommendation[]
}> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return { patterns: [], recommendations: [] }

   const since60 = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10)

   const [meals, workouts, moods, water, rescues, profileRes] = await Promise.all([
      supabase
         .from('meal_logs')
         .select('logged_at, status, meal_type, recipe_name')
         .eq('user_id', userId)
         .gte('logged_at', `${since60}T00:00:00`),
      supabase
         .from('workout_logs')
         .select('logged_at')
         .eq('user_id', userId)
         .gte('logged_at', `${since60}T00:00:00`),
      supabase
         .from('mood_logs')
         .select('log_date, energy_level, mood_level')
         .eq('user_id', userId)
         .gte('log_date', since60),
      supabase
         .from('water_logs')
         .select('logged_at, delta_glasses')
         .eq('user_id', userId)
         .gte('logged_at', `${since60}T00:00:00`),
      supabase
         .from('rescue_events')
         .select('event_date, trigger_type')
         .eq('user_id', userId)
         .gte('event_date', since60),
      supabase.from('profiles').select('monotonous_meals_preferred').eq('id', userId).maybeSingle()
   ])

   const monotone =
      ((profileRes.data as { monotonous_meals_preferred: boolean | null } | null) ?? null)
         ?.monotonous_meals_preferred === true

   const patterns = detectAllPatterns({
      meals:
         (meals.data as Array<{
            logged_at: string
            status: string
            meal_type: string
            recipe_name: string
         }> | null) ?? [],
      workouts: (workouts.data as Array<{ logged_at: string }> | null) ?? [],
      moods:
         (moods.data as Array<{
            log_date: string
            energy_level: number
            mood_level: number
         }> | null) ?? [],
      water: (water.data as Array<{ logged_at: string; delta_glasses: number }> | null) ?? [],
      rescues: (rescues.data as Array<{ event_date: string; trigger_type: string }> | null) ?? [],
      monotonous_meals_preferred: monotone
   })

   const recommendations = prioritizeInsights(buildRecommendations(patterns), 6)
   return { patterns, recommendations }
}
