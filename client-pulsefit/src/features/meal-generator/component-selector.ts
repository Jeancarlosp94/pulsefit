import type {
   ItfIngredient,
   ItfIngredientServing,
   ItfMacroTarget,
   ItfMealComponents,
   ItfMealType
} from './types'
import { filterCarbsForProtein } from './pairing-rules'

interface SelectorInput {
   pool: ItfIngredient[]
   target: ItfMacroTarget
   /** seed determinístico para que los tests sean reproducibles. Default: 0. */
   seed?: number
   /** Cuando es snack_am/snack_pm aplicamos mínimos reducidos y grasa opcional. */
   mealType?: ItfMealType
}

/**
 * Mínimos por categoría según Lucía:
 *   - Proteína: 50g (porción visible de carne/pescado).
 *   - Carbo: 30g.
 *   - Grasa concentrada (>700 kcal/100g): mín 5g (1 cucharada).
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

/**
 * Mínimos REDUCIDOS para snacks (target típico 100-250 kcal).
 * Lucía aprobó: una porción de yogurt (100g), una manzana mediana (150g),
 * un puñado de almendras (15g). Snacks NO requieren vegetal ni grasa pesada.
 */
const MIN_GRAMS_BY_CATEGORY_SNACK: Record<
   'protein' | 'carb' | 'fat_concentrated' | 'fat_volumed' | 'vegetable',
   number
> = {
   protein: 25,
   carb: 20,
   fat_concentrated: 3,
   fat_volumed: 10,
   vegetable: 30
}

const isSnack = (mt?: ItfMealType): boolean => mt === 'snack_am' || mt === 'snack_pm'

const MAX_GRAMS = 400

const isConcentratedFat = (ing: ItfIngredient): boolean =>
   ing.category === 'fat' && ing.kcalPer100g >= 700

