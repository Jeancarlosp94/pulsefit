import type { ItfActivityLevel, ItfGETParams } from './types'

/**
 * Factores de actividad estándar Harris-Benedict actualizados.
 * Referencias validadas por Lucía en files/formulas-nutricion.md.
 */
export const ACTIVITY_FACTORS: Record<ItfActivityLevel, number> = {
   sedentary: 1.2,
   light: 1.375,
   moderate: 1.55,
   active: 1.725,
   very_active: 1.9
}

/** Gasto Energético Total = TMB × factor de actividad. */
export const calculateGET = ({ tmb, activityLevel }: ItfGETParams): number => {
   return Math.round(tmb * ACTIVITY_FACTORS[activityLevel])
}
