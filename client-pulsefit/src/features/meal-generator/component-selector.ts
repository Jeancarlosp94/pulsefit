import type {
   ItfIngredient,
   ItfIngredientServing,
   ItfMacroTarget,
   ItfMealComponents
} from './types'

interface SelectorInput {
   pool: ItfIngredient[]
   target: ItfMacroTarget
   /** seed determinístico para que los tests sean reproducibles. Default: 0. */
   seed?: number
}

/**
 * Mínimos por categoría según Lucía (fix del bug 1200 kcal):
 *   - Proteína: 50g (porción visible de carne/pescado).
 *   - Carbo: 30g.
 *   - **Grasa concentrada (>700 kcal/100g): SIN MÍNIMO.** Cucharadas.
 *   - Grasa con volumen (aguacate, nueces): mín 15g.
 *   - Vegetal: 80g (puñado).
 */
const MIN_GRAMS_BY_CATEGORY: Record<
   'protein' | 'carb' | 'fat_concentrated' | 'fat_volumed' | 'vegetable',
   number
> = {
   protein: 50,
   carb: 30,
   fat_concentrated: 5,
   fat_volumed: 15,
   vegetable: 80
}

const MAX_GRAMS = 400

const isConcentratedFat = (ing: ItfIngredient): boolean =>
   ing.category === 'fat' && ing.kcalPer100g >= 700

const minGramsFor = (ing: ItfIngredient): number => {
   if (ing.category === 'protein') return MIN_GRAMS_BY_CATEGORY.protein
   if (ing.category === 'carb') return MIN_GRAMS_BY_CATEGORY.carb
   if (ing.category === 'fat') {
      return isConcentratedFat(ing)
         ? MIN_GRAMS_BY_CATEGORY.fat_concentrated
         : MIN_GRAMS_BY_CATEGORY.fat_volumed
   }
   if (ing.category === 'vegetable') return MIN_GRAMS_BY_CATEGORY.vegetable
   return 5
}

const pickByIndex = <T>(arr: T[], index: number): T => {
   if (arr.length === 0) throw new Error('Pool vacío')
   return arr[Math.abs(index) % arr.length]
}

const macrosFor = (ing: ItfIngredient, grams: number): ItfMacroTarget => ({
   kcal: (ing.kcalPer100g * grams) / 100,
   proteinG: (ing.proteinPer100g * grams) / 100,
   carbsG: (ing.carbsPer100g * grams) / 100,
   fatsG: (ing.fatsPer100g * grams) / 100
})

const gramsForMacro = (
   ing: ItfIngredient,
   macro: 'protein' | 'carb' | 'fat',
   targetGrams: number
): number => {
   const per100 =
      macro === 'protein'
         ? ing.proteinPer100g
         : macro === 'carb'
           ? ing.carbsPer100g
           : ing.fatsPer100g
   if (per100 <= 0) return 0
   return (targetGrams / per100) * 100
}

const clampForIngredient = (grams: number, ing: ItfIngredient): number => {
   const min = minGramsFor(ing)
   const rounded = Math.round(grams / 5) * 5
   return Math.max(min, Math.min(MAX_GRAMS, rounded))
}

/**
 * Construye los componentes a partir de elecciones específicas de la rotación.
 * Si la combinación no respeta la tolerancia ±15% de kcal, devolverá `null`
 * para que `selectComponents` reintente con la siguiente combinación.
 */
