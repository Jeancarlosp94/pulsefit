import { MEAL_DISTRIBUTIONS, MEAL_MIN_KCAL, type ItfMealType, type ItfMealsPerDay } from './types'

/**
 * Distribución calórica DINÁMICA por día.
 *
 * Reemplaza el uso directo de MEAL_DISTRIBUTIONS estático en la generación
 * de planes. MEAL_DISTRIBUTIONS sigue siendo el "anchor base" firmado por Lucía;
 * este distribuidor solo aplica jitter ±10% sobre esos porcentajes y re-normaliza
 * para que la suma diaria sea EXACTAMENTE el target_kcal del usuario.
 *
 * REGLA INNEGOCIABLE (verificada por test):
 *   sum(result.values()) === targetKcal      // EXACTO, no ±1
 *
 * Reglas de Lucía preservadas:
 *   - MEAL_MIN_KCAL: si el jitter dejaría una comida bajo el mínimo, se sube
 *     al mínimo y se renormalizan las demás.
 *   - Solo se distribuye en los meal_types ACTIVOS según mealsPerDay
 *     (no se inventan comidas extra).
 */
export interface ItfDailyDistribution {
   /** kcal exactas por meal_type. Suma === targetKcal. */
   kcalByMeal: Partial<Record<ItfMealType, number>>
   /** Porcentajes finales (post-jitter post-normalización). Solo informativo. */
   percentByMeal: Partial<Record<ItfMealType, number>>
}

interface DistributionInput {
   mealsPerDay: ItfMealsPerDay
   dayIndex: number /* 0..N-1 */
   targetKcal: number
   /** Seed para hacer reproducible la distribución (mismo seed+día = misma distribución). */
   seed: number
}

const JITTER_PCT = 0.1 /* ±10% del valor base por comida */

/**
 * Pseudo-random determinístico en [-1, 1]. NO usa Math.random porque el plan
 * debe ser reproducible (Edge Function + cliente comparten el cálculo).
 */
const deterministicNoise = (seed: number, dayIndex: number, mealIdx: number): number => {
   const x = Math.sin(seed * 12.9898 + dayIndex * 78.233 + mealIdx * 37.719) * 43758.5453
   return (x - Math.floor(x)) * 2 - 1
}

export const computeDailyDistribution = ({
   mealsPerDay,
   dayIndex,
   targetKcal,
   seed
}: DistributionInput): ItfDailyDistribution => {
   const base = MEAL_DISTRIBUTIONS[mealsPerDay]
   const mealTypes = Object.keys(base) as ItfMealType[]

   /* Paso 1: aplicar jitter ±10% sobre porcentaje base. */
   const jittered: Record<string, number> = {}
   mealTypes.forEach((mt, idx) => {
      const noise = deterministicNoise(seed, dayIndex, idx)
      const factor = 1 + noise * JITTER_PCT
      jittered[mt] = (base[mt] ?? 0) * factor
   })

   /* Paso 2: normalizar a suma = 1.0. */
   const pcts: Record<string, number> = {}
   let total = mealTypes.reduce((s, mt) => s + jittered[mt], 0)
   mealTypes.forEach((mt) => {
      pcts[mt] = jittered[mt] / total
   })

   /* Paso 3: enforce MEAL_MIN_KCAL iterativamente. Si alguna comida queda
    * bajo el mínimo, la fijamos al mínimo y renormalizamos las demás. */
   for (let iter = 0; iter < 8; iter++) {
      const violators: ItfMealType[] = []
      const valid: ItfMealType[] = []
      mealTypes.forEach((mt) => {
         const k = pcts[mt] * targetKcal
         const min = MEAL_MIN_KCAL[mt] ?? 0
         if (k < min) violators.push(mt)
         else valid.push(mt)
      })
      if (violators.length === 0) break
      if (valid.length === 0) {
         /* Caso patológico: target tan bajo que ni siquiera los mínimos caben.
          * Distribuimos proporcional a base (sin jitter) y cortamos en el ratio. */
         mealTypes.forEach((mt) => {
            pcts[mt] = base[mt] ?? 0
         })
         total = mealTypes.reduce((s, mt) => s + pcts[mt], 0)
         mealTypes.forEach((mt) => {
            pcts[mt] = pcts[mt] / total
         })
         break
      }

      const reservedKcal = violators.reduce((s, mt) => s + (MEAL_MIN_KCAL[mt] ?? 0), 0)
      const remainingKcal = Math.max(0, targetKcal - reservedKcal)
      const validSum = valid.reduce((s, mt) => s + pcts[mt], 0)

      violators.forEach((mt) => {
         pcts[mt] = (MEAL_MIN_KCAL[mt] ?? 0) / targetKcal
      })
      valid.forEach((mt) => {
         pcts[mt] = validSum > 0 ? (pcts[mt] / validSum) * (remainingKcal / targetKcal) : 0
      })
   }

   /* Paso 4: convertir a kcal redondeado. */
   const kcal: Partial<Record<ItfMealType, number>> = {}
   mealTypes.forEach((mt) => {
      kcal[mt] = Math.round(pcts[mt] * targetKcal)
   })

   /* Paso 5: ajustar la ÚLTIMA comida para que la suma sea EXACTAMENTE targetKcal.
    * El error de redondeo nunca debería ser mayor a (mealTypes.length / 2) kcal. */
   const roundedSum = mealTypes.reduce((s, mt) => s + (kcal[mt] ?? 0), 0)
   const drift = targetKcal - roundedSum
   if (drift !== 0) {
      const lastMeal = mealTypes[mealTypes.length - 1]
      kcal[lastMeal] = (kcal[lastMeal] ?? 0) + drift
   }

   /* Recalcular porcentajes finales para reporting. */
   const finalPct: Partial<Record<ItfMealType, number>> = {}
   mealTypes.forEach((mt) => {
      finalPct[mt] = (kcal[mt] ?? 0) / targetKcal
   })

   return { kcalByMeal: kcal, percentByMeal: finalPct }
}

/**
 * Helper: dado N días, devuelve la asignación rotacional de recipeIdx por día.
 * Día 0 → recipe 0, día 1 → recipe 1, día 2 → recipe 2, día 3 → recipe 0, ...
 */
export const recipeIndexForDay = (dayIndex: number, recipeCount: number): number =>
   ((dayIndex % recipeCount) + recipeCount) % recipeCount
