import type { ItfTargetKcalParams } from './types'

/**
 * Calcula la meta calórica diaria a partir del GET y el objetivo.
 *
 *   lose         → déficit del 20% (rango 15-25%, elegimos punto medio seguro).
 *   gain         → superávit del 12% (rango 10-15%).
 *   maintain     → GET.
 *   feel_better  → GET (foco en calidad, no en déficit).
 */
export const calculateTargetKcal = ({ getKcal, goal }: ItfTargetKcalParams): number => {
   switch (goal) {
      case 'lose':
         return Math.round(getKcal * 0.8)
      case 'gain':
         return Math.round(getKcal * 1.12)
      case 'maintain':
      case 'feel_better':
         return Math.round(getKcal)
   }
}
