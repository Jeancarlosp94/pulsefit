import type { ItfAdjustment, ItfReviewSummary, ItfWeeklyMetrics } from './types'

const extractHighlights = (m: ItfWeeklyMetrics): string[] => {
   const out: string[] = []
   if (m.streak_days >= 7) out.push(`Llevas ${m.streak_days} días al hilo 🔥`)
   else if (m.streak_days >= 3) out.push(`${m.streak_days} días seguidos activa/o`)
   if (m.workouts_count >= 3) out.push(`${m.workouts_count} entrenamientos completados`)
   if (m.meal_adherence_pct >= 70) out.push(`${m.meal_adherence_pct}% adherencia a comidas`)
   if (m.water_avg_glasses >= 7) out.push(`Hidratación promedio ${m.water_avg_glasses} vasos/día`)
   if (m.mood_days >= 5) out.push(`Te escuchaste ${m.mood_days} días esta semana`)
   if (out.length === 0) out.push('Volviste a abrir la app — eso también cuenta 🌿')
   return out.slice(0, 4)
}

const adherenceLevel = (pct: number): 'high' | 'medium' | 'low' =>
   pct > 70 ? 'high' : pct > 40 ? 'medium' : 'low'

const SUMMARY_BY_LEVEL: Record<'high' | 'medium' | 'low', (m: ItfWeeklyMetrics) => string> = {
   high: (m) =>
      `Llevaste tu semana con buena consistencia: cumpliste el ${m.meal_adherence_pct}% de las comidas planeadas y registraste ${m.workouts_count} entrenamientos. Tu cuerpo está respondiendo a esa constancia.`,
   medium: (m) =>
      `Tuviste una semana mixta: ${m.meal_adherence_pct}% de adherencia y ${m.workouts_count} entrenamientos. Hay base para construir, sin necesidad de exigirte más.`,
   low: (m) =>
      `Esta semana fue cuesta arriba: ${m.meal_adherence_pct}% de comidas registradas. Está bien. Lo importante es que volviste a la app — desde acá seguimos.`
}

/**
 * Plantilla determinística para cuando la IA falla o la respuesta no
 * pasa el validador. Mantiene el tono compasivo asegurado.
 */
export const buildFallbackSummary = (
   metrics: ItfWeeklyMetrics,
   adjustments: ItfAdjustment[],
   name?: string
): ItfReviewSummary => {
   const level = adherenceLevel(metrics.meal_adherence_pct)
   const safeName = name && name.length > 0 ? name : 'tú'
   return {
      greeting: `Hola ${safeName}, revisemos tu semana 🌿`,
      summary: SUMMARY_BY_LEVEL[level](metrics),
      highlights: extractHighlights(metrics),
      adjustments_intro:
         adjustments.length > 0
            ? 'Te propongo estos pequeños cambios para la próxima semana:'
            : 'Vamos a mantener el plan tal como está y seguir avanzando juntos.',
      closing: 'Sigamos paso a paso, sin prisa 🌱',
      source: 'fallback'
   }
}
