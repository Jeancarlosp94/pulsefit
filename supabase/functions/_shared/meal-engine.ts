/**
 * Motor `meal-generator` portado a Deno para uso desde Edge Functions.
 *
 * Es un MIRROR de `client-pulsefit/src/features/meal-generator/` — cuando
 * actualices uno, sincronizá el otro. Los tests viven en Vitest (frontend);
 * acá replicamos solo la lógica de runtime.
 *
 * Fuente: files/generadores-hibridos.md
 */

// ============================================================
//  TYPES
// ============================================================
export type MealType =
   | 'breakfast'
   | 'lunch'
   | 'dinner'
   | 'snack_am'
   | 'snack_pm'
export type Goal = 'lose' | 'gain' | 'maintain' | 'feel_better'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface MacroTarget {
   kcal: number
   proteinG: number
   carbsG: number
   fatsG: number
}

export interface Ingredient {
   id: string
   name: string
   category:
      | 'protein'
      | 'carb'
      | 'fat'
      | 'vegetable'
      | 'condiment'
      | 'fruit'
      | 'dairy'
   kcalPer100g: number
   proteinPer100g: number
   carbsPer100g: number
   fatsPer100g: number
   tags: string[]
   source: 'openfoodfacts' | 'manual' | 'foods_cache'
   appropriateMealTypes?: MealType[]
}

export interface IngredientServing {
   ingredient: Ingredient
   grams: number
}

export interface MealComponents {
   protein: IngredientServing
   carb: IngredientServing
   fat: IngredientServing
   vegetable: IngredientServing
   condiments: Ingredient[]
   actualMacros: MacroTarget
}

export interface PlateOption {
   name: string
   description: string
   prep_time_min: number
   difficulty: Difficulty
   steps: string[]
}

export interface UserContextForMeal {
   region: string
   goal: Goal
   dietaryRestrictions: string[]
   allergies: string
   dislikedFoods: string[]
   budgetLevel: 'low' | 'medium' | 'high'
   cooksAtHome: 'yes' | 'sometimes' | 'rarely'
   mealsPerDay: 2 | 3 | 4 | 5
}

export type MealsPerDay = 2 | 3 | 4 | 5

export const MEAL_DISTRIBUTIONS: Record<
   MealsPerDay,
   Partial<Record<MealType, number>>
> = {
   2: { lunch: 0.4, dinner: 0.6 },
   3: { breakfast: 0.3, lunch: 0.4, dinner: 0.3 },
   4: { breakfast: 0.25, lunch: 0.35, snack_pm: 0.15, dinner: 0.25 },
   5: {
      breakfast: 0.2,
      snack_am: 0.125,
      lunch: 0.3,
      snack_pm: 0.125,
      dinner: 0.25
   }
}

export const MEAL_MIN_KCAL: Record<MealType, number> = {
   breakfast: 250,
   lunch: 350,
   dinner: 250,
   snack_am: 100,
   snack_pm: 100
}

export const getActiveMealTypes = (mealsPerDay: MealsPerDay): MealType[] =>
   Object.keys(MEAL_DISTRIBUTIONS[mealsPerDay]) as MealType[]

export type ValidationReason =
   | 'invalid_json'
   | 'wrong_option_count'
   | 'missing_fields'
   | 'unknown_ingredient'
   | 'prep_time_out_of_range'
   | 'steps_out_of_range'
   | 'step_length'
   | 'bad_difficulty'
   | 'forbidden_words'

export type ValidationResult =
   | { valid: true; options: PlateOption[] }
   | { valid: false; reason: ValidationReason; detail?: string }

export const MEAL_DISTRIBUTION: Record<MealType, number> = {
   breakfast: 0.25,
   lunch: 0.35,
   dinner: 0.3,
   snack_am: 0.05,
   snack_pm: 0.05
}

