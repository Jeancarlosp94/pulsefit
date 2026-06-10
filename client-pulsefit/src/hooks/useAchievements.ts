import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
   checkAchievements,
   fntGetAllAchievements,
   fntGetUserAchievements
} from '@/features/achievement-engine'
import { useAuth } from './useAuth'
import { useAdherenceSummary } from './useProgress'
import { supabase } from '@/api/supabaseConf'
import type { ItfAchievement, ItfUserAchievement } from '@/interface/itfProgress'

/** Catálogo completo de logros disponibles (compartido). */
export const useAllAchievements = () => {
   const { user } = useAuth()
   return useQuery<ItfAchievement[]>({
      queryKey: ['achievements', 'all'],
      queryFn: fntGetAllAchievements,
      enabled: !!user,
      staleTime: 10 * 60 * 1000
   })
}

/** Logros desbloqueados por el usuario actual. */
export const useUserAchievements = () => {
   const { user } = useAuth()
   return useQuery<ItfUserAchievement[]>({
      queryKey: ['achievements', 'user'],
      queryFn: fntGetUserAchievements,
      enabled: !!user,
      staleTime: 2 * 60 * 1000
   })
}

/**
 * Cuando se monta el ProgresoPage, dispara la evaluación de logros.
 * Si hay logros nuevos, muestra toast por cada uno + invalida la query
 * de user_achievements para que aparezcan en la UI.
 */
export const useDetectNewAchievements = () => {
   const { user } = useAuth()
   const adherence = useAdherenceSummary()
   const queryClient = useQueryClient()

   useEffect(() => {
      if (!user || !adherence.data) return

      const run = async () => {
         /* Obtener counts adicionales necesarios. */
         const userId = user.id
         const [workouts, meals, weights, water, moods] = await Promise.all([
            supabase
               .from('workout_logs')
               .select('id', { head: true, count: 'exact' })
               .eq('user_id', userId),
            supabase
               .from('meal_logs')
               .select('id', { head: true, count: 'exact' })
               .eq('user_id', userId),
            supabase
               .from('weight_logs')
               .select('log_date', { count: 'exact' })
               .eq('user_id', userId)
               .gte('log_date', new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
            supabase
               .from('water_logs')
               .select('id', { head: true, count: 'exact' })
               .eq('user_id', userId),
            supabase.from('mood_logs').select('log_date', { count: 'exact' }).eq('user_id', userId)
         ])

         const unlocked = await checkAchievements({
            userId,
            adherence: adherence.data!,
            workoutLogsCount: workouts.count ?? 0,
            mealLogsCount: meals.count ?? 0,
            weightLogsLastMonth: weights.count ?? 0,
            waterDaysReached: water.count ?? 0,
            moodDaysReached: moods.count ?? 0
         })

         if (unlocked.length > 0) {
            queryClient.invalidateQueries({ queryKey: ['achievements', 'user'] })
            for (const a of unlocked) {
               toast.success(`${a.icon} ¡Logro desbloqueado!`, {
                  description: a.name
               })
            }
         }
      }
      void run()
      /* Solo intentar una vez por carga del componente. */
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [user, adherence.data])
}
