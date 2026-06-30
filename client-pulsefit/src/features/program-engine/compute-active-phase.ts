import type {
   ItfActivePhase,
   ItfModality,
   ItfTrainingPhase,
   ItfTrainingProgram
} from '@/interface/itfPrograms'
import type { ItfExerciseModality } from '@/features/routine-generator'

/**
 * Sprint 11.11: bridge entre ItfModality (programa) y ItfExerciseModality
 * (motor de rutinas). Modalidades de cardio puro (running/cycling/swimming/sport)
 * NO son ejercicios del motor — se loggean por separado con LogActivityDialog.
 * Para esos casos devolvemos undefined.
 */
export const modalityToExerciseModality = (
   modality: ItfModality
): ItfExerciseModality | undefined => {
   switch (modality) {
      case 'gym':
      case 'hiit':
      case 'calistenia':
      case 'yoga':
      case 'barre':
      case 'pilates':
      case 'crossfit':
      case 'hybrid':
         return modality
      case 'running':
      case 'cycling':
      case 'swimming':
      case 'sport':
         return undefined
   }
}

/**
 * Calcula qué fase del programa está activa HOY y cuántas semanas faltan.
 * 100% determinístico, sin IA. Pensado para correr en cliente.
 *
 * Si el programa empezó en el futuro → devuelve la primera fase con
 * week_in_program=0 (still upcoming).
 *
 * Si el programa ya terminó → devuelve null (el caller debe marcar status).
 */
export const computeActivePhase = (
   program: ItfTrainingProgram,
   now: Date = new Date()
): ItfActivePhase | null => {
   const start = new Date(program.start_date)
   const today = new Date(now)
   today.setHours(0, 0, 0, 0)
   start.setHours(0, 0, 0, 0)

   const msPerWeek = 7 * 24 * 60 * 60 * 1000
   const elapsedMs = today.getTime() - start.getTime()
   const elapsedWeeks = Math.max(0, Math.floor(elapsedMs / msPerWeek))

   /* Programa aún no empieza → upcoming. */
   if (elapsedMs < 0 && program.phases.length > 0) {
      const first = [...program.phases].sort((a, b) => a.phase_order - b.phase_order)[0]
      return {
         phase: first,
         week_in_phase: 0,
         week_in_program: 0,
         weeks_remaining: first.weeks,
         total_weeks_remaining: program.total_weeks
      }
   }

   /* Programa terminado. */
   if (elapsedWeeks >= program.total_weeks) {
      return null
   }

   /* Sort por phase_order. */
   const sortedPhases = [...program.phases].sort((a, b) => a.phase_order - b.phase_order)

   /* Acumular semanas hasta encontrar la fase actual. */
   let accumulated = 0
   for (const phase of sortedPhases) {
      const phaseEnd = accumulated + phase.weeks
      if (elapsedWeeks < phaseEnd) {
         const weekInPhase = elapsedWeeks - accumulated + 1 /* 1-indexed */
         return {
            phase,
            week_in_phase: weekInPhase,
            week_in_program: elapsedWeeks + 1,
            weeks_remaining: phase.weeks - weekInPhase + 1,
            total_weeks_remaining: program.total_weeks - elapsedWeeks
         }
      }
      accumulated = phaseEnd
   }

   return null
}

/** Valida que las fases sumen exactamente total_weeks del programa. */
export const validatePhases = (
   phases: Array<Pick<ItfTrainingPhase, 'weeks'>>,
   totalWeeks: number
): { valid: boolean; message: string | null } => {
   const sum = phases.reduce((acc, p) => acc + p.weeks, 0)
   if (sum !== totalWeeks) {
      return {
         valid: false,
         message: `Las fases suman ${sum} semanas pero el programa dura ${totalWeeks}. Ajusta antes de guardar.`
      }
   }
   if (phases.length === 0) {
      return { valid: false, message: 'Necesitas al menos 1 fase.' }
   }
   if (phases.length > 6) {
      return { valid: false, message: 'Máximo 6 fases por programa (más se vuelve confuso).' }
   }
   return { valid: true, message: null }
}
