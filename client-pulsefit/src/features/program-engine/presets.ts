import type { ItfCreateProgramInput, ItfModality, ItfPhaseFocus } from '@/interface/itfPrograms'

/**
 * Presets de programas LATAM-friendly para arranque rápido.
 * Cada uno es una plantilla razonable firmada por Carlos (entrenador):
 *   - Periodización progresiva (adaptación → carga → consolidación).
 *   - Combinación de modalidades realistas.
 *   - Total weeks razonable para el goal.
 */

export interface ProgramPreset {
   id: string
   label: string
   description: string
   /** Emoji para el card visual. */
   emoji: string
   build: (opts?: { target_weight_kg?: number | null }) => ItfCreateProgramInput
}

export const PROGRAM_PRESETS: ProgramPreset[] = [
   {
      id: 'lose_3kg_12w',
      label: 'Bajar 3-5 kg en 12 semanas',
      description: 'HIIT → Mixto → Gym. Adherencia primero, intensidad después.',
      emoji: '🌱',
      build: (opts) => ({
         name: 'Mi PulseFit 12 semanas',
         goal_type: 'lose_weight',
         target_weight_kg: opts?.target_weight_kg ?? null,
         total_weeks: 12,
         phases: [
            {
               phase_order: 1,
               phase_name: 'Adaptación',
               modality: 'hiit',
               weeks: 4,
               sessions_per_week: 3,
               intensity_target: 'moderate',
               focus: 'full_body',
               description: 'HIIT corto, 20-25 min. Construir el hábito, no quemar grasa.'
            },
            {
               phase_order: 2,
               phase_name: 'Carga mixta',
               modality: 'hybrid',
               weeks: 4,
               sessions_per_week: 4,
               intensity_target: 'moderate',
               focus: 'full_body',
               description: 'Combinar fuerza + cardio. 4 sesiones cortas.'
            },
            {
               phase_order: 3,
               phase_name: 'Consolidación',
               modality: 'gym',
               weeks: 4,
               sessions_per_week: 3,
               intensity_target: 'intense',
               focus: 'full_body',
               description: 'Fuerza con pesas + 1 cardio. Aprovechar la base creada.'
            }
         ]
      })
   },
   {
      id: 'gain_muscle_16w',
      label: 'Ganar músculo en 16 semanas',
      description: 'Calistenia → Gym → Gym + Hypertrofia. Progresión clásica.',
      emoji: '💪',
      build: (opts) => ({
         name: 'Mi PulseFit hipertrofia',
         goal_type: 'gain_muscle',
         target_weight_kg: opts?.target_weight_kg ?? null,
         total_weeks: 16,
         phases: [
            {
               phase_order: 1,
               phase_name: 'Base de movimiento',
               modality: 'calistenia',
               weeks: 4,
               sessions_per_week: 3,
               intensity_target: 'moderate',
               focus: 'full_body',
               description: 'Movimientos básicos sin peso. Patrón motor antes que carga.'
            },
            {
               phase_order: 2,
               phase_name: 'Fuerza general',
               modality: 'gym',
               weeks: 6,
               sessions_per_week: 4,
               intensity_target: 'moderate',
               focus: 'full_body',
               description: 'Sentadilla, peso muerto, press y dominadas. RPE 7.'
            },
            {
               phase_order: 3,
               phase_name: 'Hipertrofia focalizada',
               modality: 'gym',
               weeks: 6,
               sessions_per_week: 4,
               intensity_target: 'intense',
               focus: 'upper',
               description: 'Volumen alto en torso. 4 sesiones, split push/pull.'
            }
         ]
      })
   },
   {
      id: 'feel_better_8w',
      label: 'Sentirme mejor en 8 semanas',
      description: 'Yoga + Caminatas + algo de fuerza ligera. Foco en bienestar.',
      emoji: '🌿',
      build: () => ({
         name: 'Mi PulseFit bienestar',
         goal_type: 'feel_better',
         total_weeks: 8,
         phases: [
            {
               phase_order: 1,
               phase_name: 'Calma y movimiento',
               modality: 'yoga',
               weeks: 4,
               sessions_per_week: 3,
               intensity_target: 'light',
               focus: 'full_body',
               description: 'Yoga restaurativo + caminatas. Cero presión.'
            },
            {
               phase_order: 2,
               phase_name: 'Activación gentil',
               modality: 'pilates',
               weeks: 4,
               sessions_per_week: 3,
               intensity_target: 'moderate',
               focus: 'core',
               description: 'Pilates suave con caminatas. Empezar a notar fuerza.'
            }
         ]
      })
   },
   {
      id: 'crossfit_12w',
      label: 'CrossFit progresivo en 12 semanas',
      description: 'Calistenia → HIIT → CrossFit completo. Onramp seguro.',
      emoji: '🪨',
      build: (opts) => ({
         name: 'Mi PulseFit CrossFit',
         goal_type: 'gain_muscle',
         target_weight_kg: opts?.target_weight_kg ?? null,
         total_weeks: 12,
         phases: [
            {
               phase_order: 1,
               phase_name: 'Onramp — patrones básicos',
               modality: 'calistenia',
               weeks: 4,
               sessions_per_week: 3,
               intensity_target: 'moderate',
               focus: 'full_body',
               description: 'Squat, hinge, push, pull. Cero kettlebells todavía.'
            },
            {
               phase_order: 2,
               phase_name: 'Metcon corto',
               modality: 'hiit',
               weeks: 4,
               sessions_per_week: 4,
               intensity_target: 'moderate',
               focus: 'full_body',
               description: 'EMOMs y AMRAPs cortos. Empezás a moverte rápido.'
            },
            {
               phase_order: 3,
               phase_name: 'CrossFit pleno',
               modality: 'crossfit',
               weeks: 4,
               sessions_per_week: 4,
               intensity_target: 'intense',
               focus: 'full_body',
               description: 'WODs estándar con thrusters, wall balls, box jumps, snatch.'
            }
         ]
      })
   },
   {
      id: 'event_10w',
      label: 'Preparar un evento (10K, carrera)',
      description: 'Running + fuerza accesoria. Ajustada a tu fecha.',
      emoji: '🏃',
      build: (opts) => ({
         name: 'Mi PulseFit evento',
         goal_type: 'event',
         target_date: null,
         target_weight_kg: opts?.target_weight_kg ?? null,
         total_weeks: 10,
         phases: [
            {
               phase_order: 1,
               phase_name: 'Base aeróbica',
               modality: 'running',
               weeks: 4,
               sessions_per_week: 3,
               intensity_target: 'moderate',
               focus: 'cardio',
               description: 'Tiradas largas suaves. Construir resistencia.'
            },
            {
               phase_order: 2,
               phase_name: 'Velocidad y fuerza',
               modality: 'hybrid',
               weeks: 4,
               sessions_per_week: 4,
               intensity_target: 'intense',
               focus: 'cardio',
               description: 'Running + 1 día de fuerza accesoria piernas.'
            },
            {
               phase_order: 3,
               phase_name: 'Tapering',
               modality: 'running',
               weeks: 2,
               sessions_per_week: 3,
               intensity_target: 'moderate',
               focus: 'cardio',
               description: 'Bajar volumen, mantener intensidad. Llegar fresca/o.'
            }
         ]
      })
   }
]

