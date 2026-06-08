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
}

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
}): MacroTarget => {
   const r = MEAL_DISTRIBUTION[input.mealType]
   return {
      kcal: Math.round(input.dailyKcal * r),
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
   ctx: UserContextForMeal
): Ingredient[] => {
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
      if (ing.kcalPer100g <= 0) return false
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
//  COMPONENT SELECTOR
// ============================================================
const MIN_GRAMS = 30
const MAX_GRAMS = 400
const clamp = (g: number) =>
   Math.max(MIN_GRAMS, Math.min(MAX_GRAMS, Math.round(g / 5) * 5))
const pickRandom = <T>(arr: T[], seed: number): T =>
   arr[Math.abs(seed) % arr.length]
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

export const selectComponents = (input: {
   pool: Ingredient[]
   target: MacroTarget
   seed?: number
}): MealComponents | null => {
   const seed = input.seed ?? 0
   const proteins = input.pool.filter((p) => p.category === 'protein')
   const carbs = input.pool.filter((p) => p.category === 'carb')
   const fats = input.pool.filter((p) => p.category === 'fat')
   const veg = input.pool.filter((p) => p.category === 'vegetable')
   const cond = input.pool.filter((p) => p.category === 'condiment')

   if (!proteins.length || !carbs.length || !fats.length) return null
   const protein = pickRandom(proteins, seed)
   const carb = pickRandom(carbs, seed + 1)
   const fat = pickRandom(fats, seed + 2)
   const vegetable = veg.length ? pickRandom(veg, seed + 3) : null

   const proteinG = clamp(
      gramsForMacro(protein, 'protein', input.target.proteinG * 0.7)
   )
   const carbG = clamp(gramsForMacro(carb, 'carb', input.target.carbsG * 0.8))
   const fatG = clamp(gramsForMacro(fat, 'fat', input.target.fatsG * 0.7))
   const vegG = vegetable ? 150 : 0

   const servings = [
      { ingredient: protein, grams: proteinG },
      { ingredient: carb, grams: carbG },
      { ingredient: fat, grams: fatG },
      vegetable ? { ingredient: vegetable, grams: vegG } : null
   ].filter(Boolean) as IngredientServing[]

   const sum = servings.reduce(
      (acc, s) => {
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
      protein: { ingredient: protein, grams: proteinG },
      carb: { ingredient: carb, grams: carbG },
      fat: { ingredient: fat, grams: fatG },
      vegetable: vegetable
         ? { ingredient: vegetable, grams: vegG }
         : { ingredient: protein, grams: 0 },
      condiments: cond.slice(0, 5),
      actualMacros: {
         kcal: Math.round(sum.kcal),
         proteinG: Math.round(sum.proteinG),
         carbsG: Math.round(sum.carbsG),
         fatsG: Math.round(sum.fatsG)
      }
   }
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
