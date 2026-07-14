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
   /** Sprint 11.8A: condiciones médicas → filtran simple_carb/high_sodium/high_sugar. */
   medicalConditions?: string[]
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

/* Sprint 11.8A: mirror del filtro de condiciones médicas del cliente. */
const MEDICAL_CONDITION_TO_FORBIDDEN_TAGS: Record<string, string[]> = {
   hipertension: ['high_sodium'],
   hypertension: ['high_sodium'],
   diabetes: ['simple_carb', 'high_sugar'],
   diabetes_type_2: ['simple_carb', 'high_sugar'],
   prediabetes: ['simple_carb', 'high_sugar']
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
   /* Sprint 11.8A: aplicar filtro por condiciones médicas. */
   ;(ctx.medicalConditions ?? []).forEach((c) => {
      const normalized = c.toLowerCase().trim()
      MEDICAL_CONDITION_TO_FORBIDDEN_TAGS[normalized]?.forEach((tag) =>
         forbiddenTags.add(tag)
      )
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

export const SYSTEM_PROMPT = `Eres un asistente culinario LATAM que compone platos usando EXCLUSIVAMENTE los ingredientes y cantidades exactas que se te proporcionan.

REGLAS INVIOLABLES:
- NUNCA agregas ingredientes nuevos.
- NUNCA modificas cantidades.
- NUNCA calculas calorías ni macros (vienen impuestos).
- NUNCA das consejos médicos ni nutricionales.
- NUNCA usas tono punitivo ("debes", "tienes que", "fallaste").
- Devuelves SOLO JSON válido, sin texto adicional, sin markdown.

REGLAS QUÍMICO-CULINARIAS OBLIGATORIAS (Sprint 11.15 — Chef Diego):
- PROTEÍNA EN POLVO (whey/caseína):
  · NUNCA la cocines en caliente (se coagula/quema).
  · NUNCA la mezcles con limón, jugo, vinagre o cítricos (coagula la whey).
  · NUNCA la sazones con sal, ajo, cebolla, pimienta ni hierbas frescas.
  · NUNCA la sirvas seca "sobre" arepa, pan, tortilla, papa, arroz.
  · SIEMPRE va en líquido: batido, smoothie, avena overnight, o en avena YA cocida y templada.
  · Combínala con dulces: canela, cacao, banana, mantequilla de maní, miel pequeña.
- HUEVOS: SIEMPRE cocidos (revueltos, tortilla, frittata, hervidos). NUNCA crudos.
- PESCADO: cocción rápida (5-15 min). >30 min queda seco.
- LECHUGA / PEPINO: SIEMPRE crudos. NUNCA horneados ni salteados.
- Si el ingrediente principal es proteína en polvo, IGNORA cualquier "estilo" sugerido y hazlo batido/smoothie/overnight.

REGLAS DE NOMBRES (Sprint 11.9.1 — apetencia):
- USA nombres apetitosos con adjetivos cálidos LATAM: "casero", "criollo", "al horno", "a la plancha", "sazonado", "tropical", "estilo abuela", "rápido".
- ADAPTA el nombre al ingrediente principal:
  · Pescado → "a la plancha", "al horno con hierbas", "marinado al limón"
  · Pollo → "al sartén", "a la plancha", "estofado casero"
  · Huevos → "tortilla casera", "revueltos al sartén", "frittata"
  · Proteína en polvo → "batido casero", "smoothie", "avena overnight" (NUNCA "salteado")
  · Yogurt → "parfait", "bowl frío", "smoothie cremoso"
- ADAPTA al meal_type:
  · Desayuno → bowl matutino, tazón cremoso, tortilla, pancakes, sándwich casero
  · Almuerzo/Cena → plato principal con técnica explícita (al horno, a la plancha, guisado, criollo)
  · Snack → mini, shake, bowl pequeño, parfait
- EVITA "Salteado de X" como default robótico. Solo úsalo si el plato realmente es un wok/sartén.
- EVITA nombres genéricos tipo "Plato de X" o "Receta con X".
- INSPÍRATE en cocinas LATAM: ceviche, lomo, encebollado, chilaquiles, frittata, arepa, bowl criollo, pasta casera.

REGLAS DE PASOS:
- 3-7 pasos, cada uno de 20-200 caracteres.
- Empieza con verbo en infinitivo o imperativo (cocina, calienta, sazona).
- Sin usar palabras "saludable", "fit", "limpio" — solo describir técnica.

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
/** Procesados/industriales que NO deben aparecer en recetas (sodio, trans, nitritos). */
const FORBIDDEN_PROCESSED_FOODS = [
   'azúcar añadida',
   'azúcar refinada',
   'queso amarillo',
   'queso cheddar',
   'queso procesado',
   'queso americano',
   'margarina',
   'crema de leche',
   'nata para batir',
   'tocino',
   'panceta',
   'jamón serrano',
   'jamón ibérico',
   'jamón crudo',
   'jamón ahumado',
   'salchicha',
   'chorizo',
   'mortadela',
   'salami',
   'pepperoni'
]
void FOOD_HEURISTIC

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
         (s) => typeof s !== 'string' || s.length < 20 || s.length > 250
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
      const processed = FORBIDDEN_PROCESSED_FOODS.find((p) => fullText.includes(p))
      if (processed) return fail('forbidden_words', `option ${i}: ${processed}`)
      /* Antes había check de tokens desconocidos contra una lista de 7 palabras
       * que bloqueaba ingredientes LATAM válidos (queso fresco, mantequilla sin
       * sal, jamón cocido). Reemplazado por FORBIDDEN_PROCESSED_FOODS arriba. */
      void allowed
      void tokenize
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

/* Sprint 11.9 — detección de ingredientes especiales para templates apropiados. */
const isPowderProtein = (name: string): boolean =>
   /polvo|whey|caseina|caseína|proteína en/i.test(name)
const isOatLike = (name: string): boolean => /avena|granola|cereal/i.test(name)
const isEgg = (name: string): boolean => /huevo|huevos/i.test(name)
const isYogurt = (name: string): boolean => /yogurt|yogur/i.test(name)
const isFish = (name: string): boolean =>
   /pescado|tilapia|atún|salmón|salmon|sardina|merluza|filete de/i.test(name)

export const buildMealFallback = (
   components: MealComponents,
   mealType: MealType
): PlateOption[] => {
   const { protein, carb, fat, vegetable } = components
   const hasVeg = vegetable.grams > 0
   const proteinName = protein.ingredient.name
   const carbName = carb.ingredient.name
   const vegName = hasVeg ? vegetable.ingredient.name : ''

   /* === BREAKFAST === */
   if (mealType === 'breakfast') {
      if (isPowderProtein(proteinName)) {
         return [
            {
               name: `Batido casero con ${carbName} y ${proteinName}`,
               description: 'Desayuno rápido y proteico, listo en 5 minutos.',
               prep_time_min: 5,
               difficulty: 'easy',
               steps: [
                  `Coloca ${ingredientName(protein)} en una licuadora con 250ml de agua o leche.`,
                  `Agrega ${ingredientName(carb)} para dar cuerpo y energía sostenida.`,
                  `Suma ${ingredientName(fat)} (mantequilla de maní, almendra, etc.) para saciedad.`,
                  `Licúa 30 segundos hasta cremoso.`,
                  `Sirve frío en un vaso grande, con canela o vainilla al gusto.`
               ]
            },
            {
               name: `Avena overnight con ${proteinName}`,
               description: 'Prepárala la noche anterior, lista al despertar.',
               prep_time_min: 5,
               difficulty: 'easy',
               steps: [
                  `Noche anterior: mezcla ${ingredientName(carb)} con 250ml de leche o agua en frasco.`,
                  `Agrega ${ingredientName(protein)} disuelto.`,
                  `Suma ${ingredientName(fat)} y un toque de canela.`,
                  `Cierra y refrigera mínimo 6 horas.`,
                  `Al despertar: disfruta frío o tibio. Decora con fruta fresca.`
               ]
            },
            {
               name: `Bowl proteico con ${carbName}`,
               description: 'Versión bowl espesa, para comer con cuchara.',
               prep_time_min: 8,
               difficulty: 'easy',
               steps: [
                  `Cocina ${ingredientName(carb)} con poca agua hasta cremoso.`,
                  `Retira del fuego y deja templar 1 minuto.`,
                  `Mezcla ${ingredientName(protein)} bien disuelto (no cocines para no cortar la proteína).`,
                  `Agrega ${ingredientName(fat)} y mezcla.`,
                  `Sirve en bowl con canela, cacao o frutos rojos al gusto.`
               ]
            }
         ]
      }

      if (isEgg(proteinName)) {
         return [
            {
               name: `Tortilla casera de ${proteinName} con ${carbName}`,
               description: 'Desayuno clásico LATAM, sencillo y nutritivo.',
               prep_time_min: 15,
               difficulty: 'easy',
               steps: [
                  `Bate ${ingredientName(protein)} con sal y pimienta hasta integrar.`,
                  `Calienta ${ingredientName(fat)} en sartén antiadherente.`,
                  `Si tienes ${carbName}, cocínalo aparte primero.`,
                  hasVeg
                     ? `Saltea ${ingredientName(vegetable)} brevemente.`
                     : `Agrega cebolla picada para sabor.`,
                  `Vierte los huevos y cocina 3-4 min por lado. Sirve con ${carbName}.`
               ]
            },
            {
               name: `${cap(proteinName)} revueltos con ${carbName} a la plancha`,
               description: 'Estilo desayuno rápido casero.',
               prep_time_min: 12,
               difficulty: 'easy',
               steps: [
                  `Calienta una sartén con ${ingredientName(fat)}.`,
                  `Tuesta ${ingredientName(carb)} aparte.`,
                  `Vierte ${ingredientName(protein)} y mezcla constantemente.`,
                  hasVeg
                     ? `Suma ${ingredientName(vegetable)} picado y mezcla 2 min más.`
                     : `Sazona con sal, pimienta y cebollín.`,
                  `Sirve sobre ${carbName} caliente con un toque de palta.`
               ]
            },
            {
               name: `Bowl matutino con ${proteinName} y ${carbName}`,
               description: 'Desayuno completo en bowl, balanceado.',
               prep_time_min: 12,
               difficulty: 'easy',
               steps: [
                  `Cocina ${ingredientName(carb)} hasta su punto.`,
                  `Hierve o cocina ${ingredientName(protein)} a tu gusto.`,
                  `Calienta ${ingredientName(fat)} y agrégalo crudo al bowl.`,
                  hasVeg
                     ? `Cuece ${ingredientName(vegetable)} al vapor 3 min.`
                     : `Corta tomate fresco y palta.`,
                  `Sirve todo en bowl con sal, pimienta y limón.`
               ]
            }
         ]
      }

      if (isOatLike(carbName)) {
         return [
            {
               name: `Tazón de ${carbName} con ${proteinName}`,
               description: 'Desayuno calentito, cremoso y rendidor.',
               prep_time_min: 10,
               difficulty: 'easy',
               steps: [
                  `Cocina ${ingredientName(carb)} con 250ml de leche o agua.`,
                  `Cuando espese, retira y deja templar.`,
                  `Mezcla ${ingredientName(protein)} bien integrado.`,
                  `Agrega ${ingredientName(fat)} por encima.`,
                  `Termina con canela, miel o frutas. Sirve tibio.`
               ]
            },
            {
               name: `Bowl frío con ${carbName} y ${proteinName}`,
               description: 'Versión refrescante para días calurosos.',
               prep_time_min: 5,
               difficulty: 'easy',
               steps: [
                  `Mezcla ${ingredientName(carb)} con yogurt o leche fría.`,
                  `Agrega ${ingredientName(protein)} en trocitos o disuelto.`,
                  `Suma ${ingredientName(fat)} como topping.`,
                  `Decora con fruta fresca.`,
                  `Sirve inmediatamente, frío.`
               ]
            },
            {
               name: `Pancakes caseros con ${carbName}`,
               description: 'Desayuno especial pero rápido.',
               prep_time_min: 15,
               difficulty: 'medium',
               steps: [
                  `Bate ${ingredientName(protein)} con leche.`,
                  `Suma ${ingredientName(carb)} molida y mezcla.`,
                  `Calienta sartén con ${ingredientName(fat)}.`,
                  `Cocina cucharones pequeños, da vuelta al burbujear.`,
                  `Sirve con fruta y miel.`
               ]
            }
         ]
      }

      /* Default breakfast */
      return [
         {
            name: `Sándwich casero de ${proteinName}`,
            description: 'Desayuno práctico para empezar el día.',
            prep_time_min: 10,
            difficulty: 'easy',
            steps: [
               `Tuesta ${ingredientName(carb)} a tu gusto.`,
               `Cocina ${ingredientName(protein)} a la plancha con ${ingredientName(fat)}.`,
               hasVeg
                  ? `Lava y corta ${ingredientName(vegetable)} fresco.`
                  : `Prepara palta o queso fresco.`,
               `Arma el sándwich con todo.`,
               `Sirve con café o jugo natural.`
            ]
         },
         {
            name: `${cap(proteinName)} al horno con ${carbName}`,
            description: 'Para mañanas con tiempo.',
            prep_time_min: 25,
            difficulty: 'medium',
            steps: [
               `Precalienta horno a 180°C.`,
               `Coloca ${ingredientName(carb)} con ${ingredientName(fat)}.`,
               `Pon ${ingredientName(protein)} encima con sazón.`,
               hasVeg
                  ? `Suma ${ingredientName(vegetable)} alrededor.`
                  : `Agrega rodajas de tomate.`,
               `Hornea 20 min. Sirve caliente.`
            ]
         },
         {
            name: `Bowl matutino balanceado`,
            description: 'Desayuno completo en bowl.',
            prep_time_min: 12,
            difficulty: 'easy',
            steps: [
               `Cocina ${ingredientName(carb)}.`,
               `Prepara ${ingredientName(protein)}.`,
               hasVeg
                  ? `Saltea ${ingredientName(vegetable)}.`
                  : `Lava fruta fresca.`,
               `Calienta ${ingredientName(fat)}.`,
               `Sirve en bowl, condimenta a gusto.`
            ]
         }
      ]
   }

   /* === SNACK === */
   if (mealType === 'snack_am' || mealType === 'snack_pm') {
      if (isPowderProtein(proteinName)) {
         return [
            {
               name: `Shake rápido con ${proteinName}`,
               description: 'Snack proteico en 2 minutos.',
               prep_time_min: 3,
               difficulty: 'easy',
               steps: [
                  `Mezcla ${ingredientName(protein)} con 200ml de agua o leche fría.`,
                  `Agrega ${ingredientName(carb)}.`,
                  `Suma ${ingredientName(fat)}.`,
                  `Bate 20 segundos.`,
                  `Sirve frío.`
               ]
            },
            {
               name: `Smoothie de fruta con ${proteinName}`,
               description: 'Refrescante y nutritivo, ideal post-entreno.',
               prep_time_min: 5,
               difficulty: 'easy',
               steps: [
                  `Licúa ${ingredientName(carb)} con ${ingredientName(protein)}.`,
                  `Agrega 200ml de leche o agua de coco.`,
                  `Suma ${ingredientName(fat)}.`,
                  `Licúa hasta cremoso.`,
                  `Sirve frío con hielo.`
               ]
            },
            {
               name: `Bowl proteico en 5 min`,
               description: 'Versión bowl para cuchara.',
               prep_time_min: 5,
               difficulty: 'easy',
               steps: [
                  `Mezcla ${ingredientName(carb)} con yogurt o leche.`,
                  `Agrega ${ingredientName(protein)} disuelto.`,
                  `Suma ${ingredientName(fat)} como topping.`,
                  `Decora con fruta o cacao.`,
                  `Sirve frío.`
               ]
            }
         ]
      }

      if (isYogurt(proteinName)) {
         return [
            {
               name: `Parfait de yogurt con ${carbName}`,
               description: 'Snack en capas, fresco.',
               prep_time_min: 5,
               difficulty: 'easy',
               steps: [
                  `En vaso alterna capas de ${ingredientName(protein)}.`,
                  `Suma ${ingredientName(carb)}.`,
                  `Agrega ${ingredientName(fat)}.`,
                  `Decora con fruta fresca.`,
                  `Sirve frío inmediatamente.`
               ]
            },
            {
               name: `Bowl frío de yogurt con ${carbName}`,
               description: 'Snack saludable y rápido.',
               prep_time_min: 4,
               difficulty: 'easy',
               steps: [
                  `Coloca ${ingredientName(protein)} en bowl.`,
                  `Mezcla con ${ingredientName(carb)}.`,
                  `Suma ${ingredientName(fat)}.`,
                  `Endulza con miel o canela.`,
                  `Sirve frío.`
               ]
            },
            {
               name: `Smoothie cremoso`,
               description: 'Versión líquida para llevar.',
               prep_time_min: 4,
               difficulty: 'easy',
               steps: [
                  `Licúa ${ingredientName(protein)} con ${ingredientName(carb)}.`,
                  `Suma fruta fresca o congelada.`,
                  `Agrega ${ingredientName(fat)}.`,
                  `Bate hasta cremoso.`,
                  `Sirve frío.`
               ]
            }
         ]
      }

      /* Default snack */
      return [
         {
            name: `Mini sándwich casero con ${proteinName}`,
            description: 'Snack práctico para llevar.',
            prep_time_min: 8,
            difficulty: 'easy',
            steps: [
               `Tuesta ${ingredientName(carb)} pequeño.`,
               `Prepara ${ingredientName(protein)} simple.`,
               `Suma ${ingredientName(fat)}.`,
               `Arma el snack en formato mini.`,
               `Disfruta a temperatura ambiente.`
            ]
         },
         {
            name: `Bowl pequeño con ${proteinName}`,
            description: 'Versión bowl rápida.',
            prep_time_min: 6,
            difficulty: 'easy',
            steps: [
               `Prepara ${ingredientName(protein)} simple.`,
               `Combina con ${ingredientName(carb)}.`,
               `Suma ${ingredientName(fat)}.`,
               `Sazona con sal y pimienta.`,
               `Disfruta tibio o frío.`
            ]
         },
         {
            name: `Mezcla casera de ${proteinName} y ${carbName}`,
            description: 'Snack rápido y saciante.',
            prep_time_min: 5,
            difficulty: 'easy',
            steps: [
               `Combina ${ingredientName(protein)} con ${ingredientName(carb)}.`,
               `Agrega ${ingredientName(fat)} (semillas, frutos secos).`,
               `Sazona suave.`,
               `Mezcla todo.`,
               `Sirve.`
            ]
         }
      ]
   }

   /* === LUNCH / DINNER === */
   if (isFish(proteinName)) {
      return [
         {
            name: `${cap(proteinName)} a la plancha con ${carbName}`,
            description: `Plato fresco, ideal para ${MEAL_LABEL_FB[mealType]}.`,
            prep_time_min: 20,
            difficulty: 'easy',
            steps: [
               `Sazona ${ingredientName(protein)} con sal, pimienta, ajo y limón.`,
               `Cocina ${ingredientName(carb)} aparte.`,
               `Calienta sartén con ${ingredientName(fat)} y cocina pescado 3-4 min por lado.`,
               hasVeg
                  ? `Saltea ${ingredientName(vegetable)} con ajo.`
                  : `Prepara ensalada simple con limón.`,
               `Sirve el pescado sobre ${carbName} con limón fresco.`
            ]
         },
         {
            name: `${cap(proteinName)} al horno con vegetales`,
            description: 'Versión asada, jugosa y aromática.',
            prep_time_min: 30,
            difficulty: 'medium',
            steps: [
               `Precalienta horno a 200°C.`,
               `Coloca ${ingredientName(protein)} en bandeja con ${ingredientName(fat)}.`,
               `Sazona con limón, hierbas y ajo.`,
               hasVeg
                  ? `Suma ${ingredientName(vegetable)} alrededor.`
                  : `Agrega rodajas de limón.`,
               `Hornea 15-20 min. Sirve con ${carbName}.`
            ]
         },
         {
            name: `Bowl marinero con ${proteinName}`,
            description: 'Versión bowl, completa y fresca.',
            prep_time_min: 22,
            difficulty: 'easy',
            steps: [
               `Cocina ${ingredientName(carb)}.`,
               `Sazona ${ingredientName(protein)} con limón.`,
               `Cocina con ${ingredientName(fat)} 3-4 min por lado.`,
               hasVeg
                  ? `Prepara ${ingredientName(vegetable)} al vapor.`
                  : `Suma palta y tomate.`,
               `Arma en bowl con limón y cilantro.`
            ]
         }
      ]
   }

   /* Default lunch/dinner — bowl casero, criollo, rápido. */
   const adjectives =
      mealType === 'lunch' ? ['casero', 'criollo', 'al sartén'] : ['rápido', 'casero', 'sazonado']

   return [
      {
         name: `Bowl ${adjectives[0]} de ${proteinName} con ${carbName}`,
         description: `Plato balanceado para ${MEAL_LABEL_FB[mealType]}, fácil y sabroso.`,
         prep_time_min: 20,
         difficulty: 'easy',
         steps: [
            `Cocina ${ingredientName(carb)} con sal hasta su punto.`,
            `Sazona ${ingredientName(protein)} con sal, pimienta, ajo y comino.`,
            `Calienta ${ingredientName(fat)} y cocina la proteína 5-7 min.`,
            hasVeg
               ? `Saltea ${ingredientName(vegetable)} hasta tierno-crocante.`
               : `Prepara hierbas frescas y limón.`,
            `Sirve todo en bowl con limón fresco.`
         ]
      },
      {
         name: `${cap(proteinName)} ${adjectives[1]} con ${carbName}${hasVeg ? ` y ${vegName}` : ''}`,
         description: 'Versión casera y reconfortante.',
         prep_time_min: 25,
         difficulty: 'easy',
         steps: [
            `Pica ajo y cebolla finos.`,
            `Cocina ${ingredientName(carb)} hasta su punto.`,
            `Dora ajo y cebolla con ${ingredientName(fat)}.`,
            `Suma ${ingredientName(protein)} y cocina 5-7 min.`,
            hasVeg
               ? `Agrega ${ingredientName(vegetable)} en los últimos 4 min.`
               : `Termina con limón y comino.`,
            `Sirve en plato dividido con ${carbName}.`
         ]
      },
      {
         name: `${cap(proteinName)} ${adjectives[2]} con ${carbName}${hasVeg ? ` y ${vegName}` : ''}`,
         description: 'Plato rápido para días ocupados.',
         prep_time_min: 18,
         difficulty: 'easy',
         steps: [
            `Cocina ${ingredientName(carb)} aparte y reserva.`,
            `Corta ${proteinName} en cubos o tiras.`,
            `Calienta ${ingredientName(fat)} bien caliente.`,
            `Dora ${proteinName} con sal y especias.`,
            hasVeg
               ? `Suma ${ingredientName(vegetable)} y saltea 2-3 min.`
               : `Termina con cebollín y limón.`,
            `Sirve sobre ${carbName} con hierbas.`
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
   favoriteIngredientIds?: string[]
}): MealComponents[] => {
   const count = input.count ?? 3
   const seed = input.seed ?? 0
   const mealType = input.mealType
   const favIds = input.favoriteIngredientIds ?? []
   const results: MealComponents[] = []
   const usedProtein = new Set<string>()
   const usedCarb = new Set<string>()
   const usedFat = new Set<string>()
   const usedVeg = new Set<string>()

   /* Boost de favoritos: poner los favoritos primero en cada categoría. */
   const isFav = (id: string) => favIds.includes(id)
   const sortFavFirst = (a: Ingredient, b: Ingredient) =>
      (isFav(a.id) ? 0 : 1) - (isFav(b.id) ? 0 : 1)
   const allProteins = input.pool.filter((p) => p.category === 'protein').slice().sort(sortFavFirst)
   const allCarbs = input.pool.filter((p) => p.category === 'carb').slice().sort(sortFavFirst)
   const allFats = input.pool.filter((p) => p.category === 'fat').slice().sort(sortFavFirst)
   const allVeg = input.pool.filter((p) => p.category === 'vegetable').slice().sort(sortFavFirst)

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

/* ============================================================
 *  CHEF DIEGO — Sprint 11.15 (mirror del cliente)
 *  Reviewer determinístico de platos antes de mostrarlos al usuario.
 * ============================================================ */

interface DenoChefRule {
   name: string
   check: (opt: PlateOption) => string | null
}

const DENO_CHEF_RULES: DenoChefRule[] = [
   {
      name: 'polvo_en_caliente',
      check: (opt) => {
         const text = [opt.name, ...opt.steps].join(' ').toLowerCase()
         const HOT =
            '\\b(?:cocina|cocinar|saltea|saltear|dora|dorar|hornea|hornear|calienta|calentar|fríe|fríen|freír|frita|fritas|frito|fritos|tuesta|tostar|asa|asar|guisa|guisar)\\b'
         const powder = /\b(?:polvo|whey|caseina|caseína)\b/i
         if (!powder.test(text) || !new RegExp(HOT, 'i').test(text)) return null
         const near = new RegExp(`\\b(?:polvo|whey|caseina|caseína)\\b[^.]{0,80}${HOT}`, 'i')
         const inverse = new RegExp(`${HOT}[^.]{0,80}\\b(?:polvo|whey|caseina|caseína)\\b`, 'i')
         if (near.test(text) || inverse.test(text)) {
            return 'proteína en polvo no se cocina en caliente (se coagula/quema)'
         }
         return null
      }
   },
   {
      name: 'polvo_con_acido',
      check: (opt) => {
         const powder = /(polvo|whey|caseina|caseína)/i
         const acid = /(limón|limon|jugo de|vinagre|cítric|ácido cítrico)/i
         for (const step of opt.steps) {
            const s = step.toLowerCase()
            if (powder.test(s) && acid.test(s)) {
               return 'proteína en polvo + limón/ácido coagula la whey'
            }
         }
         return null
      }
   },
   {
      name: 'polvo_sazonado_salado',
      check: (opt) => {
         const powder = /(polvo|whey|caseina|caseína)/i
         const salty =
            /(hierbas frescas|perejil|cilantro|orégano|albahaca|ajo|sal\s|pimienta|cebolla)/i
         for (const step of opt.steps) {
            const s = step.toLowerCase()
            if (powder.test(s) && salty.test(s)) {
               return 'la proteína en polvo se combina con dulces/canela, no con salados'
            }
         }
         return null
      }
   },
   {
      name: 'polvo_sobre_plato',
      check: (opt) => {
         const text = [opt.name, ...opt.steps].join(' ').toLowerCase()
         const bad =
            /\b(?:polvo|whey|caseina|caseína)\b[^.]{0,40}\b(?:sobre|encima de|con)\b[^.]{0,15}\b(?:arepa|pan|tortilla|papa|arroz|pasta|filete)\b/i
         if (bad.test(text)) return 'proteína en polvo no se sirve seca sobre un plato'
         return null
      }
   },
   {
      name: 'nombre_robotico',
      check: (opt) => {
         const full = `${opt.name} ${opt.description}`.toLowerCase()
         if (/(plato unificado|combinaci[óo]n de|receta de)/i.test(full)) {
            return 'nombre/descripción robótico ("plato unificado", "combinación de")'
         }
         return null
      }
   },
   {
      name: 'verdura_cruda_cocida',
      check: (opt) => {
         const text = opt.steps.join(' ').toLowerCase()
         const VEG = '\\b(?:lechuga|pepino)\\b'
         const HOT =
            '\\b(?:hornea|hornear|saltea|saltear|cocina|cocinar|dora|dorar|fríe|fríen|freír|tuesta|tostar|asa|asar)\\b'
         const forward = new RegExp(`${VEG}[^.]{0,60}${HOT}`, 'i')
         const reverse = new RegExp(`${HOT}[^.]{0,60}${VEG}`, 'i')
         if (forward.test(text) || reverse.test(text)) {
            return 'lechuga/pepino no se cocinan en caliente'
         }
         return null
      }
   }
]

export interface DenoChefReviewResult {
   approved: boolean
   reason?: string
   ruleName?: string
}

export const reviewByChef = (option: PlateOption): DenoChefReviewResult => {
   for (const rule of DENO_CHEF_RULES) {
      const violation = rule.check(option)
      if (violation) return { approved: false, reason: violation, ruleName: rule.name }
   }
   return { approved: true }
}

export const buildSinglePlatePrompt = (input: {
   components: MealComponents
   mealType: MealType
   ctx: UserContextForMeal
   maxPrepTime: number
   styleHint?: string
}): string => {
   const mealLabel = MEAL_TYPE_LABEL_FB[input.mealType]
   const cuisine = REGION_CUISINE_FB[input.ctx.region] ?? 'mixta'

   /* Sprint 11.15: si la proteína es polvo, IGNORAR styleHint y forzar
    * batido/smoothie/overnight. Bug root cause del "Bowl Criollo con arepa+polvo+limón". */
   const proteinNameLower = input.components.protein.ingredient.name.toLowerCase()
   const isPowderProtein = /polvo|whey|caseina|caseína|proteína en/.test(proteinNameLower)
   const effectiveStyleHint = isPowderProtein
      ? 'batido / smoothie / avena overnight (proteína en polvo NO se cocina, NO va con limón, NO va con sal)'
      : input.styleHint

   const lines = [
      `- ${input.components.protein.ingredient.name}: ${input.components.protein.grams}g`,
      `- ${input.components.carb.ingredient.name}: ${input.components.carb.grams}g`,
      `- ${input.components.fat.ingredient.name}: ${input.components.fat.grams}g`,
      input.components.vegetable.grams > 0
         ? `- ${input.components.vegetable.ingredient.name}: ${input.components.vegetable.grams}g`
         : null,
      isPowderProtein
         ? '- agua, leche, canela, cacao, vainilla, miel pequeña (libre uso para el batido)'
         : '- ajo, sal, pimienta, limón, hierbas frescas (libre uso)'
   ]
      .filter(Boolean)
      .join('\n')
   const stylePhrase = effectiveStyleHint
      ? `\n- Estilo de cocción sugerido: ${effectiveStyleHint}.`
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
      (s) => typeof s !== 'string' || s.length < 20 || s.length > 250
   )
   if (badStep !== undefined) return { valid: false, reason: 'step_length' }
   if (!['easy', 'medium', 'hard'].includes(parsed.difficulty)) {
      return { valid: false, reason: 'bad_difficulty' }
   }
   const fullText = [parsed.name, parsed.description, ...parsed.steps].join(' ').toLowerCase()
   const forbidden = FORBIDDEN_WORDS_SP.find((w) => fullText.includes(w))
   if (forbidden) return { valid: false, reason: 'forbidden_words', detail: forbidden }
   const processed = FORBIDDEN_PROCESSED_FOODS.find((p) => fullText.includes(p))
   if (processed) return { valid: false, reason: 'forbidden_words', detail: processed }

   /* Sprint 11.15: Chef Diego revisa el plato. */
   const candidate: PlateOption = {
      name: parsed.name,
      description: parsed.description,
      prep_time_min: parsed.prep_time_min,
      difficulty: parsed.difficulty as PlateOption['difficulty'],
      steps: parsed.steps as string[]
   }
   const chefReview = reviewByChef(candidate)
   if (!chefReview.approved) {
      return {
         valid: false,
         reason: 'forbidden_words',
         detail: `Chef Diego rechazó — ${chefReview.reason}`
      }
   }

   /* Quitamos el check de tokens (bloqueaba ingredientes LATAM válidos). */
   void input.allowedIngredients
   void FREE_USE_SP

   return { valid: true, option: candidate }
}

// ============================================================
//  WEEKLY DISTRIBUTOR (Fase 6) — sync con weekly-distributor.ts
// ============================================================
const JITTER_PCT = 0.1

const deterministicNoise = (seed: number, dayIndex: number, mealIdx: number): number => {
   const x = Math.sin(seed * 12.9898 + dayIndex * 78.233 + mealIdx * 37.719) * 43758.5453
   return (x - Math.floor(x)) * 2 - 1
}

export interface DailyDistribution {
   kcalByMeal: Partial<Record<MealType, number>>
   percentByMeal: Partial<Record<MealType, number>>
}

export const computeDailyDistribution = (input: {
   mealsPerDay: MealsPerDay
   dayIndex: number
   targetKcal: number
   seed: number
}): DailyDistribution => {
   const base = MEAL_DISTRIBUTIONS[input.mealsPerDay]
   const mealTypes = Object.keys(base) as MealType[]

   const jittered: Record<string, number> = {}
   mealTypes.forEach((mt, idx) => {
      const noise = deterministicNoise(input.seed, input.dayIndex, idx)
      const factor = 1 + noise * JITTER_PCT
      jittered[mt] = (base[mt] ?? 0) * factor
   })

   const pcts: Record<string, number> = {}
   let total = mealTypes.reduce((s, mt) => s + jittered[mt], 0)
   mealTypes.forEach((mt) => { pcts[mt] = jittered[mt] / total })

   for (let iter = 0; iter < 8; iter++) {
      const violators: MealType[] = []
      const valid: MealType[] = []
      mealTypes.forEach((mt) => {
         const k = pcts[mt] * input.targetKcal
         const min = MEAL_MIN_KCAL[mt] ?? 0
         if (k < min) violators.push(mt)
         else valid.push(mt)
      })
      if (violators.length === 0) break
      if (valid.length === 0) {
         mealTypes.forEach((mt) => { pcts[mt] = (base[mt] ?? 0) })
         total = mealTypes.reduce((s, mt) => s + pcts[mt], 0)
         mealTypes.forEach((mt) => { pcts[mt] = pcts[mt] / total })
         break
      }
      const reservedKcal = violators.reduce((s, mt) => s + (MEAL_MIN_KCAL[mt] ?? 0), 0)
      const remainingKcal = Math.max(0, input.targetKcal - reservedKcal)
      const validSum = valid.reduce((s, mt) => s + pcts[mt], 0)
      violators.forEach((mt) => { pcts[mt] = (MEAL_MIN_KCAL[mt] ?? 0) / input.targetKcal })
      valid.forEach((mt) => {
         pcts[mt] = validSum > 0 ? (pcts[mt] / validSum) * (remainingKcal / input.targetKcal) : 0
      })
   }

   const kcal: Partial<Record<MealType, number>> = {}
   mealTypes.forEach((mt) => { kcal[mt] = Math.round(pcts[mt] * input.targetKcal) })

   const roundedSum = mealTypes.reduce((s, mt) => s + (kcal[mt] ?? 0), 0)
   const drift = input.targetKcal - roundedSum
   if (drift !== 0) {
      const lastMeal = mealTypes[mealTypes.length - 1]
      kcal[lastMeal] = (kcal[lastMeal] ?? 0) + drift
   }

   const finalPct: Partial<Record<MealType, number>> = {}
   mealTypes.forEach((mt) => { finalPct[mt] = (kcal[mt] ?? 0) / input.targetKcal })

   return { kcalByMeal: kcal, percentByMeal: finalPct }
}

export const recipeIndexForDay = (dayIndex: number, recipeCount: number): number =>
   ((dayIndex % recipeCount) + recipeCount) % recipeCount
