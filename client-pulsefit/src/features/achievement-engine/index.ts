import { supabase } from '@/api/supabaseConf'
import type { ItfAchievement, ItfUserAchievement } from '@/interface/itfProgress'
import type { ItfAdherenceSummary } from '@/interface/itfProgress'

/**
 * Motor de logros — versión MVP de Fase 9.
 * Evalúa criteria simples (días activos, racha, count de logs) contra
 * los logros del catálogo y desbloquea los que recién cumple.
 *
 * NO toca logros server-side (no requiere RLS extra) — todo se hace
 * desde el cliente con las queries normales.
 */

export interface CheckInput {
   userId: string
   adherence: ItfAdherenceSummary
   workoutLogsCount: number
   mealLogsCount: number
   weightLogsLastMonth: number
   waterDaysReached: number
   moodDaysReached: number
}

/** Lee todos los logros del catálogo público. */
export const fntGetAllAchievements = async (): Promise<ItfAchievement[]> => {
   const { data, error } = await supabase
      .from('achievements')
      .select('id, code, name, description, icon, criteria')
   if (error) throw new Error(error.message)
   return (data as ItfAchievement[] | null) ?? []
}

/** Lee los logros que el usuario YA desbloqueó. */
export const fntGetUserAchievements = async (): Promise<ItfUserAchievement[]> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return []

   const { data, error } = await supabase
      .from('user_achievements')
      .select(
         'id, user_id, achievement_id, unlocked_at, achievement:achievements(id, code, name, description, icon, criteria)'
      )
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })

   if (error) throw new Error(error.message)
   return (data as unknown as ItfUserAchievement[] | null) ?? []
}

/** Inserta un logro nuevo para el usuario (idempotente por unique constraint). */
const insertUserAchievement = async (userId: string, achievementId: string): Promise<void> => {
   await supabase
      .from('user_achievements')
      .insert({ user_id: userId, achievement_id: achievementId } as never)
}

/**
 * Evalúa cada criteria y desbloquea los logros que el usuario cumple ahora
 * pero todavía no tenía. Devuelve los logros recién desbloqueados.
 */
export const checkAchievements = async (input: CheckInput): Promise<ItfAchievement[]> => {
   const [catalog, owned] = await Promise.all([fntGetAllAchievements(), fntGetUserAchievements()])
   const ownedCodes = new Set(owned.map((u) => u.achievement.code))
   const toUnlock: ItfAchievement[] = []

   for (const a of catalog) {
      if (ownedCodes.has(a.code)) continue
      const c = a.criteria as Record<string, number | boolean>
      let unlock = false

      if (typeof c.days_active === 'number' && input.adherence.active_days_30 >= c.days_active) {
         unlock = true
      } else if (
         typeof c.streak_days === 'number' &&
         input.adherence.current_streak >= c.streak_days
      ) {
         unlock = true
      } else if (
         typeof c.workouts_completed === 'number' &&
         input.workoutLogsCount >= c.workouts_completed
      ) {
         unlock = true
      } else if (typeof c.meals_logged === 'number' && input.mealLogsCount >= c.meals_logged) {
         unlock = true
      } else if (
         typeof c.weight_logs_month === 'number' &&
         input.weightLogsLastMonth >= c.weight_logs_month
      ) {
         unlock = true
      } else if (
         typeof c.hydration_target_days === 'number' &&
         input.waterDaysReached >= c.hydration_target_days
      ) {
         unlock = true
      } else if (
         typeof c.mood_check_days === 'number' &&
         input.moodDaysReached >= c.mood_check_days
      ) {
         unlock = true
      } else if (
         typeof c.adherence_week === 'number' &&
         input.adherence.meals_adherence_pct >= c.adherence_week
      ) {
         unlock = true
      }

      if (unlock) {
         await insertUserAchievement(input.userId, a.id)
         toUnlock.push(a)
      }
   }

   return toUnlock
}
