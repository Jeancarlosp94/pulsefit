import type { ItfMealComponents, ItfMealType, ItfUserContextForMeal } from './types'

const MEAL_TYPE_LABEL: Record<ItfMealType, string> = {
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

/** System message exacto (auditado por Lucía + Diego). NO modificar sin firma. */
export const SYSTEM_PROMPT = `Eres un asistente culinario que compone platos usando EXCLUSIVAMENTE los ingredientes y cantidades exactas que se te proporcionan.

REGLAS INVIOLABLES:
- NUNCA agregas ingredientes nuevos.
- NUNCA modificas cantidades.
- NUNCA calculas calorías ni macros (vienen impuestos).
- NUNCA das consejos médicos ni nutricionales.
- NUNCA usas tono punitivo ("debes", "tienes que", "fallaste").
- Devuelves SOLO JSON válido, sin texto adicional, sin markdown.

Tu única tarea es COMBINAR creativamente los ingredientes dados en UN plato con nombre cálido (en español, sin emojis) y pasos claros.`

interface BuildUserPromptInput {
   components: ItfMealComponents
   mealType: ItfMealType
   ctx: ItfUserContextForMeal
   /** Tiempo máximo de prep — derivado de cooksAtHome. */
   maxPrepTime: number
}

const formatIngredient = (name: string, grams: number): string => `- ${name}: ${grams}g`

/**
 * Genera el user message del prompt a Groq. Replica al pie de la letra el
 * template documentado en files/generadores-hibridos.md sección 3.
 */
export const buildUserPrompt = ({
   components,
   mealType,
   ctx,
   maxPrepTime
}: BuildUserPromptInput): string => {
   const mealLabel = MEAL_TYPE_LABEL[mealType]
   const cuisine = REGION_CUISINE[ctx.region] ?? 'mixta'

   const ingredientLines = [
      formatIngredient(components.protein.ingredient.name, components.protein.grams),
      formatIngredient(components.carb.ingredient.name, components.carb.grams),
      formatIngredient(components.fat.ingredient.name, components.fat.grams),
      components.vegetable.grams > 0
         ? formatIngredient(components.vegetable.ingredient.name, components.vegetable.grams)
         : null,
      '- ajo, sal, pimienta, limón, hierbas frescas (libre uso)'
   ]
      .filter(Boolean)
      .join('\n')

   return `Genera 3 platos diferentes para ${mealLabel} usando SOLO estos ingredientes:

${ingredientLines}

Restricciones:
- Tiempo de preparación: máximo ${maxPrepTime} minutos
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

/**
 * Calcula el tiempo máximo de prep según el contexto del usuario.
 */
export const maxPrepTimeForUser = (ctx: ItfUserContextForMeal): number => {
   if (ctx.cooksAtHome === 'rarely') return 15
   if (ctx.cooksAtHome === 'sometimes') return 25
   return 35
}

/**
 * Prompt para UNA opción de plato (no 3). Se usa con `Promise.all` desde el
 * orquestador para generar las 3 opciones en paralelo, cada una con su set
 * de ingredientes distinto.
 */
export const buildSinglePlatePrompt = ({
   components,
   mealType,
   ctx,
   maxPrepTime,
   styleHint
}: BuildUserPromptInput & { styleHint?: string }): string => {
   const mealLabel = MEAL_TYPE_LABEL[mealType]
   const cuisine = REGION_CUISINE[ctx.region] ?? 'mixta'

   const ingredientLines = [
      formatIngredient(components.protein.ingredient.name, components.protein.grams),
      formatIngredient(components.carb.ingredient.name, components.carb.grams),
      formatIngredient(components.fat.ingredient.name, components.fat.grams),
      components.vegetable.grams > 0
         ? formatIngredient(components.vegetable.ingredient.name, components.vegetable.grams)
         : null,
      '- ajo, sal, pimienta, limón, hierbas frescas (libre uso)'
   ]
      .filter(Boolean)
      .join('\n')

   const stylePhrase = styleHint ? `\n- Estilo de cocción sugerido: ${styleHint}.` : ''

   return `Genera UN plato para ${mealLabel} usando SOLO estos ingredientes:

${ingredientLines}

Restricciones:
- Tiempo de preparación: ENTRE 5 y ${Math.min(maxPrepTime, 55)} minutos (estricto)
- Cocina cultural: ${cuisine}
- Dificultad: easy${stylePhrase}

Devuelve JSON EXACTO (un solo plato, NO un array, NO markdown, NO texto extra):

{
  "name": "nombre del plato (cálido, en español, sin emojis, máximo 60 caracteres)",
  "description": "descripción breve, 1 oración, máximo 110 caracteres",
  "prep_time_min": número entero entre 5 y ${Math.min(maxPrepTime, 55)},
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

/** Estilos de cocción distintos para forzar variedad entre las 3 opciones. */
export const STYLE_HINTS = [
   'bowl / plato unificado',
   'al ajillo / estilo casero',
   'salteado al wok / rápido'
] as const