export const getPresetById = (id: string): ProgramPreset | undefined =>
   PROGRAM_PRESETS.find((p) => p.id === id)

/* Labels visuales para modalidades. */
export const MODALITY_LABEL: Record<ItfModality, string> = {
   hiit: 'HIIT',
   gym: 'Gym (pesas)',
   calistenia: 'Calistenia',
   yoga: 'Yoga',
   barre: 'Barre',
   pilates: 'Pilates',
   crossfit: 'CrossFit',
   running: 'Running',
   cycling: 'Bici',
   swimming: 'Natación',
   sport: 'Deporte',
   hybrid: 'Mixto'
}

export const MODALITY_EMOJI: Record<ItfModality, string> = {
   hiit: '🔥',
   gym: '🏋️',
   calistenia: '🤸',
   yoga: '🧘',
   barre: '🩰',
   pilates: '🌀',
   crossfit: '🪨',
   running: '🏃',
   cycling: '🚴',
   swimming: '🏊',
   sport: '⚽',
   hybrid: '⚡'
}

export const FOCUS_LABEL: Record<ItfPhaseFocus, string> = {
   full_body: 'Cuerpo completo',
   upper: 'Tren superior',
   lower: 'Tren inferior',
   core: 'Core',
   cardio: 'Cardio'
}