// ============================================================
//  NUTRITIONAL TARGET
// ============================================================
export const computeMealTarget = (input: {
   dailyKcal: number
   dailyProteinG: number
   dailyCarbsG: number
   dailyFatsG: number
   mealType: MealType
   mealsPerDay?: MealsPerDay
}): MacroTarget | null => {
   const dist = MEAL_DISTRIBUTIONS[input.mealsPerDay ?? 3]
   const r = dist[input.mealType]
   if (r === undefined) return null
   const minKcal = MEAL_MIN_KCAL[input.mealType]
   return {
      kcal: Math.max(minKcal, Math.round(input.dailyKcal * r)),
      proteinG: Math.round(input.dailyProteinG * r),
      carbsG: Math.round(input.dailyCarbsG * r),
      fatsG: Math.round(input.dailyFatsG * r)
   }
}

// ============================================================
//  INGREDIENT POOL (filtrado por perfil)
// ============================================================
const RESTRICTION_TO_FORBIDDEN_TAGS: Record<string, string[]> = {
   vegan: ['meat', 'dairy', 'egg', 'honey', 'fish'],
   vegetarian: ['meat', 'fish'],
   pescatarian: ['meat'],
   gluten_free: ['gluten'],
   lactose_free: ['dairy', 'lactose'],
   kosher: ['pork', 'shellfish'],
   halal: ['pork', 'alcohol']
}
const BUDGET_ALLOWED: Record<
   'low' | 'medium' | 'high',
   (tag: string | undefined) => boolean
> = {
   low: (t) => !t || t === 'cheap',
   medium: (t) => !t || t === 'cheap' || t === 'mid',
   high: () => true
}

export const filterIngredientPool = (
   pool: Ingredient[],
   ctx: UserContextForMeal,
   options?: {
      mealType?: MealType
      excludedIngredientIds?: string[]
   }
): Ingredient[] => {
   const excluded = new Set(options?.excludedIngredientIds ?? [])
   const mealType = options?.mealType

   const forbiddenTags = new Set<string>()
   ctx.dietaryRestrictions.forEach((r) => {
      RESTRICTION_TO_FORBIDDEN_TAGS[r]?.forEach((tag) => forbiddenTags.add(tag))
   })
   const disliked = new Set(
      ctx.dislikedFoods.map((d) => d.toLowerCase().trim()).filter(Boolean)
   )
   const allergiesLower = (ctx.allergies ?? '').toLowerCase()
   const allergyTokens = allergiesLower
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2)
   const budgetCheck = BUDGET_ALLOWED[ctx.budgetLevel]

   return pool.filter((ing) => {
      if (excluded.has(ing.id)) return false
      if (ing.kcalPer100g <= 0 && ing.category !== 'condiment') return false
      if (mealType && ing.appropriateMealTypes && ing.appropriateMealTypes.length > 0) {
         if (!ing.appropriateMealTypes.includes(mealType)) return false
      }
      const tagsLower = ing.tags.map((t) => t.toLowerCase())
      if (tagsLower.some((t) => forbiddenTags.has(t))) return false
      if (disliked.has(ing.name.toLowerCase().trim())) return false
      if (
         allergyTokens.some((token) => ing.name.toLowerCase().includes(token))
      )
         return false
      if (allergyTokens.some((token) => tagsLower.includes(token))) return false
      const priceTag = tagsLower.find(
         (t) => t === 'cheap' || t === 'mid' || t === 'expensive'
      )
      if (!budgetCheck(priceTag)) return false
      return true
   })
}

// ============================================================
//  COMPONENT SELECTOR (con fix bug 1200 kcal: mins por categoría + reintento)
// ============================================================
const MAX_GRAMS = 400
const MIN_GRAMS_BY_CATEGORY = {
   protein: 50,
   carb: 30,
   fat_concentrated: 5,
   fat_volumed: 15,
   vegetable: 80
}
/* Mínimos REDUCIDOS para snacks (target típico 100-250 kcal). */
const MIN_GRAMS_BY_CATEGORY_SNACK = {
   protein: 25,
   carb: 20,
   fat_concentrated: 3,
   fat_volumed: 10,
   vegetable: 30
}

const isSnack = (mt?: MealType): boolean => mt === 'snack_am' || mt === 'snack_pm'

const isConcentratedFat = (ing: Ingredient): boolean =>
   ing.category === 'fat' && ing.kcalPer100g >= 700

