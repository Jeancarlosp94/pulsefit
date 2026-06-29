import { supabase } from './supabaseConf'
import {
   analyzeWeek,
   buildFallbackSummary,
   getWeekRange,
   proposeAdjustments,
   type ItfAdjustment,
   type ItfReviewSummary,
   type ItfWeeklyMetrics,
   type ItfWeeklyReview,
   type ProfileForReview
} from '@/features/review-engine'

/**
 * Compone una revisión semanal completa:
 *   1. Lee los datos crudos de la última semana.
 *   2. Calcula métricas con el analyzer.
 *   3. Propone ajustes con las reglas de Lucía + Carlos.
 *   4. Pide a la Edge Function que redacte el resumen narrativo con IA.
 *   5. Si la Edge Function devuelve null o falla, usa el fallback determinístico.
 */
export const fntComposeWeeklyReview = async (): Promise<ItfWeeklyReview> => {
   const { data: auth } = await supabase.auth.getUser()
   const user = auth.user
   if (!user) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   const range = getWeekRange()
   const sinceIso = range.start /* YYYY-MM-DD */
   const untilIso = range.end

   /* === 1. Cargar perfil + datos crudos en paralelo === */
   const [profileRes, meals, workouts, weights, moods, rescues, water] = await Promise.all([
      supabase
         .from('profiles')
         .select(
            'name, target_kcal, current_weight_kg, goal, meals_per_day, eating_disorder_history'
         )
         .eq('id', user.id)
         .maybeSingle(),
      supabase
         .from('meal_logs')
         .select('logged_at, status')
         .eq('user_id', user.id)
         .gte('logged_at', `${sinceIso}T00:00:00`)
         .lte('logged_at', `${untilIso}T23:59:59`),
      supabase
         .from('workout_logs')
         .select('logged_at, rpe_actual')
         .eq('user_id', user.id)
         .gte('logged_at', `${sinceIso}T00:00:00`)
         .lte('logged_at', `${untilIso}T23:59:59`),
      supabase
         .from('weight_logs')
         .select('log_date, weight_kg')
         .eq('user_id', user.id)
         .gte('log_date', sinceIso)
         .lte('log_date', untilIso),
      supabase
         .from('mood_logs')
         .select('log_date, energy_level, mood_level')
         .eq('user_id', user.id)
         .gte('log_date', sinceIso)
         .lte('log_date', untilIso),
      supabase
         .from('rescue_events')
         .select('event_date')
         .eq('user_id', user.id)
         .gte('event_date', sinceIso)
         .lte('event_date', untilIso),
      supabase
         .from('water_logs')
         .select('logged_at, delta_glasses')
         .eq('user_id', user.id)
         .gte('logged_at', `${sinceIso}T00:00:00`)
         .lte('logged_at', `${untilIso}T23:59:59`)
   ])

   const profile =
      (profileRes.data as {
         name: string | null
         target_kcal: number | null
         current_weight_kg: number | null
         goal: ProfileForReview['goal']
         meals_per_day: number | null
         eating_disorder_history: boolean | null
      } | null) ?? null

   /* === 2. Calcular racha simple: días con cualquier log en los últimos 30 === */
   const streak = await computeStreak(user.id)

   /* === 3. Analyzer === */
   const metrics: ItfWeeklyMetrics = analyzeWeek({
      mealsPlannedPerDay: profile?.meals_per_day ?? 3,
      meals: (meals.data as Array<{ logged_at: string; status: string }> | null) ?? [],
      workouts:
         (workouts.data as Array<{ logged_at: string; rpe_actual: number | null }> | null) ?? [],
      weights: (weights.data as Array<{ log_date: string; weight_kg: number }> | null) ?? [],
      moods:
         (moods.data as Array<{
            log_date: string
            energy_level: number
            mood_level: number
         }> | null) ?? [],
      rescues: (rescues.data as Array<{ event_date: string }> | null) ?? [],
      water: (water.data as Array<{ logged_at: string; delta_glasses: number }> | null) ?? [],
      streak_days: streak,
      week_start: range.start,
      week_end: range.end
   })

   /* === 4. Ajustes === */
   const adjustments: ItfAdjustment[] = proposeAdjustments(metrics, {
      target_kcal: profile?.target_kcal ?? null,
      weight_kg: profile?.current_weight_kg ?? null,
      goal: profile?.goal ?? null,
      eating_disorder_history: profile?.eating_disorder_history === true
   })

   /* === 5. IA — Edge Function === */
   let summary: ItfReviewSummary
   try {
      const { data, error } = await supabase.functions.invoke('weekly-review', {
         body: {
            userName: profile?.name ?? null,
            metrics,
            adjustments: adjustments.map((a) => ({
               id: a.id,
               type: a.type,
               title: a.title,
               reason: a.reason,
               priority: a.priority
            }))
         }
      })

      if (error || !data?.data) {
         summary = buildFallbackSummary(metrics, adjustments, profile?.name ?? undefined)
      } else {
         const d = data.data as {
            greeting: string
            summary: string
            highlights: string[]
            adjustments_intro: string
            closing: string
         }
         summary = {
            greeting: d.greeting,
            summary: d.summary,
            highlights: d.highlights,
            adjustments_intro: d.adjustments_intro,
            closing: d.closing,
            source: 'ai'
         }
      }
   } catch {
      summary = buildFallbackSummary(metrics, adjustments, profile?.name ?? undefined)
   }

   return { metrics, adjustments, summary }
}

