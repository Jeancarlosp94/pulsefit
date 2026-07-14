/**
 * Sprint 11.16: presets de equipamiento por ubicación.
 *
 * En vez de forzar al usuario a marcar cada equipo individualmente
 * (fricción alta en onboarding), le damos 5 opciones típicas y él
 * elige "dónde entrena". La app deriva el set de equipos.
 *
 * Fuente: encuesta interna en LATAM, análisis de gimnasios promedio.
 */

export type ItfEquipmentLocation =
   | 'casa_minima'
   | 'casa_bandas'
   | 'casa_pesas'
   | 'gym_completo'
   | 'crossfit_box'

export interface ItfEquipmentPreset {
   id: ItfEquipmentLocation
   label: string
   description: string
   emoji: string
   /** Set de equipos que el motor considera "disponibles". */
   equipment: string[]
}

export const EQUIPMENT_PRESETS: ItfEquipmentPreset[] = [
   {
      id: 'casa_minima',
      label: 'Casa sin equipo',
      description: 'Solo peso corporal. Perfecto para arrancar.',
      emoji: '🏠',
      equipment: ['bodyweight', 'none']
   },
   {
      id: 'casa_bandas',
      label: 'Casa con bandas',
      description: 'Bandas elásticas + peso corporal.',
      emoji: '🎗️',
      equipment: ['bodyweight', 'none', 'bands']
   },
   {
      id: 'casa_pesas',
      label: 'Casa con pesas',
      description: 'Mancuernas y/o kettlebell en casa.',
      emoji: '💪',
      equipment: ['bodyweight', 'none', 'dumbbells', 'kettlebell', 'bands']
   },
   {
      id: 'gym_completo',
      label: 'Gimnasio completo',
      description: 'Máquinas, barras, pesas libres, pull-up bar.',
      emoji: '🏋️',
      equipment: [
         'bodyweight',
         'none',
         'dumbbells',
         'kettlebell',
         'bands',
         'gym_full',
         'pull_up_bar',
         'bench',
         'box'
      ]
   },
   {
      id: 'crossfit_box',
      label: 'CrossFit box',
      description: 'Todo lo del gym + box, cuerda, wall ball, plyo.',
      emoji: '🪨',
      equipment: [
         'bodyweight',
         'none',
         'dumbbells',
         'kettlebell',
         'bands',
         'gym_full',
         'pull_up_bar',
         'bench',
         'box',
         'plyo_box',
         'med_ball',
         'jump_rope'
      ]
   }
]

export const getEquipmentPresetById = (id: ItfEquipmentLocation): ItfEquipmentPreset | undefined =>
   EQUIPMENT_PRESETS.find((p) => p.id === id)

/**
 * Inverso: dado un array de equipos, adivina qué preset probable eligió el
 * usuario. Se usa para mostrar el preset actual en Perfil.
 * Retorna null si el set no coincide con ningún preset exacto o cercano.
 */
export const inferLocationPreset = (equipment: string[]): ItfEquipmentLocation | null => {
   const userSet = new Set(equipment.map((e) => e.toLowerCase()))
   /* Buscamos el preset con MÁS coincidencias (score = intersección). */
   let bestId: ItfEquipmentLocation | null = null
   let bestScore = -1
   for (const preset of EQUIPMENT_PRESETS) {
      let score = 0
      for (const item of preset.equipment) {
         if (userSet.has(item.toLowerCase())) score++
      }
      /* Penalización por tener equipos que el preset NO incluye. */
      for (const item of userSet) {
         if (!preset.equipment.map((e) => e.toLowerCase()).includes(item)) score -= 0.5
      }
      if (score > bestScore) {
         bestScore = score
         bestId = preset.id
      }
   }
   return bestScore > 0 ? bestId : null
}
