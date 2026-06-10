import { SEED_EXERCISES } from './seed-exercises'

/**
 * Busca el videoUrl de un ejercicio por nombre (case-insensitive, fuzzy
 * por sustring). Útil cuando la Edge Function devuelve el nombre del
 * ejercicio pero no el videoUrl (porque el seed Deno tiene IDs distintos).
 *
 * Estrategia:
 *   1. Match exacto por nombre normalizado (lowercase, sin acentos).
 *   2. Match parcial — buscar el seed cuyo nombre contiene o está
 *      contenido en el query.
 *   3. Si nada matchea, devuelve undefined → la UI no muestra el botón.
 */
const normalize = (s: string): string =>
   s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()

export const findVideoUrlForExercise = (exerciseName: string): string | undefined => {
   const target = normalize(exerciseName)
   if (!target) return undefined

   /* 1) Exacto */
   const exact = SEED_EXERCISES.find((e) => normalize(e.name) === target)
   if (exact?.videoUrl) return exact.videoUrl

   /* 2) Parcial: el seed contiene el query (orden corto-a-largo para
    *    priorizar matches específicos sobre genéricos). */
   const candidates = SEED_EXERCISES.filter(
      (e) => normalize(e.name).includes(target) || target.includes(normalize(e.name))
   ).sort((a, b) => a.name.length - b.name.length)

   return candidates.find((c) => c.videoUrl)?.videoUrl
}
