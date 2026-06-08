/**
 * Hidratación mínima diaria (mL) según Lucía:
 *   35 mL × kg peso corporal.
 *
 * Se redondea a múltiplos de 50 mL para que el usuario lo vea en
 * cifras "amigables" (2800, 2750…). Mínimo absoluto 1500 mL para evitar
 * recomendaciones absurdas en pesos muy bajos.
 */
export const calculateHydrationMl = (weightKg: number): number => {
   const raw = weightKg * 35
   const rounded = Math.round(raw / 50) * 50
   return Math.max(1500, rounded)
}