const minGramsFor = (ing: Ingredient, mealType?: MealType): number => {
   const t = isSnack(mealType) ? MIN_GRAMS_BY_CATEGORY_SNACK : MIN_GRAMS_BY_CATEGORY
   if (ing.category === 'protein') return t.protein
   if (ing.category === 'carb') return t.carb
   if (ing.category === 'fat') {
      return isConcentratedFat(ing) ? t.fat_concentrated : t.fat_volumed
   }
   if (ing.category === 'vegetable') return t.vegetable
   return 5
}

const clampForIngredient = (
   grams: number,
   ing: Ingredient,
   mealType?: MealType
): number => {
   const min = minGramsFor(ing, mealType)
   const rounded = Math.round(grams / 5) * 5
   return Math.max(min, Math.min(MAX_GRAMS, rounded))
}

const pickByIndex = <T>(arr: T[], index: number): T =>
   arr[Math.abs(index) % arr.length]

const gramsForMacro = (
   ing: Ingredient,
   macro: 'protein' | 'carb' | 'fat',
   targetGrams: number
) => {
   const per100 =
      macro === 'protein'
         ? ing.proteinPer100g
         : macro === 'carb'
            ? ing.carbsPer100g
            : ing.fatsPer100g
   if (per100 <= 0) return 0
   return (targetGrams / per100) * 100
}

const macrosFor = (ing: Ingredient, grams: number): MacroTarget => ({
   kcal: (ing.kcalPer100g * grams) / 100,
   proteinG: (ing.proteinPer100g * grams) / 100,
   carbsG: (ing.carbsPer100g * grams) / 100,
   fatsG: (ing.fatsPer100g * grams) / 100
})

const sumMacros = (servings: IngredientServing[]): MacroTarget =>
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

const buildCombination = (
   pool: Ingredient[],
   target: MacroTarget,
   seed: number,
   mealType?: MealType
): MealComponents | null => {
   const proteins = pool.filter((p) => p.category === 'protein')
   const carbs = pool.filter((p) => p.category === 'carb')
   const fats = pool.filter((p) => p.category === 'fat')
   const veg = pool.filter((p) => p.category === 'vegetable')
   const cond = pool.filter((p) => p.category === 'condiment')

   if (!proteins.length || !carbs.length || !fats.length) return null

   const protein = pickByIndex(proteins, seed)
   const carb = pickByIndex(carbs, seed + 1)
   const fat = pickByIndex(fats, seed + 2)
   const vegetable = veg.length ? pickByIndex(veg, seed + 3) : null

   /* En snacks con target.fatsG < 5, grasa opcional. */
   const fatOptional = isSnack(mealType) && target.fatsG < 5

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

   const initialSum = sumMacros([
      { ingredient: protein, grams: proteinG },
      { ingredient: carb, grams: carbG },
      { ingredient: fat, grams: fatG },
      vegetable ? { ingredient: vegetable, grams: vegG } : { ingredient: protein, grams: 0 }
   ])

   let scaledCarbG = carbG
   let scaledFatG = fatG
   const ratio = initialSum.kcal / Math.max(1, target.kcal)
   if (ratio > 1.15) {
      const factor = 1.15 / ratio
      scaledCarbG = clampForIngredient(carbG * factor, carb, mealType)
      scaledFatG = fatOptional ? 0 : clampForIngredient(fatG * factor, fat, mealType)
   }

   const finalServings: IngredientServing[] = [
      { ingredient: protein, grams: proteinG },
      { ingredient: carb, grams: scaledCarbG },
      { ingredient: fat, grams: scaledFatG },
      vegetable ? { ingredient: vegetable, grams: vegG } : { ingredient: protein, grams: 0 }
   ]
   const finalSum = sumMacros(finalServings)

   return {
      protein: { ingredient: protein, grams: proteinG },
      carb: { ingredient: carb, grams: scaledCarbG },
      fat: { ingredient: fat, grams: scaledFatG },
      vegetable: vegetable
         ? { ingredient: vegetable, grams: vegG }
         : { ingredient: protein, grams: 0 },
      condiments: cond.slice(0, 5),
      actualMacros: {
         kcal: Math.round(finalSum.kcal),
         proteinG: Math.round(finalSum.proteinG),
         carbsG: Math.round(finalSum.carbsG),
         fatsG: Math.round(finalSum.fatsG)
      }
   }
}