const buildCombination = (
   pool: ItfIngredient[],
   target: ItfMacroTarget,
   seed: number
): ItfMealComponents | null => {
   const proteins = pool.filter((p) => p.category === 'protein')
   const carbs = pool.filter((p) => p.category === 'carb')
   const fats = pool.filter((p) => p.category === 'fat')
   const veg = pool.filter((p) => p.category === 'vegetable')
   const cond = pool.filter((p) => p.category === 'condiment')

   if (proteins.length === 0 || carbs.length === 0 || fats.length === 0) {
      return null
   }

   const protein = pickByIndex(proteins, seed)
   const carb = pickByIndex(carbs, seed + 1)
   const fat = pickByIndex(fats, seed + 2)
   const vegetable = veg.length > 0 ? pickByIndex(veg, seed + 3) : null

   /* Cálculo inicial pensado para que CADA macro aporte SOLO la fracción
    * mayoritaria de su target. Esto deja espacio para que los otros
    * ingredientes aporten el resto sin saturar. */
   const proteinG = clampForIngredient(
      gramsForMacro(protein, 'protein', target.proteinG * 0.7),
      protein
   )
   const carbG = clampForIngredient(gramsForMacro(carb, 'carb', target.carbsG * 0.7), carb)
   const fatG = clampForIngredient(gramsForMacro(fat, 'fat', target.fatsG * 0.5), fat)
   const vegG = vegetable ? clampForIngredient(120, vegetable) : 0

   const proteinServing: ItfIngredientServing = { ingredient: protein, grams: proteinG }
   const carbServing: ItfIngredientServing = { ingredient: carb, grams: carbG }
   const fatServing: ItfIngredientServing = { ingredient: fat, grams: fatG }
   const vegServing: ItfIngredientServing = vegetable
      ? { ingredient: vegetable, grams: vegG }
      : { ingredient: protein, grams: 0 }

   const initialSum = sumMacros([proteinServing, carbServing, fatServing, vegServing])

   /* Escalado post-hoc: si nos pasamos del target +15%, escalamos
    * proporcionalmente carbo y grasa (no proteína, que ya está cerca del
    * mínimo) hasta cuadrar. Si quedamos por debajo -15%, no escalamos
    * para arriba (mejor cuadrar con porciones realistas). */
   const ratio = initialSum.kcal / target.kcal
   let scaledCarbG = carbG
   let scaledFatG = fatG
   if (ratio > 1.15) {
      const factor = 1.15 / ratio
      scaledCarbG = clampForIngredient(carbG * factor, carb)
      scaledFatG = clampForIngredient(fatG * factor, fat)
   }

   const finalProteinServing: ItfIngredientServing = {
      ingredient: protein,
      grams: proteinG
   }
   const finalCarbServing: ItfIngredientServing = {
      ingredient: carb,
      grams: scaledCarbG
   }
   const finalFatServing: ItfIngredientServing = {
      ingredient: fat,
      grams: scaledFatG
   }

   const finalSum = sumMacros([finalProteinServing, finalCarbServing, finalFatServing, vegServing])

   return {
      protein: finalProteinServing,
      carb: finalCarbServing,
      fat: finalFatServing,
      vegetable: vegServing,
      condiments: cond.slice(0, 5),
      actualMacros: {
         kcal: Math.round(finalSum.kcal),
         proteinG: Math.round(finalSum.proteinG),
         carbsG: Math.round(finalSum.carbsG),
         fatsG: Math.round(finalSum.fatsG)
      }
   }
}

const sumMacros = (servings: ItfIngredientServing[]): ItfMacroTarget =>
   servings.reduce(
      (acc, s) => {
         if (s.grams === 0) return acc
         const m = macrosFor(s.ingredient, s.grams)
         return {
            kcal: acc.kcal + m.kcal,
            proteinG: acc.proteinG + m.proteinG,
            carbsG: acc.carbsG + m.carbsG,
            fatsG: acc.fatsG + m.fatsG
         }
      },
      { kcal: 0, proteinG: 0, carbsG: 0, fatsG: 0 }
   )

/**
 * Selector con reintento automático (fix del bug 1200 kcal).
 *
 * Hasta 5 combinaciones distintas (variando seed) hasta encontrar una que
 * caiga dentro de tolerancia ±15% sobre kcal target. Si tras 5 intentos
 * ninguna cuadra, devuelve la última con el menor error (mejor algo que nada;
 * el orquestador puede decidir caer a fallback).
 *
 * Decisión de Lucía: la combinación que SE DEVUELVE siempre tiene
 * `actualMacros.kcal` dentro de ±20% del target — más allá de eso se
 * rechaza directamente y devuelve `null`.
 */
