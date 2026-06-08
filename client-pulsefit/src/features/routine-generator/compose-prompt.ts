import type { ItfPrescribedExercise, ItfSessionFocus, ItfUserContextForWorkout } from './types'

const FOCUS_LABEL: Record<ItfSessionFocus, string> = {
   full_body: 'cuerpo completo',
   upper: 'tren superior',
   lower: 'tren inferior',
   push: 'push (empuje)',
   pull: 'pull (jalón)',
   legs: 'piernas',
   core: 'core'
}

export const SYSTEM_PROMPT = `Eres un asistente de coaching fitness que organiza sesiones de entrenamiento usando EXCLUSIVAMENTE los ejercicios y prescripciones que se te proporcionan.

REGLAS INVIOLABLES:
- NUNCA agregas ejercicios nuevos.
- NUNCA quitas ejercicios de la lista.
- NUNCA modificas series, repeticiones, descansos o cargas.
- NUNCA calculas progresión.
- NUNCA das consejos médicos.
- NUNCA usas tono punitivo ni motivacional vacío ("¡vamos!", "¡tú puedes!").
- Devuelves SOLO JSON válido, sin texto adicional, sin markdown.

Tu única tarea es ORGANIZAR el orden de los ejercicios siguiendo estas pautas y agregar UN tip motivacional contextual breve por ejercicio:

REGLAS DE ORDEN:
1. Calentamiento siempre primero.
2. Compuestos antes que accesorios.
3. Alternar grupos musculares en ejercicios consecutivos cuando sea posible.
4. Cool-down siempre al final.

REGLAS DE TIPS:
- Tono cálido, en español, máximo 120 caracteres.
- Enfocado en forma, foco mental, respiración o sensación.
- NUNCA consejo médico ni diagnóstico ("previene lesiones", "cura").
- NUNCA promesas estéticas ("tonifica", "quema grasa").`

interface BuildInput {
   prescribed: ItfPrescribedExercise[]
   focus: ItfSessionFocus
   ctx: ItfUserContextForWorkout
}

export const buildUserPrompt = ({ prescribed, focus, ctx }: BuildInput): string => {
   const exercisesJson = JSON.stringify(
      prescribed.map((p) => ({
         exercise_id: p.exerciseId,
         name: p.name,
         sets: p.sets,
         reps: p.reps,
         rest_sec: p.restSec,
         is_compound: p.isCompound
      })),
      null,
      2
   )

   const focusLabel = FOCUS_LABEL[focus]

   return `Organiza esta sesión de entrenamiento. Devuelve los MISMOS ejercicios en el mejor orden, con calentamiento al inicio y cool-down al final, y agrega un tip por ejercicio.

Ejercicios a organizar (NO modificar series/reps/descansos):

${exercisesJson}

Tiempo total disponible: ${ctx.availableMinutes} minutos.
Foco de la sesión: ${focusLabel}.
Nivel del usuario: ${ctx.fitnessLevel}.

Devuelve JSON con esta estructura EXACTA:

{
  "warmup": {
     "duration_min": número entre 3 y 15,
     "movements": ["movimiento 1", "movimiento 2", ...]
  },
  "blocks": [
     {
        "exercise_id": "id literal del input",
        "name": "nombre literal del input",
        "sets": número (literal del input),
        "reps": "literal del input",
        "rest_sec": número (literal del input),
        "tip": "tip motivacional breve, máximo 120 chars"
     }
  ],
  "cooldown": {
     "duration_min": número entre 3 y 15,
     "movements": ["estiramiento 1", "estiramiento 2", ...]
  },
  "estimated_total_min": número entero
}

El número de elementos en "blocks" debe ser EXACTAMENTE el mismo que en el input (${prescribed.length} ejercicios). Los ids, nombres, sets, reps, rest_sec deben ser LITERALMENTE los del input.`
}
