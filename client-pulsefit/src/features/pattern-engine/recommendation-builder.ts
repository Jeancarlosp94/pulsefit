import type { ItfPattern, ItfRecommendation } from './types'

let counter = 0
const nextId = () => `rec_${++counter}`

/**
 * Convierte patrones detectados en recomendaciones accionables y
 * compasivas, listas para mostrar al usuario.
 *
 * El tono está firmado por Lucía + Valentina + Carlos:
 *   - Cero "fallaste", "deberías".
 *   - Curiosidad amable ("notamos…", "¿probamos…?").
 *   - Severity high → sugiere profesional o cambio de plan.
 *   - Severity medium → propone ajuste suave.
 *   - Severity low → preferencia detectada (transparencia).
 */
export const buildRecommendations = (patterns: ItfPattern[]): ItfRecommendation[] => {
   counter = 0
   const recs: ItfRecommendation[] = []

   for (const p of patterns) {
      const data = p.data

      switch (p.type) {
         case 'frequently_substituted': {
            const name = (data.recipe_name as string) ?? ''
            const count = data.count as number
            recs.push({
               id: nextId(),
               pattern_type: p.type,
               severity: 'low',
               icon: '🔁',
               title: `${name} no te convence`,
               message: `Notamos que cambiaste ${name} ${count} veces. ¿Quieres que la reemplacemos en tu plan por algo distinto? 🌱`
            })
            break
         }

         case 'often_skipped_meal_type': {
            const label = (data.label as string) ?? ''
            const ratio = data.ratio as number
            recs.push({
               id: nextId(),
               pattern_type: p.type,
               severity: 'medium',
               icon: '⏰',
               title: `Sueles saltar el ${label}`,
               message: `Vimos que saltas el ${label} ${ratio}% de las veces. ¿Probamos quitarlo del plan o moverlo de hora? Sin presión.`
            })
            break
         }

         case 'struggles_with_meals': {
            const ratio = data.ratio as number
            recs.push({
               id: nextId(),
               pattern_type: p.type,
               severity: 'medium',
               icon: '🌿',
               title: 'Está costando seguir el plan',
               message: `Saltaste el ${ratio}% de tus comidas planeadas. Probemos un plan más simple con menos comidas o más flexibilidad esta semana.`
            })
            break
         }

         case 'avoids_cooking': {
            const count = data.count as number
            recs.push({
               id: nextId(),
               pattern_type: p.type,
               severity: 'medium',
               icon: '🍳',
               title: 'Cocinar no es lo tuyo ahora',
               message: `Usaste "no quiero cocinar" ${count} veces este mes. ¿Probamos un plan con recetas de máximo 15 min? 🌿`
            })
            break
         }

         case 'low_adherence_day': {
            const day = data.day as string
            const ratio = data.ratio as number
            recs.push({
               id: nextId(),
               pattern_type: p.type,
               severity: 'medium',
               icon: '📅',
               title: `Los ${day} te cuestan`,
               message: `El ${day} salteas o cambias el ${ratio}% de tus comidas. ¿Movemos tu plan ese día a algo más liviano? 🤝`
            })
            break
         }

         case 'high_workout_day': {
            const day = data.day as string
            const count = data.count as number
            recs.push({
               id: nextId(),
               pattern_type: p.type,
               severity: 'low',
               icon: '💪',
               title: `${day} es tu día fuerte`,
               message: `Llevas ${count} entrenamientos los ${day}. Tu cuerpo entró en ritmo. Vamos a respetar ese día. 🌱`
            })
            break
         }

         case 'mood_better_with_workouts': {
            const delta = data.delta as number
            recs.push({
               id: nextId(),
               pattern_type: p.type,
               severity: 'low',
               icon: '☀️',
               title: 'Tu ánimo sube cuando entrenas',
               message: `Tu ánimo es +${delta} puntos los días que entrenas. Vale la pena recordarlo cuando dudes en empezar. 🌿`
            })
            break
         }

         case 'persistent_low_mood': {
            const avg = data.avg as number
            recs.push({
               id: nextId(),
               pattern_type: p.type,
               severity: 'high',
               icon: '🤝',
               title: 'Tu ánimo lleva días bajo',
               message: `Tu promedio reciente es ${avg}/5. Buscar apoyo profesional es valentía, no debilidad. Te dejamos abierto el camino. 🌿`
            })
            break
         }

         case 'good_hydration_streak': {
            const avg = data.avg as number
            recs.push({
               id: nextId(),
               pattern_type: p.type,
               severity: 'low',
               icon: '💧',
               title: 'Bien hidratado/a',
               message: `Promediaste ${avg} vasos/día esta semana. Sigue así — la energía y digestión te lo agradecen. 🌱`
            })
            break
         }
      }
   }

   return recs
}