export const selectComponents = (input: {
   pool: Ingredient[]
   target: MacroTarget
   seed?: number
   mealType?: MealType
}): MealComponents | null => {
   const MAX_ATTEMPTS = 5
   const seed = input.seed ?? 0
   const mealType = input.mealType
   /* Tolerancia más amplia para snacks. */
   const maxRatio = isSnack(mealType) ? 1.35 : 1.2
   const minRatio = isSnack(mealType) ? 0.4 : 0.5
   const tolUpper = isSnack(mealType) ? 1.25 : 1.15
   const tolLower = isSnack(mealType) ? 0.75 : 0.85

   let best: MealComponents | null = null
   let bestErr = Infinity

   for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const candidate = buildCombination(input.pool, input.target, seed + i * 7, mealType)
      if (!candidate) continue
      const ratio = candidate.actualMacros.kcal / Math.max(1, input.target.kcal)
      const err = Math.abs(ratio - 1)
      if (ratio <= tolUpper && ratio >= tolLower) return candidate
      if (err < bestErr) {
         best = candidate
         bestErr = err
      }
   }

   if (best) {
      const ratio = best.actualMacros.kcal / Math.max(1, input.target.kcal)
      if (ratio > maxRatio || ratio < minRatio) return null
   }
   return best
}

// ============================================================
//  COMPOSE PROMPT
// ============================================================
const MEAL_TYPE_LABEL: Record<MealType, string> = {
   breakfast: 'desayuno',
   lunch: 'almuerzo',
   dinner: 'cena',
   snack_am: 'media mañana',
   snack_pm: 'media tarde'
}
const REGION_CUISINE: Record<string, string> = {
   LATAM: 'latinoamericana',
   EU: 'mediterránea',
   ASIA: 'asiática',
   NA: 'norteamericana'
}

export const SYSTEM_PROMPT = `Eres un asistente culinario que compone platos usando EXCLUSIVAMENTE los ingredientes y cantidades exactas que se te proporcionan.

REGLAS INVIOLABLES:
- NUNCA agregas ingredientes nuevos.
- NUNCA modificas cantidades.
- NUNCA calculas calorías ni macros (vienen impuestos).
- NUNCA das consejos médicos ni nutricionales.
- NUNCA usas tono punitivo ("debes", "tienes que", "fallaste").
- Devuelves SOLO JSON válido, sin texto adicional, sin markdown.

Tu única tarea es COMBINAR creativamente los ingredientes dados en 3 platos diferentes con nombre cálido (en español, sin emojis) y pasos claros.`

export const buildUserPrompt = (input: {
   components: MealComponents
   mealType: MealType
   ctx: UserContextForMeal
   maxPrepTime: number
}): string => {
   const mealLabel = MEAL_TYPE_LABEL[input.mealType]
   const cuisine = REGION_CUISINE[input.ctx.region] ?? 'mixta'
   const lines = [
      `- ${input.components.protein.ingredient.name}: ${input.components.protein.grams}g`,
      `- ${input.components.carb.ingredient.name}: ${input.components.carb.grams}g`,
      `- ${input.components.fat.ingredient.name}: ${input.components.fat.grams}g`,
      input.components.vegetable.grams > 0
         ? `- ${input.components.vegetable.ingredient.name}: ${input.components.vegetable.grams}g`
         : null,
      '- ajo, sal, pimienta, limón, hierbas frescas (libre uso)'
   ]
      .filter(Boolean)
      .join('\n')

   return `Genera 3 platos diferentes para ${mealLabel} usando SOLO estos ingredientes:

${lines}

Restricciones:
- Tiempo de preparación: máximo ${input.maxPrepTime} minutos
- Cocina cultural: ${cuisine}
- Dificultad: easy

Devuelve JSON con esta estructura EXACTA:

{
  "options": [
    {
      "name": "nombre del plato (cálido, en español, sin emojis)",
      "description": "descripción breve, 1 oración, máximo 120 caracteres",
      "prep_time_min": número entero entre 5 y 60,
      "difficulty": "easy" | "medium" | "hard",
      "steps": ["paso 1", "paso 2", ...]
    }
  ]
}

Restricciones del JSON:
- "options" debe tener EXACTAMENTE 3 elementos.
- "steps" debe tener entre 2 y 10 elementos.
- Cada step entre 10 y 200 caracteres, en imperativo amable.
- Los 3 platos deben ser distintos entre sí en preparación.`
}

