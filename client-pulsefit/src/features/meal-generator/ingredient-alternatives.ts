import { SEED_INGREDIENTS } from './seed-ingredients'
import type { ItfIngredient, ItfMealType } from './types'

/**
 * Devuelve hasta `limit` alternativas razonables para un ingrediente,
 * filtradas por: misma categoría + meal_type apropiado + no excluidos +
 * no es el ingrediente actual. Prioriza los favoritos del usuario.
 */
export interface FindAlternativesInput {
   currentIngredientId: string
   category: 'protein' | 'carb' | 'fat' | 'vegetable'
   mealType: ItfMealType
   /** IDs excluidos (bloqueados por el usuario o ya en uso en el día). */
   excludedIds?: string[]
   /** IDs favoritos del usuario (boost). */
   favoriteIds?: string[]
   limit?: number
}

export const findIngredientAlternatives = ({
   currentIngredientId,
   category,
   mealType,
   excludedIds = [],
   favoriteIds = [],
   limit = 6
}: FindAlternativesInput): ItfIngredient[] => {
   const candidates = SEED_INGREDIENTS.filter(
      (ing) =>
         ing.category === category &&
         ing.id !== currentIngredientId &&
         !excludedIds.includes(ing.id) &&
         /* Solo ingredientes apropiados para ese meal_type. Si no tiene
          * appropriateMealTypes definido, se asume universal. */
         (!ing.appropriateMealTypes || ing.appropriateMealTypes.includes(mealType))
   )

   /* Ordenar: favoritos primero, luego LATAM, luego el resto. */
   const score = (ing: ItfIngredient): number => {
      let s = 0
      if (favoriteIds.includes(ing.id)) s += 100
      if (ing.tags.includes('LATAM')) s += 10
      if (ing.tags.includes('cheap')) s += 5
      return -s /* invert para sort ASC */
   }
   candidates.sort((a, b) => score(a) - score(b))
   return candidates.slice(0, limit)
}

/**
 * Re-escala los gramos cuando se sustituye un ingrediente por otro de la
 * misma categoría: mantiene el aporte calórico aproximado del slot.
 *
 * Si nuevoIngrediente tiene 200 kcal/100g y el actual 100 kcal/100g,
 * y el actual tenía 150g (= 150 kcal), el nuevo tendrá 75g.
 *
 * Para ingredientes con macros muy distintos (cambiar pollo por aceite),
 * el resultado puede ser absurdo. El UI lo cap a [10g, 400g].
 */
export const rescaleGrams = (
   oldIngredient: ItfIngredient,
   newIngredient: ItfIngredient,
   oldGrams: number
): number => {
   if (newIngredient.kcalPer100g <= 0) return oldGrams
   const oldKcal = (oldIngredient.kcalPer100g * oldGrams) / 100
   const newGrams = (oldKcal / newIngredient.kcalPer100g) * 100
   const rounded = Math.round(newGrams / 5) * 5
   return Math.max(10, Math.min(400, rounded))
}