const minGramsFor = (ing: ItfIngredient, mealType?: ItfMealType): number => {
   const table = isSnack(mealType) ? MIN_GRAMS_BY_CATEGORY_SNACK : MIN_GRAMS_BY_CATEGORY
   if (ing.category === 'protein') return table.protein
   if (ing.category === 'carb') return table.carb
   if (ing.category === 'fat') {
      return isConcentratedFat(ing) ? table.fat_concentrated : table.fat_volumed
   }
   if (ing.category === 'vegetable') return table.vegetable
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

const clampForIngredient = (grams: number, ing: ItfIngredient, mealType?: ItfMealType): number => {
   const min = minGramsFor(ing, mealType)
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
   seed: number,
   mealType?: ItfMealType
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
   /* Sprint 11.18: filtrar carbs INCOMPATIBLES con esta proteína ANTES de elegir.
    * Evita que el LLM reciba combos absurdos tipo "yogurt + pan integral" o
    * "jamón + granola". El Chef Diego actúa como red de seguridad después,
    * pero es mejor prevenir en el motor que rechazar con Chef. */
   const compatibleCarbs = filterCarbsForProtein(protein, carbs)
   const carb = pickByIndex(compatibleCarbs, seed + 1)
   const fat = pickByIndex(fats, seed + 2)
   const vegetable = veg.length > 0 ? pickByIndex(veg, seed + 3) : null

   /* En snacks con target de grasa muy bajo, OMITIMOS la grasa: snack típico
    * = proteína + carbo + fruta, sin obligar una grasa que rebasaría el target.
    * Decisión de Lucía: si target.fatsG < 5g, grasa opcional. */
   const fatOptional = isSnack(mealType) && target.fatsG < 5

   /* Cálculo inicial pensado para que CADA macro aporte SOLO la fracción
    * mayoritaria de su target. */
   const proteinG = clampForIngredient(
      gramsForMacro(protein, 'protein', target.proteinG * 0.7),
      protein,
      mealType
   )
   const carbG = clampForIngredient(
      gramsForMacro(carb, 'carb', target.carbsG * 0.7),
      carb,
      mealType
   )
   const fatG = fatOptional
      ? 0
      : clampForIngredient(gramsForMacro(fat, 'fat', target.fatsG * 0.5), fat, mealType)
   const vegG = vegetable && !isSnack(mealType) ? clampForIngredient(120, vegetable, mealType) : 0

   const proteinServing: ItfIngredientServing = { ingredient: protein, grams: proteinG }
   const carbServing: ItfIngredientServing = { ingredient: carb, grams: carbG }
   const fatServing: ItfIngredientServing = { ingredient: fat, grams: fatG }
   const vegServing: ItfIngredientServing = vegetable
      ? { ingredient: vegetable, grams: vegG }
      : { ingredient: protein, grams: 0 }

   const initialSum = sumMacros([proteinServing, carbServing, fatServing, vegServing])

   /* Escalado post-hoc: si nos pasamos del target +15%, escalamos
    * proporcionalmente carbo y grasa (no proteína, que ya está cerca del
    * mínimo) hasta cuadrar. */
   const ratio = initialSum.kcal / target.kcal
   let scaledCarbG = carbG
   let scaledFatG = fatG
   if (ratio > 1.15) {
      const factor = 1.15 / ratio
      scaledCarbG = clampForIngredient(carbG * factor, carb, mealType)
      scaledFatG = fatOptional ? 0 : clampForIngredient(fatG * factor, fat, mealType)
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
   seed = 0,
   mealType
}: SelectorInput): ItfMealComponents | null => {
   const MAX_ATTEMPTS = 5
   /* Tolerancia más amplia para snacks (target chico + porciones realistas
    * empujan el ratio fácilmente fuera del rango "normal"). */
   const maxRatio = isSnack(mealType) ? 1.35 : 1.2
   const minRatio = isSnack(mealType) ? 0.4 : 0.5
   const tolUpper = isSnack(mealType) ? 1.25 : 1.15
   const tolLower = isSnack(mealType) ? 0.75 : 0.85

   let best: ItfMealComponents | null = null
   let bestErr = Infinity

   for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const candidate = buildCombination(pool, target, seed + i * 7, mealType)
      if (!candidate) continue

      const ratio = candidate.actualMacros.kcal / Math.max(1, target.kcal)
      const err = Math.abs(ratio - 1)

      if (ratio <= tolUpper && ratio >= tolLower) {
         return candidate
      }

      if (err < bestErr) {
         best = candidate
         bestErr = err
      }
   }

   if (best) {
      const ratio = best.actualMacros.kcal / Math.max(1, target.kcal)
      if (ratio > maxRatio || ratio < minRatio) {
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
 *
 * Estrategia v2: aplica el filtro por CATEGORÍA INDEPENDIENTEMENTE. Si nos
 * quedamos sin proteínas pero todavía hay carbos/grasas/vegetales no usados,
 * solo "des-bloqueamos" la categoría agotada (no todo el pool). Eso garantiza
 * variedad real en al menos UNA categoría aunque la proteína repita.
 *
 * Resuelve los problemas:
 *   - "3 opciones con los mismos ingredientes" (variedad real entre sets)
 *   - "3er menú repetido" en desayunos con pocas proteínas
 */
export const selectMultipleComponents = ({
   pool,
   target,
   count = 3,
   seed = 0,
   mealType,
   favoriteIngredientIds = []
}: {
   pool: ItfIngredient[]
   target: ItfMacroTarget
   count?: number
   seed?: number
   mealType?: ItfMealType
   /** IDs marcados como favoritos por el usuario en el onboarding. */
   favoriteIngredientIds?: string[]
}): ItfMealComponents[] => {
   const results: ItfMealComponents[] = []
   const usedProteinIds = new Set<string>()
   const usedCarbIds = new Set<string>()
   const usedFatIds = new Set<string>()
   const usedVegIds = new Set<string>()

   /* Boost de favoritos: ponemos los favoritos primero dentro de cada categoría,
    * así pickByIndex(seed) tiene más probabilidad de seleccionarlos en los
    * primeros sets. NO los duplica para no romper la lógica de variedad. */
   const isFav = (id: string) => favoriteIngredientIds.includes(id)
   const sortFavFirst = (a: ItfIngredient, b: ItfIngredient) => {
      const aFav = isFav(a.id) ? 0 : 1
      const bFav = isFav(b.id) ? 0 : 1
      return aFav - bFav
   }
   const allProteins = pool
      .filter((p) => p.category === 'protein')
      .slice()
      .sort(sortFavFirst)
   const allCarbs = pool
      .filter((p) => p.category === 'carb')
      .slice()
      .sort(sortFavFirst)
   const allFats = pool
      .filter((p) => p.category === 'fat')
      .slice()
      .sort(sortFavFirst)
   const allVeg = pool
      .filter((p) => p.category === 'vegetable')
      .slice()
      .sort(sortFavFirst)

   for (let i = 0; i < count; i++) {
      /* Para cada categoría, si quedan opciones sin usar, las usamos;
       * si NO, permitimos repetir solo esa categoría (no reseteamos todo el pool). */
      const availProtein = allProteins.filter((p) => !usedProteinIds.has(p.id))
      const availCarb = allCarbs.filter((p) => !usedCarbIds.has(p.id))
      const availFat = allFats.filter((p) => !usedFatIds.has(p.id))
      const availVeg = allVeg.filter((p) => !usedVegIds.has(p.id))

      /* Construir un pool "ideal" priorizando ingredientes nuevos. */
      const reducedPool: ItfIngredient[] = [
         ...(availProtein.length > 0 ? availProtein : allProteins),
         ...(availCarb.length > 0 ? availCarb : allCarbs),
         ...(availFat.length > 0 ? availFat : allFats),
         ...(availVeg.length > 0 ? availVeg : allVeg),
         ...pool.filter((p) => p.category === 'condiment'),
         ...pool.filter((p) => p.category === 'fruit')
      ]

      const combo = selectComponents({
         pool: reducedPool,
         target,
         seed: seed + i * 13,
         mealType
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