/** Persiste la review + decisiones del usuario en la tabla `reviews`. */
export const fntSaveReview = async (params: {
   review: ItfWeeklyReview
   accepted_ids: string[]
   decision: 'accepted_all' | 'partial' | 'rejected'
}): Promise<void> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   const { error } = await supabase.from('reviews').insert({
      user_id: userId,
      week_start: params.review.metrics.week_start,
      week_end: params.review.metrics.week_end,
      metrics: params.review.metrics,
      adjustments: params.review.adjustments,
      summary: params.review.summary,
      accepted_adjustment_ids: params.accepted_ids,
      applied_at: new Date().toISOString(),
      user_decision: params.decision
   } as never)

   if (error) {
      throw new Error(`No pudimos guardar la revisión: ${error.message.slice(0, 100)} 🌿`)
   }
}

/** Aplica al perfil los ajustes aceptados (sólo los relacionados a kcal). */
export const fntApplyReviewAdjustments = async (
   acceptedAdjustments: ItfAdjustment[]
): Promise<void> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return

   /* Solo kcal_increase / kcal_decrease modifican el perfil. Otros tipos
    * son sugerencias informativas (workout_progress, hydration, etc.). */
   const kcalAdj = acceptedAdjustments.find(
      (a) => a.type === 'kcal_increase' || a.type === 'kcal_decrease'
   )
   if (!kcalAdj?.payload?.newTarget) return

   const newTarget = Number(kcalAdj.payload.newTarget)
   if (!Number.isFinite(newTarget) || newTarget < 1200 || newTarget > 5000) return

   await supabase
      .from('profiles')
      .update({ target_kcal: newTarget } as never)
      .eq('id', userId)
}

/** Helper: cuenta racha consecutiva hacia atrás con cualquier log. */
const computeStreak = async (userId: string): Promise<number> => {
   const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
   const [meals, workouts, water, weights, moods] = await Promise.all([
      supabase
         .from('meal_logs')
         .select('logged_at')
         .eq('user_id', userId)
         .gte('logged_at', `${since}T00:00:00`),
      supabase
         .from('workout_logs')
         .select('logged_at')
         .eq('user_id', userId)
         .gte('logged_at', `${since}T00:00:00`),
      supabase
         .from('water_logs')
         .select('logged_at')
         .eq('user_id', userId)
         .gte('logged_at', `${since}T00:00:00`),
      supabase.from('weight_logs').select('log_date').eq('user_id', userId).gte('log_date', since),
      supabase.from('mood_logs').select('log_date').eq('user_id', userId).gte('log_date', since)
   ])

   const days = new Set<string>()
   const push = (rows: Array<{ logged_at?: string; log_date?: string }> | null) => {
      if (!rows) return
      for (const r of rows) {
         const d = r.logged_at?.slice(0, 10) ?? r.log_date
         if (d) days.add(d)
      }
   }
   push(meals.data as never)
   push(workouts.data as never)
   push(water.data as never)
   push(weights.data as never)
   push(moods.data as never)

   const today = new Date()
   today.setHours(0, 0, 0, 0)
   let streak = 0
   for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      if (days.has(iso)) streak++
      else break
   }
   return streak
}
