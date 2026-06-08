import type { ItfExercise, ItfUserContextForWorkout } from './types'
import { FOCUS_PATTERNS, type ItfSessionFocus } from './types'

/**
 * Filtra el catálogo de ejercicios según:
 *   1. fitness_level del usuario — absolute_beginner excluye `forbidden_absolute_beginner`.
 *   2. equipment del usuario — solo ejercicios cuyos equipos requeridos están disponibles.
 *   3. injured_zones — excluye cualquier ejercicio que afecte una zona lesionada.
 *   4. focus del día — solo patrones musculares relevantes.
 *
 * Reglas de Carlos (files/reglas-fitness.md):
 *   - Principiantes absolutos: solo los 6 patrones base + core + carry.
 *   - Sin equipo declarado: cualquiera con 'none' o 'bodyweight' en equipment.
 *   - Si el ejercicio requiere mancuernas y el usuario solo tiene bandas → out.
 */
interface PoolInput {
   catalog: ItfExercise[]
   ctx: ItfUserContextForWorkout
   focus: ItfSessionFocus
}

export const filterExercisePool = ({ catalog, ctx, focus }: PoolInput): ItfExercise[] => {
   const isAbsoluteBeginner = ctx.fitnessLevel === 'absolute_beginner'
   const allowedPatterns = new Set(FOCUS_PATTERNS[focus])
   const userEquipment = new Set([
      ...ctx.equipment.map((e) => e.toLowerCase()),
      'bodyweight',
      'none'
   ])
   const injured = new Set(ctx.injuredZones.map((z) => z.toLowerCase().trim()))

   return catalog.filter((ex) => {
      // 1 — focus
      if (!allowedPatterns.has(ex.pattern)) return false

      // 2 — prohibidos para principiantes absolutos
      if (isAbsoluteBeginner && ex.difficulty === 'forbidden_absolute_beginner') {
         return false
      }

      // 3 — dificultad razonable según nivel
      if (isAbsoluteBeginner && ex.difficulty === 'advanced') return false

      // 4 — equipment: ejercicio requiere al menos uno que el usuario tenga
      if (ex.equipmentRequired.length > 0) {
         const hasAny = ex.equipmentRequired.some((req) => userEquipment.has(req.toLowerCase()))
         if (!hasAny) return false
      }

      // 5 — lesiones: excluir si afecta una zona lesionada
      if (injured.size > 0) {
         const affects = ex.affectedZones.some((z) => injured.has(z.toLowerCase()))
         if (affects) return false
      }

      return true
   })
}

/**
 * Útil para el selector: agrupa el pool en compuestos y accesorios.
 */
export const partitionByCompoundType = (pool: ItfExercise[]) => ({
   compounds: pool.filter((p) => p.isCompound),
   accessories: pool.filter((p) => !p.isCompound)
})