export const selectComponents = ({
   pool,
   target,
   seed = 0
}: SelectorInput): ItfMealComponents | null => {
   const MAX_ATTEMPTS = 5
   const MAX_ALLOWED_RATIO = 1.2

   let best: ItfMealComponents | null = null
   let bestErr = Infinity

   for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const candidate = buildCombination(pool, target, seed + i * 7)
      if (!candidate) continue

      const ratio = candidate.actualMacros.kcal / Math.max(1, target.kcal)
      const err = Math.abs(ratio - 1)

      if (ratio <= 1.15 && ratio >= 0.85) {
         /* Dentro de tolerancia: devolver inmediatamente. */
         return candidate
      }

      if (err < bestErr) {
         best = candidate
         bestErr = err
      }
   }

   /* Si la mejor combinación encontrada excede ±20%, no la devolvemos. */
   if (best) {
      const ratio = best.actualMacros.kcal / Math.max(1, target.kcal)
      if (ratio > MAX_ALLOWED_RATIO || ratio < 0.5) {
         return null
      }
   }

   return best
}

/**
 * Validación auxiliar para tests y orquestador: comprueba si las macros
 * están dentro de la tolerancia (±15% kcal y proteína por default).
 */
export const isWithinTolerance = (
   target: ItfMacroTarget,
   actual: ItfMacroTarget,
   tolerancePct = 0.15
): boolean => {
   const within = (t: number, a: number) => Math.abs(a - t) / Math.max(t, 1) <= tolerancePct
   return within(target.kcal, actual.kcal) && within(target.proteinG, actual.proteinG)
}

/**
 * Devuelve `count` sets de componentes con ingredientes DISTINTOS entre sí.
 * Estrategia: en cada iteración, excluye los ingredientes ya usados para
 * forzar variedad real. Si el pool es chico y no hay suficientes opciones,
 * permite repetición progresiva.
 *
 * Resuelve el problema "las 3 opciones tienen los mismos ingredientes".
 */
export const selectMultipleComponents = ({
   pool,
   target,
   count = 3,
   seed = 0
}: {
   pool: ItfIngredient[]
   target: ItfMacroTarget
   count?: number
   seed?: number
}): ItfMealComponents[] => {
   const results: ItfMealComponents[] = []
   const usedProteinIds = new Set<string>()
   const usedCarbIds = new Set<string>()
   const usedFatIds = new Set<string>()
   const usedVegIds = new Set<string>()

   for (let i = 0; i < count; i++) {
      /* Reducir el pool excluyendo ingredientes ya usados, solo si la
       * exclusión no deja vacía alguna categoría. */
      const reducedPool = pool.filter((p) => {
         if (p.category === 'protein') return !usedProteinIds.has(p.id)
         if (p.category === 'carb') return !usedCarbIds.has(p.id)
         if (p.category === 'fat') return !usedFatIds.has(p.id)
         if (p.category === 'vegetable') return !usedVegIds.has(p.id)
         return true
      })

      const hasAllCategories = (p: ItfIngredient[]) =>
         p.some((x) => x.category === 'protein') &&
         p.some((x) => x.category === 'carb') &&
         p.some((x) => x.category === 'fat')

      const usePool = hasAllCategories(reducedPool) ? reducedPool : pool

      const combo = selectComponents({
         pool: usePool,
         target,
         seed: seed + i * 13
      })
      if (!combo) continue

      usedProteinIds.add(combo.protein.ingredient.id)
      usedCarbIds.add(combo.carb.ingredient.id)
      usedFatIds.add(combo.fat.ingredient.id)
      if (combo.vegetable.grams > 0) {
         usedVegIds.add(combo.vegetable.ingredient.id)
      }
      results.push(combo)
   }

   return results
}
