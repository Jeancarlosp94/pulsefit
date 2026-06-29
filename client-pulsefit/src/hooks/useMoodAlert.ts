import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/api/supabaseConf'
import { useAuth } from './useAuth'
import { checkMoodHealth, type MoodAlertResult } from '@/features/safety-guards'

/**
 * Detecta en tiempo real si el usuario tiene un patrón de mood persistente
 * bajo. Se ejecuta al cargar el HomePage. Devuelve la severidad para que la
 * UI muestre el modal de recursos profesionales si corresponde.
 */
export const useMoodAlert = (): {
   data: MoodAlertResult | undefined
   isLoading: boolean
} => {
   const { user, profile, onboardingCompleted } = useAuth()

   const q = useQuery<MoodAlertResult>({
      queryKey: ['mood-alert', user?.id],
      queryFn: async () => {
         if (!user) return { severity: null, reason: null, consecutive_days: 0, avg_mood: null }

         const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
         const { data } = await supabase
            .from('mood_logs')
            .select('log_date, mood_level, energy_level')
            .eq('user_id', user.id)
            .gte('log_date', since)
            .order('log_date', { ascending: false })

         const rows =
            (data as Array<{
               log_date: string
               mood_level: number
               energy_level: number
            }> | null) ?? []

         return checkMoodHealth({
            recent_moods: rows,
            eating_disorder_history:
               (profile?.eating_disorder_history as boolean | undefined) ?? false
         })
      },
      enabled: !!user && onboardingCompleted,
      staleTime: 5 * 60 * 1000
   })

   return { data: q.data, isLoading: q.isLoading }
}
