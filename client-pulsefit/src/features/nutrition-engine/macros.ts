import type { ItfGoal, ItfMacroDistribution, ItfMacroParams } from './types'

const PROTEIN_KCAL_PER_G = 4
const CARBS_KCAL_PER_G = 4
const FATS_KCAL_PER_G = 9

/**
 * Proteína por kg según objetivo (reglas de Lucía):
 *   lose         → 2.0 g/kg (preserva masa magra en déficit).
 *   gain         → 1.8 g/kg (soporta hipertrofia sin exceso).
 *   maintain     → 1.6 g/kg (entrenamiento + manutención).
 *   feel_better  → 1.2 g/kg (baseline sano sin entreno intenso).
 */
const PROTEIN_PER_KG: Record<ItfGoal, number> = {
   lose: 2.0,
   gain: 1.8,
   maintain: 1.6,
   feel_better: 1.2
}

/**
 * Distribución de macros sobre el target calórico.
 *
 *   Proteína: weightKg × factor por objetivo.
 *   Grasas:   máximo entre 0.8 g/kg y 25% de kcal totales (mín. saludable).
 *   Carbos:   resto (totalKcal - proteínaKcal - grasasKcal) / 4.
 *
 * Si por alguna razón (kcal muy bajos en feel_better con peso alto) los carbos
 * salen negativos, redondea a 0 y recalcula proteína para que cierre. Nunca
 * devuelve valores negativos.
 */
export const distributeMacros = ({
   totalKcal,
   weightKg,
   goal
}: ItfMacroParams): ItfMacroDistribution => {
   const proteinG = Math.round(weightKg * PROTEIN_PER_KG[goal])
   const proteinKcal = proteinG * PROTEIN_KCAL_PER_G

   const fatsKcalMinByWeight = weightKg * 0.8 * FATS_KCAL_PER_G
   const fatsKcalMinByPct = totalKcal * 0.25
   const fatsKcal = Math.max(fatsKcalMinByWeight, fatsKcalMinByPct)
   const fatsG = Math.round(fatsKcal / FATS_KCAL_PER_G)

   const carbsKcalRaw = totalKcal - proteinKcal - fatsKcal
   const carbsG = Math.max(0, Math.round(carbsKcalRaw / CARBS_KCAL_PER_G))

   return {
      proteinG,
      carbsG,
      fatsG,
      totalKcal: Math.round(totalKcal)
   }
}
