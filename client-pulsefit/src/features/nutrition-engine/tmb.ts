import type { ItfTMBParams } from './types'

/**
 * Tasa Metabólica Basal — Fórmula Mifflin-St Jeor (1990, vigente, validada por Lucía).
 *
 *   Hombres: 10·peso(kg) + 6.25·altura(cm) - 5·edad + 5
 *   Mujeres: 10·peso(kg) + 6.25·altura(cm) - 5·edad - 161
 *
 * Para `prefer_not_to_say` usamos el promedio (±78 kcal del base).
 */
export const calculateTMB = ({ weightKg, heightCm, age, sex }: ItfTMBParams): number => {
   const base = 10 * weightKg + 6.25 * heightCm - 5 * age
   if (sex === 'male') return Math.round(base + 5)
   if (sex === 'female') return Math.round(base - 161)
   return Math.round(base - 78)
}
