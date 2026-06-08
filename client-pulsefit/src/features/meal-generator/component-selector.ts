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

const MIN_GRAMS = 30
const MAX_GRAMS = 400

const pickRandom = <T>(arr: T[], seed: number): T => {
   if (arr.length === 0) throw new Error('Pool vacío')
   const idx = Math.abs(seed) % arr.length
   return arr[idx]
}

/**
 * Macros que aporta una cantidad de un ingrediente.
 */
const macrosFor = (ing: ItfIngredient, grams: number): ItfMacroTarget => ({
   kcal: (ing.kcalPer100g * grams) / 100,
   proteinG: (ing.proteinPer100g * grams) / 100,
   carbsG: (ing.carbsPer100g * grams) / 100,
   fatsG: (ing.fatsPer100g * grams) / 100
})

/**
 * Calcula los gramos necesarios de `ing` para aportar `targetGrams` del macro
 * indicado. Si el ingrediente no tiene ese macro, devuelve 0.
 */
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

const clamp = (grams: number): number =>
   Math.max(MIN_GRAMS, Math.min(MAX_GRAMS, Math.round(grams / 5) * 5))

/**
 * Selector determinístico:
 *   1. Proteína primaria (~70% del target proteína).
 *   2. Carbohidrato primario (~80% del target carbos).
 *   3. Grasa primaria (~70% del target fats).
 *   4. Vegetal (100-300 g, libre).
 *   5. Condimentos siempre disponibles (sal, pimienta, ajo, limón, hierbas).
 *
 * Devuelve `null` si no encuentra un ingrediente válido para alguna categoría.
 * El error se maneja arriba con fallback.
 */
export const selectComponents = ({
   pool,
   target,
   seed = 0
}: SelectorInput): ItfMealComponents | null => {
   const proteins = pool.filter((p) => p.category === 'protein')
   const carbs = pool.filter((p) => p.category === 'carb')
   const fats = pool.filter((p) => p.category === 'fat')
   const veg = pool.filter((p) => p.category === 'vegetable')
   const cond = pool.filter((p) => p.category === 'condiment')

   if (proteins.length === 0 || carbs.length === 0 || fats.length === 0) return null

   const protein = pickRandom(proteins, seed)
   const carb = pickRandom(carbs, seed + 1)
   const fat = pickRandom(fats, seed + 2)
   const vegetable = veg.length > 0 ? pickRandom(veg, seed + 3) : null

   const proteinG = clamp(gramsForMacro(protein, 'protein', target.proteinG * 0.7))
   const carbG = clamp(gramsForMacro(carb, 'carb', target.carbsG * 0.8))
   const fatG = clamp(gramsForMacro(fat, 'fat', target.fatsG * 0.7))
   const vegG = vegetable ? 150 : 0

   const proteinServing: ItfIngredientServing = { ingredient: protein, grams: proteinG }
   const carbServing: ItfIngredientServing = { ingredient: carb, grams: carbG }
   const fatServing: ItfIngredientServing = { ingredient: fat, grams: fatG }
   const vegServing: ItfIngredientServing = vegetable
      ? { ingredient: vegetable, grams: vegG }
      : { ingredient: protein, grams: 0 } // never used; tipado defensivo

   const sum = [proteinServing, carbServing, fatServing, vegServing].reduce(
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

   return {
      protein: proteinServing,
      carb: carbServing,
      fat: fatServing,
      vegetable: vegServing,
      condiments: cond.slice(0, 5),
      actualMacros: {
         kcal: Math.round(sum.kcal),
         proteinG: Math.round(sum.proteinG),
         carbsG: Math.round(sum.carbsG),
         fatsG: Math.round(sum.fatsG)
      }
   }
}

/**
 * Tolerancia del cierre macroespecífico: ±15% es aceptable para que el
 * generador acepte la combinación. Si excede, deberíamos intentar otra
 * combinación o caer a fallback.
 */
export const isWithinTolerance = (
   target: ItfMacroTarget,
   actual: ItfMacroTarget,
   tolerancePct = 0.15
): boolean => {
   const within = (t: number, a: number) => Math.abs(a - t) / Math.max(t, 1) <= tolerancePct
   return within(target.kcal, actual.kcal) && within(target.proteinG, actual.proteinG)
}
