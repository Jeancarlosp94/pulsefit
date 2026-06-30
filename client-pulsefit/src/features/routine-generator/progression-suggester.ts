import type { ItfProgressionSuggestion, ItfWorkoutLog } from '@/interface/itfWorkouts'

/**
 * Lógica de progresión "double progression light" — el mismo método que
 * usa Carlos con clientes nuevos:
 *
 *   1. Si NO hay logs previos → sugerimos empezar con peso cómodo
 *      (input manual). Devolvemos kind: 'first_time'.
 *
 *   2. Si hay al menos 1 log → mostramos "Última vez: 3×8 @ 20kg (RPE 7)"
 *      como contexto.
 *
 *   3. Si las DOS ÚLTIMAS sesiones (en los últimos 21 días) cerraron CON
 *      el RPE objetivo O MENOR → sugerir:
 *        · Compounds: +2.5 kg
 *        · Accesorios: +1.25 kg (o +1 rep si peso corporal)
 *      → kind: 'progress'
 *
 *   4. Si la última sesión fue RPE > target → mantener
 *      → kind: 'maintain'
 *
 *   5. Si han pasado > 14 días desde el último log → sugerir bajar 10%
 *      por descondicionamiento.
 *      → kind: 'deload'
 *
 * Carlos validó: en deload week (semana 5 del programa), la app ya baja
 * intensidad por su cuenta — esta lógica solo aplica fuera de deload.
 */

interface SuggestNextInput {
   /** Logs ordenados por fecha desc (más reciente primero). */
   recentLogs: ItfWorkoutLog[]
   /** RPE objetivo prescrito por el motor (típicamente 7). */
   targetRpe: number
   /** ¿Es ejercicio compound (sentadilla, peso muerto, press)? */
   isCompound: boolean
   /** ¿Es ejercicio de peso corporal? (entonces sugerimos +reps en lugar de +kg) */
   isBodyweight?: boolean
   /** Reps prescritas por el motor para esta sesión. */
   prescribedReps: number
   /** Si está en deload semana, no progresar. */
   isDeloadWeek?: boolean
}

const DAYS = 24 * 60 * 60 * 1000

export const suggestNextWeight = (input: SuggestNextInput): ItfProgressionSuggestion => {
   const { recentLogs, targetRpe, isCompound, isBodyweight, prescribedReps, isDeloadWeek } = input

   /* Sprint 11.7: filtrar logs no-strength (sport/dance/cardio/movement no
    * tienen weight_kg). Solo logs de strength alimentan progression suggester. */
   const strengthLogs = recentLogs.filter(
      (
         l
      ): l is ItfWorkoutLog & {
         weight_kg: number
         sets_completed: number
         reps_completed: number
      } =>
         l.activity_type === 'strength' &&
         l.weight_kg !== null &&
         l.sets_completed !== null &&
         l.reps_completed !== null
   )

   /* Caso 1: primera vez (o solo actividades no-strength). */
   if (strengthLogs.length === 0) {
      return {
         weightKg: 0,
         reps: prescribedReps,
         reason: 'Empieza con un peso cómodo (RPE 5-6). Lo registramos para la próxima.',
         kind: 'first_time'
      }
   }

   const last = strengthLogs[0]
   /* Caso 5: pasaron > 14 días → deload por descondicionamiento. */
   const daysSince = (Date.now() - new Date(last.logged_at).getTime()) / DAYS
   if (daysSince > 14) {
      const suggested = Math.max(0, Math.round(last.weight_kg * 0.9 * 4) / 4)
      return {
         weightKg: suggested,
         reps: prescribedReps,
         reason: `Han pasado ${Math.floor(daysSince)} días — empieza un poco más liviano (${suggested} kg) y subimos pronto.`,
         kind: 'deload'
      }
   }

   /* En semana de descarga del programa: mantener. */
   if (isDeloadWeek) {
      return {
         weightKg: last.weight_kg,
         reps: prescribedReps,
         reason: `Semana de descarga: mantenemos ${last.weight_kg} kg con RPE bajo.`,
         kind: 'maintain'
      }
   }

   /* Caso 3: chequear si las 2 últimas cerraron al RPE objetivo o menor. */
   const lastRpe = last.rpe_actual ?? targetRpe
   const prev = strengthLogs[1]
   const prevRpe = prev?.rpe_actual ?? targetRpe

   const canProgress = lastRpe <= targetRpe && (prev ? prevRpe <= targetRpe : false)

   if (canProgress) {
      let increment: number
      if (isBodyweight) {
         /* Peso corporal: sumar 1 rep. */
         return {
            weightKg: 0,
            reps: prescribedReps + 1,
            reason: `Cerraste 2 sesiones al RPE objetivo — suma 1 rep esta vez (${prescribedReps + 1}).`,
            kind: 'progress'
         }
      } else if (isCompound) {
         increment = 2.5
      } else {
         increment = 1.25
      }
      const suggested = Math.round((last.weight_kg + increment) * 4) / 4
      return {
         weightKg: suggested,
         reps: prescribedReps,
         reason: `Cerraste 2 sesiones al RPE objetivo — prueba ${suggested} kg (+${increment} kg).`,
         kind: 'progress'
      }
   }

   /* Caso 4: mantener carga. */
   return {
      weightKg: last.weight_kg,
      reps: prescribedReps,
      reason: `Mantenemos ${last.weight_kg} kg — primero cierra al RPE objetivo, después subimos.`,
      kind: 'maintain'
   }
}

/** Formatea una fila "última vez" para mostrar al usuario.
 *  Sprint 11.7: si el log es no-strength, devuelve un formato diferente. */
export const formatLastSession = (log: ItfWorkoutLog): string => {
   if (log.activity_type !== 'strength') {
      const name = log.activity_name ?? 'actividad'
      const dur = log.duration_min ? ` ${log.duration_min} min` : ''
      return `${name}${dur}`
   }
   const weightKg = log.weight_kg ?? 0
   const weight = weightKg > 0 ? ` @ ${weightKg} kg` : ''
   const rpe = log.rpe_actual ? ` (RPE ${log.rpe_actual})` : ''
   return `${log.sets_completed ?? 0}×${log.reps_completed ?? 0}${weight}${rpe}`
}
