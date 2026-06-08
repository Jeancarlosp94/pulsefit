import type { ItfOrganizedSession, ItfPrescribedExercise, ItfExercisePattern } from './types'

/**
 * Tips genéricos por patrón muscular. Si la IA falla 2 veces, el orquestador
 * arma la sesión con orden determinístico (compounds → accessories → core)
 * y agrega estos tips.
 *
 * Reglas: tono cálido, máx 120 chars, cero promesas estéticas, cero consejo médico.
 */
const TIPS_BY_PATTERN: Record<ItfExercisePattern | 'default', string> = {
   squat: 'Pecho arriba, peso en los talones, respira tranquilo al subir.',
   hinge: 'Bisagra desde la cadera, espalda neutra, escapulas firmes.',
   push_horizontal: 'Codos a 45°, baja con control, sube exhalando.',
   push_vertical: 'Mira al frente, sube en línea recta sin trabar codos.',
   pull_horizontal: 'Codo cerca del cuerpo, escápula al final del rango.',
   pull_vertical: 'Lleva la barra al pecho, no encojas los hombros.',
   lunge: 'Tronco erguido, rodilla detrás de la punta, paso firme.',
   core: 'Cuerpo firme, respiración tranquila, calidad sobre cantidad.',
   carry: 'Hombros bajos, abdomen activado, pasos cortos y seguros.',
   default: 'Forma sobre velocidad, respira y siente cada repetición.'
}

const DEFAULT_WARMUP = {
   duration_min: 5,
   movements: [
      'Rotación de hombros 30 segundos',
      'Círculos de cadera 30 segundos',
      'Gato-vaca x 8 reps',
      'Marcha en el lugar 1 minuto'
   ]
}

const DEFAULT_COOLDOWN = {
   duration_min: 5,
   movements: [
      'Estiramiento de cuádriceps 30s por lado',
      'Estiramiento de pectoral en marco 30s por lado',
      'Postura del niño 1 minuto',
      'Respiración diafragmática 1 minuto'
   ]
}

interface FallbackInput {
   prescribed: ItfPrescribedExercise[]
   sessionMinutes: number
}

/**
 * Construye una sesión determinística completa. NUNCA falla: si prescribed
 * está vacío, devuelve session con blocks vacíos pero estructura válida.
 */
export const buildRoutineFallback = ({
   prescribed,
   sessionMinutes
}: FallbackInput): ItfOrganizedSession => {
   /* Orden por categoría: compuestos → accesorios → core. */
   const ordered = [...prescribed].sort((a, b) => {
      const order: Record<ItfPrescribedExercise['orderCategory'], number> = {
         compound: 0,
         accessory: 1,
         core: 2
      }
      return order[a.orderCategory] - order[b.orderCategory]
   })

   /* Necesitamos saber el patrón para el tip. Lo inferimos por nombre del
    * ejercicio o, en último caso, usamos el default. */
   const tipFor = (ex: ItfPrescribedExercise): string => {
      const lname = ex.name.toLowerCase()
      if (lname.includes('sentadilla') || lname.includes('squat')) return TIPS_BY_PATTERN.squat
      if (lname.includes('muerto') || lname.includes('hinge') || lname.includes('puente'))
         return TIPS_BY_PATTERN.hinge
      if (lname.includes('flexion') || (lname.includes('press') && lname.includes('banca')))
         return TIPS_BY_PATTERN.push_horizontal
      if (lname.includes('press') && lname.includes('hombros')) return TIPS_BY_PATTERN.push_vertical
      if (lname.includes('remo')) return TIPS_BY_PATTERN.pull_horizontal
      if (lname.includes('dominada') || lname.includes('jalón'))
         return TIPS_BY_PATTERN.pull_vertical
      if (lname.includes('zancada') || lname.includes('lunge')) return TIPS_BY_PATTERN.lunge
      if (lname.includes('plancha') || lname.includes('core') || lname.includes('abdomen'))
         return TIPS_BY_PATTERN.core
      if (lname.includes('caminata')) return TIPS_BY_PATTERN.carry
      return TIPS_BY_PATTERN.default
   }

   const blocks = ordered.map((ex) => ({
      exercise_id: ex.exerciseId,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest_sec: ex.restSec,
      tip: tipFor(ex)
   }))

   return {
      warmup: DEFAULT_WARMUP,
      blocks,
      cooldown: DEFAULT_COOLDOWN,
      estimated_total_min: sessionMinutes
   }
}
