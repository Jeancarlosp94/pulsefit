import type { ItfExercise } from './types'

/**
 * Catálogo inicial de ejercicios (Fase 6). Hasta que la Edge Function
 * consulte wger en tiempo real (futuro), este seed cubre los patrones
 * base validados por Carlos en files/reglas-fitness.md.
 */
export const SEED_EXERCISES: ItfExercise[] = [
   // === SQUAT ===
   {
      id: 'bw-squat',
      name: 'Sentadilla con peso corporal',
      pattern: 'squat',
      muscleGroups: ['cuádriceps', 'glúteos'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: ['rodilla'],
      description: 'Pies al ancho de hombros, baja hasta paralelo manteniendo pecho arriba.',
      formTips: ['Pecho arriba', 'Talones apoyados', 'Rodilla en línea con el pie'],
      alternatives: ['goblet-squat'],
      isCompound: true
   },
   {
      id: 'goblet-squat',
      name: 'Goblet squat con mancuerna',
      pattern: 'squat',
      muscleGroups: ['cuádriceps', 'glúteos', 'core'],
      equipmentRequired: ['dumbbells', 'kettlebell'],
      difficulty: 'beginner',
      affectedZones: ['rodilla'],
      description: 'Sostén una mancuerna a la altura del pecho y baja en cuclillas.',
      formTips: ['Codos por dentro de las rodillas en el bottom', 'Pecho arriba'],
      alternatives: ['bw-squat'],
      isCompound: true
   },
   {
      id: 'back-squat-barbell',
      name: 'Sentadilla trasera con barra',
      pattern: 'squat',
      muscleGroups: ['cuádriceps', 'glúteos', 'erectores'],
      equipmentRequired: ['gym_full'],
      difficulty: 'forbidden_absolute_beginner',
      affectedZones: ['rodilla', 'lumbar'],
      description: 'Barra apoyada en la parte alta de la espalda, baja en cuclillas.',
      formTips: ['Barra firme', 'Núcleo apretado', 'Caderas atrás primero'],
      alternatives: ['goblet-squat'],
      isCompound: true
   },

   // === HINGE ===
   {
      id: 'glute-bridge',
      name: 'Puente de glúteos',
      pattern: 'hinge',
      muscleGroups: ['glúteos', 'isquios'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: ['lumbar'],
      description: 'Acostado boca arriba, levanta caderas apretando glúteos.',
      formTips: ['Aprieta glúteos arriba', 'Costillas abajo', 'Pausa 1 segundo'],
      alternatives: ['rdl-db'],
      isCompound: true
   },
   {
      id: 'rdl-db',
      name: 'Peso muerto rumano con mancuernas',
      pattern: 'hinge',
      muscleGroups: ['isquios', 'glúteos', 'erectores'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'beginner',
      affectedZones: ['lumbar'],
      description:
         'Bisagra desde la cadera con espalda neutra, las mancuernas bajan al ras de las piernas.',
      formTips: ['Bisagra desde cadera', 'Espalda neutra', 'Glúteos atrás'],
      alternatives: ['glute-bridge'],
      isCompound: true
   },
   {
      id: 'deadlift-barbell',
      name: 'Peso muerto convencional con barra',
      pattern: 'hinge',
      muscleGroups: ['isquios', 'glúteos', 'erectores', 'dorsal'],
      equipmentRequired: ['gym_full'],
      difficulty: 'forbidden_absolute_beginner',
      affectedZones: ['lumbar'],
      description:
         'Levanta la barra del suelo con espalda neutra, caderas y rodillas extienden juntas.',
      formTips: ['Barra cerca del cuerpo', 'Espalda neutra siempre', 'Empuja el suelo'],
      alternatives: ['rdl-db'],
      isCompound: true
   },

   // === PUSH HORIZONTAL ===
   {
      id: 'pushup',
      name: 'Flexiones de pecho',
      pattern: 'push_horizontal',
      muscleGroups: ['pecho', 'tríceps', 'hombro anterior'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: ['hombro', 'muñeca'],
      description: 'Plancha de manos, baja el pecho al suelo y empuja.',
      formTips: ['Cuerpo en línea', 'Codos a 45°', 'Núcleo apretado'],
      alternatives: ['db-floor-press'],
      isCompound: true
   },
   {
      id: 'db-floor-press',
      name: 'Press de pecho en suelo con mancuernas',
      pattern: 'push_horizontal',
      muscleGroups: ['pecho', 'tríceps'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'beginner',
      affectedZones: ['hombro'],
      description: 'Acostado en el suelo, presiona las mancuernas hacia arriba.',
      formTips: ['Codos no tocan el suelo cayendo', 'Empuje vertical'],
      alternatives: ['pushup'],
      isCompound: true
   },
   {
      id: 'bench-press-barbell',
      name: 'Press de banca con barra',
      pattern: 'push_horizontal',
      muscleGroups: ['pecho', 'tríceps', 'hombro anterior'],
      equipmentRequired: ['gym_full', 'bench'],
      difficulty: 'forbidden_absolute_beginner',
      affectedZones: ['hombro'],
      description: 'Acostado en banco, baja la barra al pecho y empuja.',
      formTips: ['Escápulas retraídas', 'Barra al esternón'],
      alternatives: ['db-floor-press'],
      isCompound: true
   },

   // === PUSH VERTICAL ===
   {
      id: 'db-shoulder-press',
      name: 'Press de hombros sentado con mancuernas',
      pattern: 'push_vertical',
      muscleGroups: ['hombros', 'tríceps'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'beginner',
      affectedZones: ['hombro'],
      description: 'Sentado con espalda apoyada, presiona las mancuernas arriba.',
      formTips: ['Codos delante', 'Sin arquear lumbar'],
      alternatives: ['band-shoulder-press'],
      isCompound: true
   },
   {
      id: 'band-shoulder-press',
      name: 'Press de hombros con banda',
      pattern: 'push_vertical',
      muscleGroups: ['hombros', 'tríceps'],
      equipmentRequired: ['bands'],
      difficulty: 'beginner',
      affectedZones: ['hombro'],
      description: 'Bandas bajo los pies, presiona hacia arriba manteniendo tensión.',
      formTips: ['Codos delante', 'Subida en línea recta'],
      alternatives: ['db-shoulder-press'],
      isCompound: true
   },

   // === PULL HORIZONTAL ===
   {
      id: 'db-row',
      name: 'Remo con mancuerna a una mano',
      pattern: 'pull_horizontal',
      muscleGroups: ['dorsal', 'romboides', 'bíceps'],
      equipmentRequired: ['dumbbells', 'bench'],
      difficulty: 'beginner',
      affectedZones: ['lumbar'],
      description: 'Apoya rodilla y mano contraria en banco, jala la mancuerna a la cadera.',
      formTips: ['Codo cerca del cuerpo', 'Escápula al final'],
      alternatives: ['band-row'],
      isCompound: true
   },
   {
      id: 'band-row',
      name: 'Remo con banda',
      pattern: 'pull_horizontal',
      muscleGroups: ['dorsal', 'romboides', 'bíceps'],
      equipmentRequired: ['bands'],
      difficulty: 'beginner',
      affectedZones: ['hombro'],
      description: 'Bandas ancladas al frente, jala hacia el abdomen apretando escápulas.',
      formTips: ['Codos pegados', 'Pecho arriba'],
      alternatives: ['db-row'],
      isCompound: true
   },

   // === PULL VERTICAL ===
   {
      id: 'assisted-pullup',
      name: 'Dominadas asistidas con banda',
      pattern: 'pull_vertical',
      muscleGroups: ['dorsal', 'bíceps'],
      equipmentRequired: ['pullup_bar', 'bands'],
      difficulty: 'intermediate',
      affectedZones: ['hombro', 'codo'],
      description: 'Banda en la barra y los pies, jala el cuerpo arriba.',
      formTips: ['Lleva el pecho a la barra', 'No te encojas'],
      alternatives: ['band-pulldown'],
      isCompound: true
   },
   {
      id: 'band-pulldown',
      name: 'Jalón con banda elástica',
      pattern: 'pull_vertical',
      muscleGroups: ['dorsal', 'bíceps'],
      equipmentRequired: ['bands'],
      difficulty: 'beginner',
      affectedZones: [],
      description: 'Banda anclada arriba, jala hacia el pecho.',
      formTips: ['Pecho arriba', 'Codo apunta abajo'],
      alternatives: ['assisted-pullup'],
      isCompound: true
   },

   // === LUNGE ===
   {
      id: 'reverse-lunge',
      name: 'Zancada inversa con peso corporal',
      pattern: 'lunge',
      muscleGroups: ['cuádriceps', 'glúteos'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: ['rodilla'],
      description: 'Da un paso atrás, baja la rodilla cerca del suelo y vuelve.',
      formTips: ['Tronco erguido', 'Paso firme'],
      alternatives: ['db-lunge'],
      isCompound: true
   },
   {
      id: 'db-lunge',
      name: 'Zancada con mancuernas',
      pattern: 'lunge',
      muscleGroups: ['cuádriceps', 'glúteos'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'intermediate',
      affectedZones: ['rodilla'],
      description: 'Mancuernas a los lados, zancada inversa o caminando.',
      formTips: ['Hombros sobre cadera', 'Paso amplio'],
      alternatives: ['reverse-lunge'],
      isCompound: true
   },

   // === CORE ===
   {
      id: 'plank',
      name: 'Plancha',
      pattern: 'core',
      muscleGroups: ['abdomen', 'core', 'glúteos'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: ['hombro', 'lumbar'],
      description: 'Apoyo en antebrazos y puntas de pies, cuerpo en línea recta.',
      formTips: ['Glúteos firmes', 'Núcleo apretado', 'Respiración tranquila'],
      alternatives: ['dead-bug'],
      isCompound: false
   },
   {
      id: 'dead-bug',
      name: 'Dead bug',
      pattern: 'core',
      muscleGroups: ['core', 'abdomen'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: [],
      description:
         'Acostado, mueve brazos y piernas alternados manteniendo lumbar pegada al suelo.',
      formTips: ['Lumbar pegada al suelo', 'Movimientos lentos'],
      alternatives: ['plank'],
      isCompound: false
   },
   {
      id: 'bird-dog',
      name: 'Bird-dog',
      pattern: 'core',
      muscleGroups: ['core', 'erectores', 'glúteos'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: [],
      description: 'En cuatro apoyos, extiende brazo y pierna opuestos.',
      formTips: ['Espalda plana', 'Sin rotación de cadera'],
      alternatives: ['plank'],
      isCompound: false
   },

   // === CARRY ===
   {
      id: 'farmer-walk',
      name: 'Caminata del granjero',
      pattern: 'carry',
      muscleGroups: ['core', 'antebrazos', 'trapecios'],
      equipmentRequired: ['dumbbells', 'kettlebell'],
      difficulty: 'beginner',
      affectedZones: [],
      description: 'Camina sosteniendo pesos a los lados, postura alta.',
      formTips: ['Hombros bajos', 'Pasos cortos'],
      alternatives: [],
      isCompound: false
   }
]
