import type { ItfPattern, PatternEngineInput } from './types'

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

const MEAL_TYPE_LABEL: Record<string, string> = {
   breakfast: 'desayuno',
   snack_am: 'media mañana',
   lunch: 'almuerzo',
   snack_pm: 'media tarde',
   dinner: 'cena'
}

/* ============================================================
 *  COMIDAS
 * ============================================================ */

/** Recetas sustituidas 3+ veces — el usuario rechaza ese plato. */
const detectFrequentlySubstituted = (input: PatternEngineInput): ItfPattern[] => {
   const counts = new Map<string, number>()
   for (const m of input.meals) {
      if (m.status === 'substituted') {
         counts.set(m.recipe_name, (counts.get(m.recipe_name) ?? 0) + 1)
      }
   }
   const repeated = Array.from(counts.entries())
      .filter(([_, c]) => c >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
   return repeated.map(([name, count]) => ({
      type: 'frequently_substituted',
      data: { recipe_name: name, count }
   }))
}

/** Meal_type que se salta más del 50% del tiempo (con ≥ 4 logs totales). */
const detectOftenSkippedMealType = (input: PatternEngineInput): ItfPattern[] => {
   const totals = new Map<string, { total: number; skipped: number }>()
   for (const m of input.meals) {
      const cur = totals.get(m.meal_type) ?? { total: 0, skipped: 0 }
      cur.total++
      if (m.status === 'skipped') cur.skipped++
      totals.set(m.meal_type, cur)
   }
   const out: ItfPattern[] = []
   for (const [type, { total, skipped }] of totals.entries()) {
      if (total >= 4 && skipped / total > 0.5) {
         out.push({
            type: 'often_skipped_meal_type',
            data: {
               meal_type: type,
               label: MEAL_TYPE_LABEL[type] ?? type,
               ratio: Math.round((skipped / total) * 100)
            }
         })
      }
   }
   return out
}

/** Skipped > 40% del total → patrón de struggles_with_meals. */
const detectStrugglesWithMeals = (input: PatternEngineInput): ItfPattern[] => {
   if (input.meals.length < 8) return []
   const skipped = input.meals.filter((m) => m.status === 'skipped').length
   const ratio = skipped / input.meals.length
   if (ratio > 0.4) {
      return [
         {
            type: 'struggles_with_meals',
            data: { ratio: Math.round(ratio * 100) }
         }
      ]
   }
   return []
}

/* ============================================================
 *  RESCATES
 * ============================================================ */

/** "No quiero cocinar" usado 3+ veces en el último mes. */
const detectAvoidsCooking = (input: PatternEngineInput): ItfPattern[] => {
   const noCooking = input.rescues.filter((r) => r.trigger_type === 'no_cooking').length
   if (noCooking >= 3) {
      return [{ type: 'avoids_cooking', data: { count: noCooking } }]
   }
   return []
}

/* ============================================================
 *  TEMPORALES
 * ============================================================ */

/** Día de la semana con más skips/sustituciones de comidas. */
const detectLowAdherenceDay = (input: PatternEngineInput): ItfPattern[] => {
   const byDay = new Array(7).fill(0).map(() => ({ total: 0, off: 0 }))
   for (const m of input.meals) {
      const d = new Date(m.logged_at).getDay()
      byDay[d].total++
      if (m.status === 'skipped' || m.status === 'substituted') byDay[d].off++
   }
   /* Buscar el día con mayor ratio off/total. */
   let worst = -1
   let worstRatio = 0
   for (let i = 0; i < 7; i++) {
      const { total, off } = byDay[i]
      if (total >= 3) {
         const ratio = off / total
         if (ratio > worstRatio && ratio > 0.5) {
            worst = i
            worstRatio = ratio
         }
      }
   }
   if (worst === -1) return []
   return [
      {
         type: 'low_adherence_day',
         data: { day: DAYS_ES[worst], ratio: Math.round(worstRatio * 100) }
      }
   ]
}

/** Día de la semana con mayor cantidad de entrenamientos. */
const detectHighWorkoutDay = (input: PatternEngineInput): ItfPattern[] => {
   if (input.workouts.length < 4) return []
   const byDay = new Array(7).fill(0)
   for (const w of input.workouts) {
      byDay[new Date(w.logged_at).getDay()]++
   }
   const max = Math.max(...byDay)
   const total = byDay.reduce((a, b) => a + b, 0)
   if (max / total < 0.3) return [] /* sin un día dominante */
   const dayIdx = byDay.indexOf(max)
   return [
      {
         type: 'high_workout_day',
         data: { day: DAYS_ES[dayIdx], count: max }
      }
   ]
}

/* ============================================================
 *  BIENESTAR
 * ============================================================ */

/** Ánimo promedio es 0.5+ pts mejor los días que entrena. */
const detectMoodWorkoutCorrelation = (input: PatternEngineInput): ItfPattern[] => {
   if (input.moods.length < 5 || input.workouts.length < 3) return []
   const workoutDays = new Set(input.workouts.map((w) => w.logged_at.slice(0, 10)))
   const withWorkout: number[] = []
   const without: number[] = []
   for (const m of input.moods) {
      if (workoutDays.has(m.log_date)) withWorkout.push(m.mood_level)
      else without.push(m.mood_level)
   }
   if (withWorkout.length < 2 || without.length < 2) return []
   const avgWith = withWorkout.reduce((a, b) => a + b, 0) / withWorkout.length
   const avgWithout = without.reduce((a, b) => a + b, 0) / without.length
   const delta = avgWith - avgWithout
   if (delta >= 0.5) {
      return [
         {
            type: 'mood_better_with_workouts',
            data: { delta: +delta.toFixed(1) }
         }
      ]
   }
   return []
}

/** Mood promedio < 2.5 en los últimos 3+ registros. */
const detectPersistentLowMood = (input: PatternEngineInput): ItfPattern[] => {
   const recent = [...input.moods].sort((a, b) => b.log_date.localeCompare(a.log_date)).slice(0, 5)
   if (recent.length < 3) return []
   const avg = recent.reduce((s, m) => s + m.mood_level, 0) / recent.length
   if (avg < 2.5) {
      return [
         {
            type: 'persistent_low_mood',
            data: { avg: +avg.toFixed(1), days: recent.length }
         }
      ]
   }
   return []
}

/** Hidratación promedio ≥ 6 vasos/día en últimos 7 días con registros. */
const detectGoodHydrationStreak = (input: PatternEngineInput): ItfPattern[] => {
   const byDay = new Map<string, number>()
   const last7Days = new Set<string>()
   const today = new Date()
   for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      last7Days.add(d.toISOString().slice(0, 10))
   }
   for (const w of input.water) {
      const d = w.logged_at.slice(0, 10)
      if (last7Days.has(d)) {
         byDay.set(d, (byDay.get(d) ?? 0) + w.delta_glasses)
      }
   }
   const days = Array.from(byDay.values()).filter((v) => v > 0)
   if (days.length < 4) return []
   const avg = days.reduce((a, b) => a + b, 0) / days.length
   if (avg >= 6) {
      return [
         {
            type: 'good_hydration_streak',
            data: { avg: +avg.toFixed(1), days: days.length }
         }
      ]
   }
   return []
}

/* ============================================================
 *  Orchestrator
 * ============================================================ */

export const detectAllPatterns = (input: PatternEngineInput): ItfPattern[] => {
   return [
      ...detectFrequentlySubstituted(input),
      ...detectOftenSkippedMealType(input),
      ...detectStrugglesWithMeals(input),
      ...detectAvoidsCooking(input),
      ...detectLowAdherenceDay(input),
      ...detectHighWorkoutDay(input),
      ...detectMoodWorkoutCorrelation(input),
      ...detectPersistentLowMood(input),
      ...detectGoodHydrationStreak(input)
   ]
}
