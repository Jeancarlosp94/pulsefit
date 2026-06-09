import type { ItfIngredient, ItfMealType, ItfUserContextForMeal } from './types'

/**
 * Mapeo de restricciones dietarias a tags que un ingrediente NO debe llevar.
 * Si el ingrediente tiene cualquiera de esos tags y el usuario tiene la restricción
 * activa, se excluye.
 */
const RESTRICTION_TO_FORBIDDEN_TAGS: Record<string, string[]> = {
   vegan: ['meat', 'dairy', 'egg', 'honey', 'fish'],
   vegetarian: ['meat', 'fish'],
   pescatarian: ['meat'],
   gluten_free: ['gluten'],
   lactose_free: ['dairy', 'lactose'],
   kosher: ['pork', 'shellfish'],
   halal: ['pork', 'alcohol']
}

/**
 * Tags de presupuesto. Si budget=low, solo dejamos ingredientes con tag 'cheap'
 * o sin tag de precio (asumimos neutro). Si budget=medium aceptamos 'cheap' y
 * 'mid'. Si budget=high aceptamos todos.
 */
const BUDGET_ALLOWED: Record<'low' | 'medium' | 'high', (tag: string | undefined) => boolean> = {
   low: (t) => !t || t === 'cheap',
   medium: (t) => !t || t === 'cheap' || t === 'mid',
   high: () => true
}

/**
 * Filtra un pool crudo de ingredientes según las restricciones del perfil.
 *
 * Función PURA: recibe ingredientes ya cargados (no hace fetch). El fetch a
 * Open Food Facts y la lectura de `foods_cache` viven en la Edge Function.
 *
 * Reglas (de generadores-hibridos.md sección 2 etapa 2):
 *   1. Excluye ingredientes con tags incompatibles con dietary_restrictions.
 *   2. Excluye ingredientes en disliked_foods (match case-insensitive por nombre).
 *   3. Excluye ingredientes con tag de alergia presente en la cadena allergies.
 *   4. Filtra por budget_level usando tags de precio.
 *   5. Prefiere ingredientes de region (tag de región o sin tag).
 *   6. Devuelve solo ingredientes con macros conocidos (kcalPer100g > 0).
 */
export const filterIngredientPool = (
   pool: ItfIngredient[],
   ctx: ItfUserContextForMeal,
   options?: {
      mealType?: ItfMealType
      excludedIngredientIds?: string[]
   }
): ItfIngredient[] => {
   const excluded = new Set(options?.excludedIngredientIds ?? [])
   const mealType = options?.mealType

   const forbiddenTags = new Set<string>()
   ctx.dietaryRestrictions.forEach((r) => {
      RESTRICTION_TO_FORBIDDEN_TAGS[r]?.forEach((tag) => forbiddenTags.add(tag))
   })

   const disliked = new Set(ctx.dislikedFoods.map((d) => d.toLowerCase().trim()).filter(Boolean))

   const allergiesLower = (ctx.allergies ?? '').toLowerCase()
   const allergyTokens = allergiesLower
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2)

   const budgetCheck = BUDGET_ALLOWED[ctx.budgetLevel]

   return pool.filter((ing) => {
      // 7 — excluido por el usuario en esta sesión (botón X)
      if (excluded.has(ing.id)) return false

      // 6 — macros conocidos (condimentos pueden tener 0 kcal como la sal)
      if (ing.kcalPer100g <= 0 && ing.category !== 'condiment') return false

      // 8 — adecuación por meal_type (Lucía). Si el ingrediente no especifica
      // appropriateMealTypes, lo consideramos apto para todas (default permisivo
      // para condimentos y casos no taggeados).
      if (mealType && ing.appropriateMealTypes && ing.appropriateMealTypes.length > 0) {
         if (!ing.appropriateMealTypes.includes(mealType)) return false
      }

      // 1 — tags prohibidos por restricción
      const tagsLower = ing.tags.map((t) => t.toLowerCase())
      if (tagsLower.some((t) => forbiddenTags.has(t))) return false

      // 2 — disliked
      if (disliked.has(ing.name.toLowerCase().trim())) return false

      // 3 — alergias
      if (allergyTokens.some((token) => ing.name.toLowerCase().includes(token))) return false
      if (allergyTokens.some((token) => tagsLower.includes(token))) return false

      // 4 — presupuesto
      const priceTag = tagsLower.find((t) => t === 'cheap' || t === 'mid' || t === 'expensive')
      if (!budgetCheck(priceTag)) return false

      // 5 — región: prefer match, pero no excluyente
      // (lo aplicamos como priorización en el selector, no como filtro duro)

      return true
   })
}

/**
 * Reordena el pool poniendo primero los ingredientes que matchean la región
 * del perfil (regionTag = ctx.region.toLowerCase()).
 */
export const prioritizeByRegion = (pool: ItfIngredient[], region: string): ItfIngredient[] => {
   const regionLower = region.toLowerCase()
   return [...pool].sort((a, b) => {
      const aRegion = a.tags.some((t) => t.toLowerCase() === regionLower) ? 1 : 0
      const bRegion = b.tags.some((t) => t.toLowerCase() === regionLower) ? 1 : 0
      return bRegion - aRegion
   })
}