export const maxPrepTimeForUser = (ctx: UserContextForMeal): number => {
   if (ctx.cooksAtHome === 'rarely') return 15
   if (ctx.cooksAtHome === 'sometimes') return 25
   return 35
}

// ============================================================
//  VALIDATOR
// ============================================================
const FORBIDDEN_WORDS = [
   'fallaste',
   'incorrecto',
   'malo',
   'diagnóstico',
   'enfermedad',
   'cura',
   'medicamento',
   'tonificar',
   'quemar grasa',
   'transformación',
   'antes y después',
   'régimen estricto'
]
const FREE_USE = new Set([
   'sal',
   'pimienta',
   'ajo',
   'limón',
   'limon',
   'agua',
   'hierbas',
   'orégano',
   'tomillo',
   'cilantro',
   'perejil',
   'comino',
   'aceite',
   'vinagre'
])
const FOOD_HEURISTIC = /^[a-záéíóúñ]+$/u
const fail = (
   reason: Exclude<ValidationResult, { valid: true }>['reason'],
   detail?: string
): ValidationResult => ({ valid: false, reason, ...(detail ? { detail } : {}) })

const tokenize = (text: string): string[] =>
   text
      .toLowerCase()
      .split(/[\s,.;:()¡!¿?\n]+/u)
      .filter((t) => t.length >= 4)

export const validateMealResponse = (input: {
   raw: string
   allowedIngredients: string[]
}): ValidationResult => {
   let parsed: { options?: PlateOption[] }
   try {
      parsed = JSON.parse(input.raw)
   } catch {
      return fail('invalid_json')
   }
   const opts = parsed.options
   if (!Array.isArray(opts) || opts.length !== 3) {
      return fail('wrong_option_count', `recibí ${opts?.length ?? 0}`)
   }
   const allowed = input.allowedIngredients.map((s) => s.toLowerCase().trim())

   for (let i = 0; i < opts.length; i++) {
      const opt = opts[i]
      if (
         !opt ||
         typeof opt.name !== 'string' ||
         typeof opt.description !== 'string' ||
         typeof opt.prep_time_min !== 'number' ||
         typeof opt.difficulty !== 'string' ||
         !Array.isArray(opt.steps)
      ) {
         return fail('missing_fields', `option ${i}`)
      }
      if (opt.prep_time_min < 5 || opt.prep_time_min > 60) {
         return fail('prep_time_out_of_range', `option ${i}`)
      }
      if (opt.steps.length < 2 || opt.steps.length > 10) {
         return fail('steps_out_of_range', `option ${i}`)
      }
      const badStep = opt.steps.find(
         (s) => typeof s !== 'string' || s.length < 10 || s.length > 200
      )
      if (badStep !== undefined) return fail('step_length', `option ${i}`)
      if (!['easy', 'medium', 'hard'].includes(opt.difficulty)) {
         return fail('bad_difficulty', `option ${i}`)
      }
      const fullText = [opt.name, opt.description, ...opt.steps]
         .join(' ')
         .toLowerCase()
      const forbidden = FORBIDDEN_WORDS.find((w) => fullText.includes(w))
      if (forbidden) return fail('forbidden_words', `option ${i}: ${forbidden}`)
      const tokens = tokenize(fullText)
      const unknown = tokens.find(
         (t) =>
            FOOD_HEURISTIC.test(t) &&
            !FREE_USE.has(t) &&
            allowed.every((a) => !a.includes(t) && !t.includes(a)) &&
            [
               'azúcar',
               'queso',
               'mantequilla',
               'crema',
               'tocino',
               'jamón',
               'salchicha'
            ].includes(t)
      )
      if (unknown) return fail('unknown_ingredient', unknown)
   }
   return { valid: true, options: opts }
}

