import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/api/supabaseConf'
import { useAuth } from './useAuth'

export interface AdherenceAlertResult {
   /** % adherencia de los últimos 14 días (sobre 14*meals_per_day esperados). */
   pct: number
   /** Días activos (cualquier log) en los últimos 14 días. */
   active_days: number
   /** Si la adherencia es crítica (< 20% y al menos 14 días desde signup). */
   critical: boolean
   /** Sugerencia de qué hacer. */
   suggestion: string | null
}

/**
 * Detecta si el usuario tiene adherencia crítica (< 20% en 14 días).
 * No es una alerta de seguridad — es una invitación a ajustar el plan a
 * uno más realista. Tono compasivo, sin juicio.
 */
export const useAdherenceAlert = () => {
   const { user, profile, onboardingCompleted } = useAuth()

   return useQuery<AdherenceAlertResult>({
      queryKey: ['adherence-alert', user?.id],
      queryFn: async () => {
         if (!user) {
            return { pct: 0, active_days: 0, critical: false, suggestion: null }
         }

         const since14 = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)

         const [meals, workouts, water, weights, moods] = await Promise.all([
            supabase
               .from('meal_logs')
               .select('logged_at, status')
               .eq('user_id', user.id)
               .gte('logged_at', `${since14}T00:00:00`),
            supabase
               .from('workout_logs')
               .select('logged_at')
               .eq('user_id', user.id)
               .gte('logged_at', `${since14}T00:00:00`),
            supabase
               .from('water_logs')
               .select('logged_at')
               .eq('user_id', user.id)
               .gte('logged_at', `${since14}T00:00:00`),
            supabase
               .from('weight_logs')
               .select('log_date')
               .eq('user_id', user.id)
               .gte('log_date', since14),
            supabase
               .from('mood_logs')
               .select('log_date')
               .eq('user_id', user.id)
               .gte('log_date', since14)
         ])

         /* Adherencia = % de comidas no-skipped sobre esperadas (14 días × meals_per_day). */
         const mealsArr = (meals.data as Array<{ logged_at: string; status: string }> | null) ?? []
         const consumed = mealsArr.filter((m) => m.status !== 'skipped').length
         const mealsPerDay = (profile?.meals_per_day as number | null) ?? 3
         const expected = 14 * Math.max(1, mealsPerDay)
         const pct = Math.min(100, Math.round((consumed / expected) * 100))

         /* Días activos: cualquier log. */
         const days = new Set<string>()
         const collect = (rows: Array<{ logged_at?: string; log_date?: string }> | null) => {
            if (!rows) return
            for (const r of rows) {
               const d = r.logged_at?.slice(0, 10) ?? r.log_date
               if (d) days.add(d)
            }
         }
         collect(mealsArr as never)
         collect(workouts.data as never)
         collect(water.data as never)
         collect(weights.data as never)
         collect(moods.data as never)

         /* Solo alertamos si el usuario lleva ya 14 días con la app
          * (caso contrario es muy temprano para juzgar adherencia). */
         const createdAt = new Date(profile?.created_at ?? Date.now())
         const daysSinceSignup = Math.floor(
            (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)
         )

         const critical = daysSinceSignup >= 14 && pct < 20

         return {
            pct,
            active_days: days.size,
            critical,
            suggestion: critical
               ? 'Notamos que el plan te quedó grande. ¿Probamos uno más simple y realista? Sin presión 🌿'
               : null
         }
      },
      enabled: !!user && onboardingCompleted,
      staleTime: 10 * 60 * 1000
   })
}
