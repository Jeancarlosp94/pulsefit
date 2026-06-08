import type { ItfExercise } from './types'
import { partitionByCompoundType } from './exercise-pool'
import { pickProgramTemplate } from './set-rep-calculator'

interface SelectorInput {
   pool: ItfExercise[]
   sessionMinutes: number
   /** seed para reproducibilidad en tests. */
   seed?: number
}

/**
 * Selector determinístico de ejercicios. Aplica la plantilla del tiempo y elige:
 *   - N compuestos (con prioridad a los del pool en orden de aparición).
 *   - M accesorios.
 *   - K core.
 *
 * Si el pool no tiene suficientes ejercicios de una categoría, completa con lo
 * que haya. Devuelve null si el pool está totalmente vacío.
 */
export const selectExercises = ({
   pool,
   sessionMinutes,
   seed = 0
}: SelectorInput): ItfExercise[] | null => {
   if (pool.length === 0) return null

   const { compounds, accessories } = partitionByCompoundType(pool)
   const cores = pool.filter((p) => p.pattern === 'core')
   const tpl = pickProgramTemplate(sessionMinutes)

   /* Rotación determinística usando seed para diversidad entre días. */
   const rotated = <T>(arr: T[], n: number): T[] => {
      if (arr.length === 0) return arr
      const offset = Math.abs(n) % arr.length
      return [...arr.slice(offset), ...arr.slice(0, offset)]
   }

   const pickedCompounds = rotated(compounds, seed).slice(0, tpl.compounds)
   const pickedAccessories = rotated(
      accessories.filter((a) => a.pattern !== 'core'),
      seed + 1
   ).slice(0, tpl.accessories)
   const pickedCore = rotated(cores, seed + 2).slice(0, tpl.core)

   const combined = [...pickedCompounds, ...pickedAccessories, ...pickedCore]
   if (combined.length === 0) return null

   /* Si quedaron menos del template por escasez del pool, devolvemos lo que haya. */
   return combined
}