// ============================================================
//  FALLBACK TEMPLATES
// ============================================================
const MEAL_LABEL_FB: Record<MealType, string> = {
   breakfast: 'el desayuno',
   lunch: 'el almuerzo',
   dinner: 'la cena',
   snack_am: 'la media mañana',
   snack_pm: 'la media tarde'
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const ingredientName = (s: IngredientServing) =>
   `${s.grams}g de ${s.ingredient.name}`

export const buildMealFallback = (
   components: MealComponents,
   mealType: MealType
): PlateOption[] => {
   const { protein, carb, fat, vegetable } = components
   const hasVeg = vegetable.grams > 0
   const proteinName = protein.ingredient.name
   const carbName = carb.ingredient.name
   const vegName = hasVeg ? vegetable.ingredient.name : ''

   return [
      {
         name: `Bowl de ${proteinName} con ${carbName}${hasVeg ? ` y ${vegName}` : ''}`,
         description: `Plato simple y balanceado, ideal para ${MEAL_LABEL_FB[mealType]}.`,
         prep_time_min: 20,
         difficulty: 'easy',
         steps: [
            `Cocina ${ingredientName(carb)} hasta su punto deseado, con un toque de sal.`,
            `Sazona ${ingredientName(protein)} con sal, pimienta y ajo al gusto.`,
            `Cocina ${proteinName} a la plancha con ${ingredientName(fat)} 5 a 7 minutos.`,
            hasVeg
               ? `Saltea o cuece al vapor ${ingredientName(vegetable)} hasta que esté brillante.`
               : `Prepara unas hierbas frescas y limón para decorar.`,
            `Sirve todo junto en un bowl, decora con limón o hierbas frescas y disfruta.`
         ]
      },
      {
         name: `${cap(proteinName)} al ajillo con ${carbName}${hasVeg ? ` y ${vegName}` : ''}`,
         description: `Versión clásica casera, ideal cuando quieres algo familiar.`,
         prep_time_min: 25,
         difficulty: 'easy',
         steps: [
            `Pica un par de dientes de ajo finos y déjalos listos.`,
            `Cocina ${ingredientName(carb)} con sal hasta su punto.`,
            `Calienta ${ingredientName(fat)} en sartén y dora el ajo unos segundos.`,
            `Suma ${ingredientName(protein)} y cocina a fuego medio, dándole vuelta cada par de minutos.`,
            hasVeg
               ? `Agrega ${ingredientName(vegetable)} en los últimos 4 minutos para que quede crujiente.`
               : `Termina con pimienta y unas gotas de limón.`,
            `Sirve caliente, en un plato dividido, con un toque de limón al final.`
         ]
      },
      {
         name: `Salteado de ${proteinName}${hasVeg ? ` con ${vegName}` : ''} y ${carbName}`,
         description: `Estilo wok rápido, todo en una sartén.`,
         prep_time_min: 15,
         difficulty: 'easy',
         steps: [
            `Cocina ${ingredientName(carb)} aparte y reserva.`,
            `Corta ${proteinName} en cubos pequeños para que cocine rápido.`,
            `Calienta ${ingredientName(fat)} en sartén bien caliente y dora el ${proteinName}.`,
            hasVeg
               ? `Suma ${ingredientName(vegetable)} y saltea 2 a 3 minutos manteniendo el color vivo.`
               : `Agrega ajo y sazón al gusto, salteando todo junto.`,
            `Incorpora ${carbName} cocido, mezcla con sal, pimienta y unas gotas de limón.`,
            `Sirve caliente, agrega hierbas frescas si tienes a mano.`
         ]
      }
   ]
}

// ============================================================
//  MULTI-SET SELECTOR (variedad real entre las opciones)
// ============================================================
export const selectMultipleComponents = (input: {
   pool: Ingredient[]
   target: MacroTarget
   count?: number
   seed?: number
   mealType?: MealType
}): MealComponents[] => {
   const count = input.count ?? 3
   const seed = input.seed ?? 0
   const mealType = input.mealType
   const results: MealComponents[] = []
   const usedProtein = new Set<string>()
   const usedCarb = new Set<string>()
   const usedFat = new Set<string>()
   const usedVeg = new Set<string>()

   const allProteins = input.pool.filter((p) => p.category === 'protein')
   const allCarbs = input.pool.filter((p) => p.category === 'carb')
   const allFats = input.pool.filter((p) => p.category === 'fat')
   const allVeg = input.pool.filter((p) => p.category === 'vegetable')

   for (let i = 0; i < count; i++) {
      const availProtein = allProteins.filter((p) => !usedProtein.has(p.id))
      const availCarb = allCarbs.filter((p) => !usedCarb.has(p.id))
      const availFat = allFats.filter((p) => !usedFat.has(p.id))
      const availVeg = allVeg.filter((p) => !usedVeg.has(p.id))

      const reducedPool: Ingredient[] = [
         ...(availProtein.length > 0 ? availProtein : allProteins),
         ...(availCarb.length > 0 ? availCarb : allCarbs),
         ...(availFat.length > 0 ? availFat : allFats),
         ...(availVeg.length > 0 ? availVeg : allVeg),
         ...input.pool.filter((p) => p.category === 'condiment'),
         ...input.pool.filter((p) => p.category === 'fruit')
      ]

      const combo = selectComponents({
         pool: reducedPool,
         target: input.target,
         seed: seed + i * 13,
         mealType
      })
      if (!combo) continue
      usedProtein.add(combo.protein.ingredient.id)
      usedCarb.add(combo.carb.ingredient.id)
      usedFat.add(combo.fat.ingredient.id)
      if (combo.vegetable.grams > 0) usedVeg.add(combo.vegetable.ingredient.id)
      results.push(combo)
   }
   return results
}

// ============================================================
//  SINGLE PLATE PROMPT (Promise.all paralelo)
// ============================================================
const MEAL_TYPE_LABEL_FB: Record<MealType, string> = {
   breakfast: 'desayuno',
   lunch: 'almuerzo',
   dinner: 'cena',
   snack_am: 'media mañana',
   snack_pm: 'media tarde'
}
const REGION_CUISINE_FB: Record<string, string> = {
   LATAM: 'latinoamericana',
   EU: 'mediterránea',
   ASIA: 'asiática',
   NA: 'norteamericana'
}

export const STYLE_HINTS = [
   'bowl / plato unificado',
   'al ajillo / estilo casero',
   'salteado al wok / rápido'
] as const

export const buildSinglePlatePrompt = (input: {
   components: MealComponents
   mealType: MealType
   ctx: UserContextForMeal
   maxPrepTime: number
   styleHint?: string
}): string => {
   const mealLabel = MEAL_TYPE_LABEL_FB[input.mealType]
   const cuisine = REGION_CUISINE_FB[input.ctx.region] ?? 'mixta'
   const lines = [
      `- ${input.components.protein.ingredient.name}: ${input.components.protein.grams}g`,
      `- ${input.components.carb.ingredient.name}: ${input.components.carb.grams}g`,
      `- ${input.components.fat.ingredient.name}: ${input.components.fat.grams}g`,
      input.components.vegetable.grams > 0
         ? `- ${input.components.vegetable.ingredient.name}: ${input.components.vegetable.grams}g`
         : null,
      '- ajo, sal, pimienta, limón, hierbas frescas (libre uso)'
   ]
      .filter(Boolean)
      .join('\n')
   const stylePhrase = input.styleHint
      ? `\n- Estilo de cocción sugerido: ${input.styleHint}.`
      : ''
   const maxPrep = Math.min(input.maxPrepTime, 55)
   return `Genera UN plato para ${mealLabel} usando SOLO estos ingredientes:

${lines}

Restricciones:
- Tiempo de preparación: ENTRE 5 y ${maxPrep} minutos (estricto)
- Cocina cultural: ${cuisine}
- Dificultad: easy${stylePhrase}

Devuelve JSON EXACTO (un solo plato, NO un array, NO markdown, NO texto extra):

{
  "name": "nombre del plato (cálido, en español, sin emojis, máximo 60 caracteres)",
  "description": "descripción breve, 1 oración, máximo 110 caracteres",
  "prep_time_min": número entero entre 5 y ${maxPrep},
  "difficulty": "easy",
  "steps": ["paso 1", "paso 2", "paso 3", "paso 4"]
}

REGLAS CRÍTICAS DE STEPS (sigue al pie de la letra):
- ENTRE 3 y 7 elementos en el array (ni más, ni menos).
- Cada step entre 30 y 180 caracteres (NO más de 180, NO menos de 30).
- Imperativo amable en español ("Cocina…", "Mezcla…", "Sirve…").
- NO uses listas dentro del step. NO uses bullets ni guiones.
- NO repitas la palabra "ingrediente" ni "paso" dentro del texto.`
}

// ============================================================
//  SINGLE PLATE VALIDATOR
// ============================================================
export type SinglePlateValidation =
   | { valid: true; option: PlateOption }
   | { valid: false; reason: ValidationReason; detail?: string }

const FORBIDDEN_WORDS_SP = [
   'fallaste',
   'incorrecto',
   'malo',
   'diagnóstico',
   'enfermedad',
   'cura',
   'medicamento',
   'tonificar',
   'quemar grasa',
   'transformación',
   'antes y después',
   'régimen estricto'
]
const FREE_USE_SP = new Set([
   'sal',
   'pimienta',
   'ajo',
   'limón',
   'limon',
   'agua',
   'hierbas',
   'orégano',
   'tomillo',
   'cilantro',
   'perejil',
   'comino',
   'aceite',
   'vinagre'
])

export const validateSinglePlate = (input: {
   raw: string
   allowedIngredients: string[]
}): SinglePlateValidation => {
   let parsed: Partial<PlateOption>
   try {
      parsed = JSON.parse(input.raw)
   } catch {
      return { valid: false, reason: 'invalid_json' }
   }
   if (
      !parsed ||
      typeof parsed.name !== 'string' ||
      typeof parsed.description !== 'string' ||
      typeof parsed.prep_time_min !== 'number' ||
      typeof parsed.difficulty !== 'string' ||
      !Array.isArray(parsed.steps)
   ) {
      return { valid: false, reason: 'missing_fields' }
   }
   if (parsed.prep_time_min < 5 || parsed.prep_time_min > 60) {
      return { valid: false, reason: 'prep_time_out_of_range' }
   }
   /* Aceptamos rango más amplio que el del prompt para no ser más estrictos
    * que la IA. Prompt: 3-7 steps / 30-180. Validator: 2-10 / 20-220. */
   if (parsed.steps.length < 2 || parsed.steps.length > 10) {
      return { valid: false, reason: 'steps_out_of_range' }
   }
   const badStep = parsed.steps.find(
      (s) => typeof s !== 'string' || s.length < 10 || s.length > 220
   )
   if (badStep !== undefined) return { valid: false, reason: 'step_length' }
   if (!['easy', 'medium', 'hard'].includes(parsed.difficulty)) {
      return { valid: false, reason: 'bad_difficulty' }
   }
   const fullText = [parsed.name, parsed.description, ...parsed.steps].join(' ').toLowerCase()
   const forbidden = FORBIDDEN_WORDS_SP.find((w) => fullText.includes(w))
   if (forbidden) return { valid: false, reason: 'forbidden_words', detail: forbidden }

   const allowed = input.allowedIngredients.map((s) => s.toLowerCase().trim())
   const tokens = fullText.split(/[\s,.;:()¡!¿?\n]+/u).filter((t) => t.length >= 4)
   const unknown = tokens.find(
      (t) =>
         /^[a-záéíóúñ]+$/u.test(t) &&
         !FREE_USE_SP.has(t) &&
         allowed.every((a) => !a.includes(t) && !t.includes(a)) &&
         ['azúcar', 'queso', 'mantequilla', 'crema', 'tocino', 'jamón', 'salchicha'].includes(t)
   )
   if (unknown) return { valid: false, reason: 'unknown_ingredient', detail: unknown }

   return {
      valid: true,
      option: {
         name: parsed.name,
         description: parsed.description,
         prep_time_min: parsed.prep_time_min,
         difficulty: parsed.difficulty as PlateOption['difficulty'],
         steps: parsed.steps as string[]
      }
   }
}
