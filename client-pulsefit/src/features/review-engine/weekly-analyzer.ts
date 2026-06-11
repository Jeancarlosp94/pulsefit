import type { ItfWeeklyMetrics } from './types'

export interface AnalyzerInput {
   mealsPlannedPerDay: number
   meals: Array<{ logged_at: string; status: string }>
   workouts: Array<{ logged_at: string; rpe_actual: number | null }>
   weights: Array<{ log_date: string; weight_kg: number }>
   moods: Array<{ log_date: string; energy_level: number; mood_level: number }>
   rescues: Array<{ event_date: string }>
   water: Array<{ logged_at: string; delta_glasses: number }>
   streak_days: number
   /** ISO YYYY-MM-DD (inclusive) lunes ↦ domingo. */
   week_start: string
   week_end: string
}

const inWeek = (iso: string, start: string, end: string): boolean => iso >= start && iso <= end

/**
 * Calcula métricas de la semana del usuario. 100% determinístico, sin IA.
 * Las queries vienen ya filtradas desde la API.
 */
export const analyzeWeek = (input: AnalyzerInput): ItfWeeklyMetrics => {
   const { week_start, week_end } = input

   /* Comidas dentro de la semana. */
   const mealsInWeek = input.meals.filter((m) =>
      inWeek(m.logged_at.slice(0, 10), week_start, week_end)
   )
   const mealsConsumed = mealsInWeek.filter((m) => m.status !== 'skipped').length
   const expected = 7 * Math.max(1, input.mealsPlannedPerDay)
   const meal_adherence_pct = Math.min(100, Math.round((mealsConsumed / expected) * 100))

   /* Entrenamientos. */
   const workoutsInWeek = input.workouts.filter((w) =>
      inWeek(w.logged_at.slice(0, 10), week_start, week_end)
   )
   const rpes = workoutsInWeek.map((w) => w.rpe_actual).filter((r): r is number => r !== null)
   const rpe_average =
      rpes.length > 0 ? +(rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : null

   /* Peso: cambio entre primera y última entrada de la semana. */
   const weightsInWeek = input.weights.filter((w) => inWeek(w.log_date, week_start, week_end))
   const sortedWeights = [...weightsInWeek].sort((a, b) => a.log_date.localeCompare(b.log_date))
   const weight_change_kg =
      sortedWeights.length >= 2
         ? +(
              sortedWeights[sortedWeights.length - 1].weight_kg - sortedWeights[0].weight_kg
           ).toFixed(1)
         : null

   /* Mood. */
   const moodsInWeek = input.moods.filter((m) => inWeek(m.log_date, week_start, week_end))
   const mood_days = moodsInWeek.length
   const energy_average =
      mood_days > 0
         ? +(moodsInWeek.reduce((s, m) => s + m.energy_level, 0) / mood_days).toFixed(1)
         : null
   const mood_average =
      mood_days > 0
         ? +(moodsInWeek.reduce((s, m) => s + m.mood_level, 0) / mood_days).toFixed(1)
         : null

   /* Rescates. */
   const rescues_used = input.rescues.filter((r) =>
      inWeek(r.event_date, week_start, week_end)
   ).length

   /* Agua: suma de deltas / días con registros. */
   const waterByDay = new Map<string, number>()
   for (const w of input.water) {
      const d = w.logged_at.slice(0, 10)
      if (!inWeek(d, week_start, week_end)) continue
      waterByDay.set(d, (waterByDay.get(d) ?? 0) + w.delta_glasses)
   }
   const waterDays = Array.from(waterByDay.values()).filter((v) => v > 0)
   const water_avg_glasses =
      waterDays.length > 0
         ? +(waterDays.reduce((a, b) => a + b, 0) / waterDays.length).toFixed(1)
         : 0

   return {
      week_start,
      week_end,
      meal_adherence_pct,
      workouts_count: workoutsInWeek.length,
      rpe_average,
      weight_change_kg,
      mood_days,
      energy_average,
      mood_average,
      rescues_used,
      water_avg_glasses,
      streak_days: input.streak_days
   }
}

/** Helper: devuelve el lunes y domingo de la semana corriente como ISO. */
export const getWeekRange = (now = new Date()): { start: string; end: string } => {
   const day = now.getDay() /* 0 = domingo */
   const offsetToMonday = day === 0 ? -6 : 1 - day
   const monday = new Date(now)
   monday.setDate(now.getDate() + offsetToMonday)
   monday.setHours(0, 0, 0, 0)
   const sunday = new Date(monday)
   sunday.setDate(monday.getDate() + 6)
   return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) }
}
