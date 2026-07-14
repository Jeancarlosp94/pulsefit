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
export const SYSTEM_PROMPT = `Eres un asistente culinario LATAM que compone platos usando EXCLUSIVAMENTE los ingredientes y cantidades exactas que se te proporcionan.

REGLAS INVIOLABLES:
- NUNCA agregas ingredientes nuevos.
- NUNCA modificas cantidades.
- NUNCA repitas gramos en los pasos de preparación (los pasos usan "el tofu", "la banana", NUNCA "220g de tofu" — el usuario ya tiene la lista con gramos exactos).
- NUNCA calculas calorías ni macros (vienen impuestos).
- NUNCA das consejos médicos ni nutricionales.
- NUNCA usas tono punitivo ("debes", "tienes que", "fallaste").
- Devuelves SOLO JSON válido, sin texto adicional, sin markdown.

REGLAS QUÍMICO-CULINARIAS OBLIGATORIAS (Sprint 11.15 — Chef Diego):
- PROTEÍNA EN POLVO (whey/caseína):
  · NUNCA la cocines en caliente (se coagula/quema).
  · NUNCA la mezcles con limón, jugo, vinagre o cítricos (coagula la whey).
  · NUNCA la sazones con sal, ajo, cebolla, pimienta ni hierbas frescas.
  · NUNCA la sirvas seca "sobre" un plato cocido (arepa, pan, tortilla, papa, arroz).
  · SIEMPRE va en líquido: batido, smoothie, avena overnight, o mezclada en avena YA cocida y templada.
  · Combínala con dulces: canela, cacao, banana, mantequilla de maní, miel pequeña, frutos rojos.
- HUEVOS: SIEMPRE se cocinan (revueltos, tortilla, frittata, hervidos, escalfados). NUNCA crudos.
- PESCADO: cocción rápida (5-15 min según técnica). >30 min queda seco.
- LECHUGA / PEPINO: SIEMPRE crudos. NUNCA se hornean ni se saltean.
- Si el ingrediente principal es proteína en polvo, IGNORA cualquier "estilo de cocción" sugerido y hazlo batido/smoothie/overnight.

REGLAS DE NOMBRES (Sprint 11.9.1 — apetencia):
- USA nombres apetitosos con adjetivos cálidos LATAM: "casero", "criollo", "al horno", "a la plancha", "sazonado", "tropical", "estilo abuela", "rápido".
- ADAPTA el nombre al ingrediente principal:
  · Pescado → "a la plancha", "al horno con hierbas", "marinado al limón"
  · Pollo → "al sartén", "a la plancha", "estofado casero"
  · Huevos → "tortilla casera", "revueltos al sartén", "frittata"
  · Proteína en polvo → "batido casero", "smoothie", "avena overnight" (NUNCA "salteado", NUNCA "bowl criollo con polvo")
  · Yogurt → "parfait", "bowl frío", "smoothie cremoso"
- ADAPTA al meal_type:
  · Desayuno → bowl matutino, tazón cremoso, tortilla, pancakes, sándwich casero
  · Almuerzo/Cena → plato principal con técnica explícita (al horno, a la plancha, guisado, criollo)
  · Snack → mini, shake, bowl pequeño, parfait
- EVITA "Salteado de X" como default robótico. Solo úsalo si el plato realmente es un wok/sartén.
- EVITA nombres genéricos tipo "Plato de X", "Receta con X", "Plato unificado con X", "Combinación de X".
- INSPÍRATE en cocinas LATAM: ceviche, lomo, encebollado, chilaquiles, frittata, arepa, bowl criollo (SOLO con ingredientes reales, NO con polvo), pasta casera.

REGLAS DE PASOS:
- 3-7 pasos, cada uno de 20-200 caracteres.
- Empieza con verbo en infinitivo o imperativo (cocina, calienta, sazona).
- Sin usar palabras "saludable", "fit", "limpio" — solo describir técnica.

Tu única tarea es COMBINAR creativamente los ingredientes dados en UN plato con nombre cálido (en español, sin emojis) y pasos claros. Un Chef revisará tu propuesta y rechazará platos absurdos.`

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

   /* Sprint 11.15: si la proteína es polvo/whey, IGNORAR el styleHint del
    * orquestador y forzar "batido/smoothie/overnight". Fue la causa raíz del
    * bug "Bowl Criollo con arepa + polvo + limón". */
   const proteinNameLower = components.protein.ingredient.name.toLowerCase()
   const isPowderProtein = /polvo|whey|caseina|caseína|proteína en/.test(proteinNameLower)
   const effectiveStyleHint = isPowderProtein
      ? 'batido / smoothie / avena overnight (proteína en polvo NO se cocina, NO va con limón, NO va con sal)'
      : styleHint

   const ingredientLines = [
      formatIngredient(components.protein.ingredient.name, components.protein.grams),
      formatIngredient(components.carb.ingredient.name, components.carb.grams),
      formatIngredient(components.fat.ingredient.name, components.fat.grams),
      components.vegetable.grams > 0
         ? formatIngredient(components.vegetable.ingredient.name, components.vegetable.grams)
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
- NO repitas la palabra "ingrediente" ni "paso" dentro del texto.
- **PROHIBIDO mencionar gramos, "g", "gr" o "gramos" en los pasos.** El usuario ya ve la lista arriba con las cantidades exactas. Los pasos usan sustantivos con artículo ("el tofu", "la banana", "el aceite"), NO números con unidad.
- Si mencionas cantidades, usa referencias culinarias sin gramos: "un chorrito de aceite", "una pizca de sal", "unos cubos de tomate".`
}

/** Estilos de cocción distintos para forzar variedad entre las 3 opciones. */
export const STYLE_HINTS = [
   'bowl / plato unificado',
   'al ajillo / estilo casero',
   'salteado al wok / rápido'
] as const
