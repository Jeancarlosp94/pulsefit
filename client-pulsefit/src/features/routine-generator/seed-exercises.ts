import type { ItfExercise } from './types'

/**
 * Catálogo de ejercicios firmado por Carlos (NSCA-CPT).
 *
 * Cambios Sprint 2.2:
 *   - +12 ejercicios (face-pull, split squat búlgaro, swing kettlebell,
 *     hip thrust, press unilateral, band pull-apart, calf raise,
 *     curl bíceps, extensión tríceps, side plank, dead bug, bird dog).
 *   - Todos los ejercicios incluyen videoUrl curada (YouTube) para que el
 *     usuario sin entrenador real pueda ver técnica correcta antes.
 *   - Canales preferidos: Squat University, Jeff Nippard, FitnessFAQs,
 *     AthleanX, Mind Pump.
 *
 * Total: 33 ejercicios cubriendo 8 patrones de movimiento.
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
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ'
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
      alternatives: ['bw-squat', 'bulgarian-split-squat'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4'
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
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8'
   },
   {
      id: 'bulgarian-split-squat',
      name: 'Sentadilla búlgara',
      pattern: 'squat',
      muscleGroups: ['cuádriceps', 'glúteos', 'core'],
      equipmentRequired: ['none', 'bodyweight', 'dumbbells'],
      difficulty: 'intermediate',
      affectedZones: ['rodilla'],
      description: 'Pie trasero elevado en banco, baja la rodilla de adelante apuntando al piso.',
      formTips: ['Torso erguido', 'Rodilla trasera baja', 'Empuje con el talón delantero'],
      alternatives: ['lunge-bw', 'goblet-squat'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE'
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
      alternatives: ['rdl-db', 'hip-thrust-db'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=wPM8icPu6H8'
   },
   {
      id: 'rdl-db',
      name: 'Peso muerto rumano con mancuernas',
      pattern: 'hinge',
      muscleGroups: ['isquios', 'glúteos', 'lumbar'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'beginner',
      affectedZones: ['lumbar'],
      description: 'Bisagra desde la cadera con espalda neutra, mancuernas pegadas al cuerpo.',
      formTips: ['Espalda neutra', 'Caderas atrás', 'Sentir estiramiento isquios'],
      alternatives: ['glute-bridge', 'kb-swing'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=ub-blPDLEbA'
   },
   {
      id: 'deadlift-barbell',
      name: 'Peso muerto convencional',
      pattern: 'hinge',
      muscleGroups: ['isquios', 'glúteos', 'erectores', 'trapecios'],
      equipmentRequired: ['gym_full'],
      difficulty: 'forbidden_absolute_beginner',
      affectedZones: ['lumbar'],
      description: 'Levanta la barra del suelo con espalda neutra empujando el piso.',
      formTips: ['Barra pegada al cuerpo', 'Bloqueo cadera arriba', 'Sin tirar con espalda'],
      alternatives: ['rdl-db'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q'
   },
   {
      id: 'hip-thrust-db',
      name: 'Hip thrust con mancuerna',
      pattern: 'hinge',
      muscleGroups: ['glúteos', 'isquios'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'beginner',
      affectedZones: [],
      description: 'Espalda alta en banco, mancuerna en cadera, empuja caderas arriba.',
      formTips: ['Barbilla al pecho', 'Aprieta glúteos arriba 1s', 'Costillas abajo'],
      alternatives: ['glute-bridge', 'rdl-db'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=LM8XHLYJoYs'
   },
   {
      id: 'kb-swing',
      name: 'Kettlebell swing ruso',
      pattern: 'hinge',
      muscleGroups: ['glúteos', 'isquios', 'core'],
      equipmentRequired: ['kettlebell'],
      difficulty: 'intermediate',
      affectedZones: ['lumbar', 'hombro'],
      description: 'Bisagra dinámica que proyecta la kettlebell a la altura del pecho.',
      formTips: ['Empuje viene de cadera, no brazos', 'Pies firmes', 'Aprieta glúteos arriba'],
      alternatives: ['rdl-db', 'hip-thrust-db'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=Yt9c9zX9JEY'
   },

   // === PUSH HORIZONTAL ===
   {
      id: 'pushup-bw',
      name: 'Lagartijas / flexiones',
      pattern: 'push_horizontal',
      muscleGroups: ['pectoral', 'tríceps', 'hombro frontal'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: ['hombro', 'muñeca'],
      description: 'Cuerpo recto, baja el pecho cerca del piso.',
      formTips: ['Codos a 45°', 'Aprieta abdomen', 'Cuerpo plancha'],
      alternatives: ['pushup-incline', 'db-bench-press'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4'
   },
   {
      id: 'pushup-incline',
      name: 'Flexiones inclinadas en banco/mesa',
      pattern: 'push_horizontal',
      muscleGroups: ['pectoral', 'tríceps'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: ['hombro'],
      description: 'Manos apoyadas en superficie elevada, baja el pecho.',
      formTips: ['Más alto = más fácil', 'Cuerpo recto', 'Codos a 45°'],
      alternatives: ['pushup-bw'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=4dF1DOWzf20'
   },
   {
      id: 'db-bench-press',
      name: 'Press de pecho con mancuernas',
      pattern: 'push_horizontal',
      muscleGroups: ['pectoral', 'tríceps', 'hombro frontal'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'beginner',
      affectedZones: ['hombro'],
      description: 'Acostado en banco, baja mancuernas a los lados del pecho.',
      formTips: ['Codos a 45°', 'No bajes más allá del rango cómodo', 'Aprieta pecho arriba'],
      alternatives: ['pushup-bw'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=VmB1G1K7v94'
   },
   {
      id: 'bench-press-barbell',
      name: 'Press de banca con barra',
      pattern: 'push_horizontal',
      muscleGroups: ['pectoral', 'tríceps', 'hombro frontal'],
      equipmentRequired: ['gym_full'],
      difficulty: 'forbidden_absolute_beginner',
      affectedZones: ['hombro'],
      description: 'Banca plana, baja la barra al pecho controlado.',
      formTips: ['Apoyo escapular firme', 'Codos a 45°', 'Pies firmes'],
      alternatives: ['db-bench-press'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
   },

   // === PUSH VERTICAL ===
   {
      id: 'db-shoulder-press',
      name: 'Press de hombros con mancuernas',
      pattern: 'push_vertical',
      muscleGroups: ['hombro', 'tríceps'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'beginner',
      affectedZones: ['hombro'],
      description: 'Sentado o de pie, presiona mancuernas hacia arriba.',
      formTips: ['Núcleo apretado', 'No arquees lumbar', 'Codo bajo la muñeca'],
      alternatives: ['pike-pushup'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog'
   },
   {
      id: 'pike-pushup',
      name: 'Flexión en pico (pike push-up)',
      pattern: 'push_vertical',
      muscleGroups: ['hombro', 'tríceps'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'intermediate',
      affectedZones: ['hombro', 'muñeca'],
      description: 'Cuerpo en V invertida, baja la cabeza hacia el piso.',
      formTips: ['Caderas altas', 'Pierna recta', 'Mira los pies'],
      alternatives: ['db-shoulder-press'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=tk5gn0bjcxQ'
   },

   // === PULL HORIZONTAL ===
   {
      id: 'db-row',
      name: 'Remo con mancuerna a una mano',
      pattern: 'pull_horizontal',
      muscleGroups: ['dorsal', 'romboides', 'bíceps'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'beginner',
      affectedZones: ['lumbar', 'hombro'],
      description: 'Apoyado en banco, tira la mancuerna hacia la cadera.',
      formTips: ['Codo cercano al cuerpo', 'Aprieta omóplato', 'Espalda neutra'],
      alternatives: ['inverted-row'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=pYcpY20QaE8'
   },
   {
      id: 'inverted-row',
      name: 'Remo invertido (TRX o mesa baja)',
      pattern: 'pull_horizontal',
      muscleGroups: ['dorsal', 'romboides', 'bíceps'],
      equipmentRequired: ['trx', 'gym_full'],
      difficulty: 'beginner',
      affectedZones: ['hombro'],
      description: 'Suspendido bajo barra, tira el pecho hacia ella.',
      formTips: ['Cuerpo recto', 'Aprieta omóplatos', 'Más horizontal = más difícil'],
      alternatives: ['db-row'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=hXTc1mDnZCw'
   },
   {
      id: 'face-pull',
      name: 'Face-pull (banda o polea)',
      pattern: 'pull_horizontal',
      muscleGroups: ['hombro posterior', 'romboides', 'trapecios'],
      equipmentRequired: ['bands', 'gym_full'],
      difficulty: 'beginner',
      affectedZones: [],
      description: 'Tira la banda/polea hacia tu cara con codos altos.',
      formTips: [
         'Codos a la altura del hombro',
         'Aprieta omóplatos al final',
         'Sin tirar con bíceps'
      ],
      alternatives: ['band-pull-apart'],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk'
   },
   {
      id: 'band-pull-apart',
      name: 'Pull-apart con banda',
      pattern: 'pull_horizontal',
      muscleGroups: ['hombro posterior', 'romboides'],
      equipmentRequired: ['bands'],
      difficulty: 'beginner',
      affectedZones: [],
      description: 'Banda al frente, abre brazos en cruz manteniendo brazos rectos.',
      formTips: ['Brazos rectos', 'Aprieta omóplatos', 'Movimiento controlado'],
      alternatives: ['face-pull'],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=fldUH8nMnpY'
   },

   // === PULL VERTICAL ===
   {
      id: 'lat-pulldown',
      name: 'Jalón al pecho (polea)',
      pattern: 'pull_vertical',
      muscleGroups: ['dorsal', 'bíceps'],
      equipmentRequired: ['gym_full'],
      difficulty: 'beginner',
      affectedZones: ['hombro'],
      description: 'Tira la barra al pecho contrayendo dorsales.',
      formTips: ['Pecho arriba', 'Codos hacia atrás', 'Sin balancear'],
      alternatives: ['assisted-pullup'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc'
   },
   {
      id: 'assisted-pullup',
      name: 'Dominada asistida con banda',
      pattern: 'pull_vertical',
      muscleGroups: ['dorsal', 'bíceps', 'core'],
      equipmentRequired: ['bands', 'gym_full', 'trx'],
      difficulty: 'intermediate',
      affectedZones: ['hombro'],
      description: 'Banda apoyando pies o rodilla, sube hasta superar la barra con el mentón.',
      formTips: ['Inicia con omóplatos abajo', 'Codos cercanos', 'Sin balancear'],
      alternatives: ['lat-pulldown'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g'
   },

   // === LUNGE ===
   {
      id: 'lunge-bw',
      name: 'Zancadas con peso corporal',
      pattern: 'lunge',
      muscleGroups: ['cuádriceps', 'glúteos'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: ['rodilla'],
      description: 'Da un paso al frente y baja la rodilla trasera.',
      formTips: ['Torso erguido', 'Rodilla en línea con tobillo', 'Empuje con talón'],
      alternatives: ['walking-lunge-db'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs'
   },
   {
      id: 'walking-lunge-db',
      name: 'Zancadas caminando con mancuernas',
      pattern: 'lunge',
      muscleGroups: ['cuádriceps', 'glúteos', 'core'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'beginner',
      affectedZones: ['rodilla'],
      description: 'Camina dando zancadas largas alternando piernas.',
      formTips: ['Pasos largos', 'Pecho arriba', 'Sin colapsar rodilla'],
      alternatives: ['lunge-bw', 'bulgarian-split-squat'],
      isCompound: true,
      videoUrl: 'https://www.youtube.com/watch?v=eFWCn5iEbTU'
   },

   // === CORE ===
   {
      id: 'plank',
      name: 'Plancha',
      pattern: 'core',
      muscleGroups: ['core', 'hombro'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: [],
      description: 'Apoyo en antebrazos, cuerpo recto desde cabeza a talones.',
      formTips: ['Cadera neutra', 'Aprieta glúteos', 'Mirada al piso'],
      alternatives: ['side-plank', 'dead-bug'],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c'
   },
   {
      id: 'dead-bug',
      name: 'Dead bug',
      pattern: 'core',
      muscleGroups: ['core', 'transverso'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: ['lumbar'],
      description: 'Acostado, baja brazo y pierna opuestos sin arquear lumbar.',
      formTips: ['Lumbar pegado al piso', 'Movimiento lento', 'Respiración controlada'],
      alternatives: ['plank', 'bird-dog'],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=4XLEnwUr1d8'
   },
   {
      id: 'bird-dog',
      name: 'Bird dog',
      pattern: 'core',
      muscleGroups: ['core', 'glúteos', 'erectores'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: [],
      description: 'En cuatro, extiende brazo y pierna opuestos sin rotar cadera.',
      formTips: ['Cadera estable', 'Mantén 2s arriba', 'Sin colapso lumbar'],
      alternatives: ['dead-bug', 'plank'],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=wiFNA3sqjCA'
   },
   {
      id: 'side-plank',
      name: 'Plancha lateral',
      pattern: 'core',
      muscleGroups: ['oblicuos', 'core'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: ['hombro'],
      description: 'Apoyado en un antebrazo, cuerpo recto desde hombro a tobillo.',
      formTips: ['Cadera elevada', 'Cuerpo en línea', 'Mira al frente'],
      alternatives: ['plank'],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=K2VljzCC16g'
   },
   {
      id: 'mountain-climber',
      name: 'Escaladores',
      pattern: 'core',
      muscleGroups: ['core', 'cuádriceps', 'cardio'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'beginner',
      affectedZones: ['muñeca'],
      description: 'En plancha, alterna llevando rodillas al pecho.',
      formTips: ['Cadera estable', 'Ritmo constante', 'Sin levantar caderas'],
      alternatives: ['plank'],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=cnyTQDSE884'
   },
   {
      id: 'hollow-hold',
      name: 'Hollow hold',
      pattern: 'core',
      muscleGroups: ['core', 'transverso'],
      equipmentRequired: ['none', 'bodyweight'],
      difficulty: 'intermediate',
      affectedZones: ['lumbar'],
      description: 'Acostado boca arriba, eleva piernas y hombros formando "U".',
      formTips: ['Lumbar pegado al piso', 'Respiración por nariz', 'Sin arquear'],
      alternatives: ['dead-bug', 'plank'],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=LlDNef_Ztsc'
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
      formTips: ['Hombros bajos', 'Pasos cortos', 'Pecho arriba'],
      alternatives: [],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=Fkzk_RqlYig'
   },

   // === ACCESORIOS / AISLAMIENTO === (Carlos pidió face-pulls + curl + calf)
   {
      id: 'db-bicep-curl',
      name: 'Curl de bíceps con mancuernas',
      pattern: 'pull_horizontal',
      muscleGroups: ['bíceps', 'antebrazos'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'beginner',
      affectedZones: [],
      description: 'De pie, sube las mancuernas hacia los hombros doblando codos.',
      formTips: ['Codos fijos al lado', 'Sin balancear', 'Aprieta arriba'],
      alternatives: [],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo'
   },
   {
      id: 'db-tricep-extension',
      name: 'Extensión de tríceps por encima de la cabeza',
      pattern: 'push_vertical',
      muscleGroups: ['tríceps'],
      equipmentRequired: ['dumbbells'],
      difficulty: 'beginner',
      affectedZones: ['hombro'],
      description: 'Mancuerna por encima de la cabeza, baja detrás doblando codos.',
      formTips: ['Codos cerca de orejas', 'Baja controlado', 'Sin arquear lumbar'],
      alternatives: ['pushup-bw'],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q'
   },
   {
      id: 'calf-raise',
      name: 'Elevación de pantorrillas',
      pattern: 'core' /* usamos 'core' como fallback ya que no tenemos pattern 'isolation'. */,
      muscleGroups: ['pantorrillas'],
      equipmentRequired: ['none', 'bodyweight', 'dumbbells'],
      difficulty: 'beginner',
      affectedZones: [],
      description: 'De pie, sube en puntas de pie y baja controlado.',
      formTips: ['Rango completo', 'Pausa 1s arriba', 'Sin rebotar'],
      alternatives: [],
      isCompound: false,
      videoUrl: 'https://www.youtube.com/watch?v=YMmgqO8Jo-k'
   }
]
