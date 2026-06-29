/**
 * Monitor de mood persistente bajo.
 *
 * Si el promedio de mood en los últimos N días consecutivos es ≤ threshold,
 * disparamos escalación con recursos profesionales SIN ESPERAR a la revisión
 * semanal (que puede tardar 7 días en mostrarse).
 *
 * Reglas firmadas por Valentina (psicóloga consultora):
 *   - ≥ 3 días consecutivos con mood ≤ 2 → severity=high (modal escalation).
 *   - ≥ 5 días con mood ≤ 2.5 promedio → severity=medium (sugerencia suave).
 *   - Si el usuario ya marcó eating_disorder_history → cualquier mood ≤ 2.5
 *     por 2 días seguidos → severity=high.
 */

export interface MoodMonitorInput {
   /** Últimos moods ordenados de más reciente a más antiguo. */
   recent_moods: Array<{ log_date: string; mood_level: number; energy_level: number }>
   /** Flag del perfil — si TCA, el umbral es más estricto. */
   eating_disorder_history: boolean
}

export type ItfMoodAlertSeverity = 'high' | 'medium' | null

export interface MoodAlertResult {
   severity: ItfMoodAlertSeverity
   reason: string | null
   /** Para el modal: cuántos días lleva en mood bajo. */
   consecutive_days: number
   avg_mood: number | null
}

const isConsecutive = (dates: string[]): boolean => {
   if (dates.length < 2) return true
   const sorted = [...dates].sort().reverse() /* más reciente primero */
   for (let i = 1; i < sorted.length; i++) {
      const a = new Date(sorted[i - 1])
      const b = new Date(sorted[i])
      const diff = Math.round((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000))
      if (diff !== 1) return false
   }
   return true
}

export const checkMoodHealth = (input: MoodMonitorInput): MoodAlertResult => {
   const { recent_moods, eating_disorder_history } = input

   if (recent_moods.length === 0) {
      return { severity: null, reason: null, consecutive_days: 0, avg_mood: null }
   }

   /* TCA history: umbral más estricto (mood ≤ 2.5 por 2 días seguidos). */
   if (eating_disorder_history) {
      const last2 = recent_moods.slice(0, 2)
      if (last2.length === 2) {
         const avg = (last2[0].mood_level + last2[1].mood_level) / 2
         if (avg <= 2.5 && isConsecutive(last2.map((m) => m.log_date))) {
            return {
               severity: 'high',
               reason:
                  'Tu ánimo lleva varios días bajo. Con historial de TCA, vale la pena hablar con alguien que te acompañe.',
               consecutive_days: 2,
               avg_mood: avg
            }
         }
      }
   }

   /* Regla general 1: ≥ 3 días consecutivos con mood ≤ 2 → severity=high. */
   const last3 = recent_moods.slice(0, 3)
   if (last3.length === 3 && last3.every((m) => m.mood_level <= 2)) {
      if (isConsecutive(last3.map((m) => m.log_date))) {
         const avg = last3.reduce((s, m) => s + m.mood_level, 0) / 3
         return {
            severity: 'high',
            reason:
               'Llevas 3 días seguidos con ánimo bajo. No tienes que pasar por esto sola/o — buscar apoyo es valentía.',
            consecutive_days: 3,
            avg_mood: +avg.toFixed(1)
         }
      }
   }

   /* Regla general 2: ≥ 5 registros con avg ≤ 2.5 → severity=medium. */
   const last5 = recent_moods.slice(0, 5)
   if (last5.length >= 5) {
      const avg = last5.reduce((s, m) => s + m.mood_level, 0) / last5.length
      if (avg <= 2.5) {
         return {
            severity: 'medium',
            reason:
               'Tu ánimo promedio fue bajo esta semana. Si quieres, te mostramos recursos profesionales cercanos.',
            consecutive_days: last5.length,
            avg_mood: +avg.toFixed(1)
         }
      }
   }

   return { severity: null, reason: null, consecutive_days: 0, avg_mood: null }
}
