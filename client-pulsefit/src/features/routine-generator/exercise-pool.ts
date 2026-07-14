import type { ItfExercise, ItfExerciseModality, ItfUserContextForWorkout } from './types'
import { FOCUS_PATTERNS, type ItfSessionFocus } from './types'
import { getSportTransfer } from './sport-transfer-map'

/* Sprint 11.11: modalidad default para ejercicios sin tag.
 * Los ejercicios "neutros" de gym/calistenia funcionan también en hybrid. */
const DEFAULT_MODALITIES: ItfExerciseModality[] = ['gym', 'calistenia', 'hybrid']

const exerciseMatchesModality = (exercise: ItfExercise, modality: ItfExerciseModality): boolean => {
   const supported = exercise.modalities ?? DEFAULT_MODALITIES
   return supported.includes(modality)
}

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

   const filtered = catalog.filter((ex) => {
      /* Sprint 11.11: filtro por modalidad (si la fase activa la define).
       * Si ctx.modality NO se especifica → comportamiento histórico (sin filtro).
       * Si se especifica → solo ejercicios compatibles con esa modalidad. */
      if (ctx.modality) {
         if (!exerciseMatchesModality(ex, ctx.modality)) return false
      } else {
         /* Sin modality declarada: excluir ejercicios EXCLUSIVOS de yoga/barre/
          * pilates para que el flujo histórico (gym/hybrid) no los traiga.
          * Un ejercicio exclusivo de yoga (solo modalities=['yoga']) no debería
          * aparecer en un workout default. */
         if (ex.modalities && !ex.modalities.some((m) => DEFAULT_MODALITIES.includes(m))) {
            return false
         }
      }

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

   /* Sprint 11.16: si el usuario tiene sportFocus, ordenamos el pool
    * poniendo primero los que transfieren a su deporte, luego los generales.
    * NO se excluyen los que no transfieren — se conservan para variedad. */
   if (ctx.sportFocus && ctx.sportFocus !== 'ninguno') {
      const sport = ctx.sportFocus
      return filtered.slice().sort((a, b) => {
         const aTransfers = getSportTransfer(a.id).includes(sport) ? 1 : 0
         const bTransfers = getSportTransfer(b.id).includes(sport) ? 1 : 0
         return bTransfers - aTransfers /* transfer=1 va primero */
      })
   }

   return filtered
}

/**
 * Útil para el selector: agrupa el pool en compuestos y accesorios.
 */
export const partitionByCompoundType = (pool: ItfExercise[]) => ({
   compounds: pool.filter((p) => p.isCompound),
   accessories: pool.filter((p) => !p.isCompound)
})
