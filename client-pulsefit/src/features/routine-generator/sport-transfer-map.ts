import type { ItfSportFocus } from './types'

/**
 * Sprint 11.16: mapping de ejercicio → deportes para los que transfiere bien.
 *
 * Firmado por Carlos (entrenador NSCA-CPT) usando "NSCA Essentials of
 * Strength & Conditioning" 4ª ed., capítulos de deporte específico.
 *
 * Filosofía:
 *   - Solo listamos ejercicios con evidencia clara de transferencia.
 *   - Un ejercicio SIN entrada aquí se considera "general" (no sesga hacia
 *     ningún deporte, ni tampoco lo excluye).
 *   - El motor USA esto para PRIORIZAR (poner primero en el pool), NO para
 *     excluir. Si el usuario tiene sportFocus='futbol', se ordena el pool
 *     por transferencia pero se mantienen los generales al final para
 *     variedad y no repetir siempre las mismas cinco cosas.
 */
export const SPORT_TRANSFER_MAP: Record<string, ItfSportFocus[]> = {
   /* Squat pattern — piernas explosivas. */
   'bw-squat': ['basketball', 'volley', 'ciclismo'],
   'goblet-squat': ['basketball', 'volley', 'ciclismo'],
   'bulgarian-split-squat': [
      'futbol',
      'basketball',
      'volley',
      'padel',
      'tenis',
      'running',
      'ciclismo'
   ],

   /* Hinge — cadena posterior, isquios. */
   'glute-bridge': ['running', 'ciclismo', 'futbol'],
   'rdl-db': ['futbol', 'running', 'ciclismo', 'natacion', 'boxeo'],
   'deadlift-barbell': ['crossfit'],
   'hip-thrust-db': ['futbol', 'basketball', 'volley', 'running', 'ciclismo', 'boxeo'],
   'kb-swing': ['futbol', 'basketball', 'volley', 'boxeo', 'natacion', 'crossfit'],

   /* Lunge — unilateral, cambio de dirección. */
   'lunge-bw': ['futbol', 'padel', 'tenis', 'running'],
   'walking-lunge-db': ['futbol', 'running', 'padel', 'tenis', 'ciclismo'],

   /* Push — hombros/pecho. */
   'pushup-bw': ['boxeo', 'natacion', 'volley', 'tenis'],
   'pushup-incline': ['boxeo', 'natacion'],
   'db-bench-press': ['boxeo', 'natacion'],
   'bench-press-barbell': ['crossfit'],
   'db-shoulder-press': ['volley', 'tenis', 'boxeo', 'natacion'],
   'pike-pushup': ['volley', 'natacion'],

   /* Pull — dorsal, cadena posterior superior. */
   'db-row': ['padel', 'tenis', 'natacion', 'crossfit'],
   'inverted-row': ['natacion', 'padel'],
   'face-pull': ['volley', 'tenis', 'padel', 'natacion', 'boxeo'],
   'band-pull-apart': ['volley', 'tenis', 'padel', 'natacion', 'boxeo'],
   'lat-pulldown': ['natacion'],
   'assisted-pullup': ['natacion', 'crossfit'],

   /* Core — estabilización y rotación. */
   plank: [
      'futbol',
      'basketball',
      'volley',
      'padel',
      'tenis',
      'boxeo',
      'running',
      'ciclismo',
      'natacion'
   ],
   'side-plank': [
      'padel',
      'tenis',
      'boxeo',
      'futbol',
      'basketball',
      'volley',
      'running',
      'ciclismo'
   ],
   'dead-bug': ['padel', 'tenis', 'running', 'ciclismo', 'natacion'],
   'bird-dog': ['running', 'ciclismo', 'natacion'],
   'hollow-hold': ['volley', 'boxeo', 'padel', 'tenis', 'natacion'],
   'mountain-climber': ['futbol', 'basketball', 'tenis', 'boxeo'],

   /* HIIT — cardio + potencia. */
   'hiit-jump-squat': ['futbol', 'basketball', 'volley'],
   'hiit-high-knees': ['futbol', 'boxeo'],
   'hiit-burpee': ['crossfit', 'boxeo'],
   'hiit-mountain-climber': ['futbol', 'boxeo', 'padel', 'tenis'],

   /* Accesorios. */
   'calf-raise': ['running', 'ciclismo', 'volley', 'basketball'],
   'farmer-walk': ['crossfit', 'boxeo'],

   /* CrossFit-específicos. */
   'crossfit-thruster': ['crossfit'],
   'crossfit-wall-ball': ['crossfit'],
   'crossfit-box-jump': ['basketball', 'volley', 'crossfit', 'futbol'],
   'crossfit-kb-snatch': ['crossfit'],
   'crossfit-double-under': ['boxeo', 'crossfit'],
   'crossfit-toes-to-bar': ['crossfit']
}

/** Retorna los deportes para los que el ejercicio transfiere. Vacío si no está listado. */
export const getSportTransfer = (exerciseId: string): ItfSportFocus[] =>
   SPORT_TRANSFER_MAP[exerciseId] ?? []

export const SPORT_FOCUS_LABEL: Record<ItfSportFocus, string> = {
   futbol: 'Fútbol',
   basketball: 'Básquet',
   volley: 'Vóley',
   padel: 'Pádel',
   tenis: 'Tenis',
   boxeo: 'Boxeo',
   running: 'Running',
   ciclismo: 'Ciclismo',
   natacion: 'Natación',
   crossfit: 'CrossFit',
   ninguno: 'Ninguno en particular'
}

export const SPORT_FOCUS_EMOJI: Record<ItfSportFocus, string> = {
   futbol: '⚽',
   basketball: '🏀',
   volley: '🏐',
   padel: '🎾',
   tenis: '🎾',
   boxeo: '🥊',
   running: '🏃',
   ciclismo: '🚴',
   natacion: '🏊',
   crossfit: '🪨',
   ninguno: '🌱'
}
