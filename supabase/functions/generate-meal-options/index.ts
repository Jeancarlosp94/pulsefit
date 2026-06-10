/**
 * Edge Function: generate-meal-options (v2)
 *
 * Cambios v2:
 *  - 3 opciones con VARIEDAD REAL (cada una tiene componentes distintos).
 *  - Filtrado por meal_type (huevos/avena en desayuno, pollo/arroz en almuerzo).
 *  - excluded_ingredient_ids para el botón "bloquear" del cliente.
 *  - 3 llamadas IA en PARALELO (Promise.all). Latencia ≈ max(3) ≈ 1-2s.
 *  - Cada opción puede caer a fallback de forma INDEPENDIENTE.
 *
 * Source: files/generadores-hibridos.md
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonRes } from '../_shared/cors.ts'
import {
   computeMealTarget,
   filterIngredientPool,
   selectMultipleComponents,
   buildSinglePlatePrompt,
   SYSTEM_PROMPT,
   STYLE_HINTS,
   maxPrepTimeForUser,
   validateSinglePlate,
   buildMealFallback,
   type MealComponents,
   type MealType,
   type PlateOption,
   type UserContextForMeal
} from '../_shared/meal-engine.ts'
import { SEED_INGREDIENTS } from '../_shared/seed-ingredients.ts'
import {
   createGeminiProvider,
   createGroqProvider,
   type LLMProvider
} from '../_shared/llm-providers.ts'

const MAX_GENERATIONS_PER_DAY = 30

interface RequestBody {
   meal_type: MealType
   override_target?: {
      kcal: number
      proteinG: number
      carbsG: number
      fatsG: number
   }
   excluded_ingredient_ids?: string[]
}

interface ProfileRow {
   id: string
   region: string | null
   goal: string | null
   target_kcal: number | null
   target_protein_g: number | null
   target_carbs_g: number | null
   target_fats_g: number | null
   dietary_restrictions: string[] | null
   allergies: string | null
   disliked_foods: string[] | null
   budget_level: 'low' | 'medium' | 'high' | null
   cooks_at_home: 'yes' | 'sometimes' | 'rarely' | null
   meals_per_day: number | null
   onboarding_completed: boolean
}

interface OptionResult {
   option: PlateOption
   components: MealComponents
   source: 'ai' | 'ai_retry' | 'fallback'
}

serve(async (req) => {
   if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

   try {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return jsonRes({ msg: 'No autorizado' }, 401)

      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
      if (!supabaseUrl || !supabaseAnonKey) {
         return jsonRes({ msg: 'Configuración del servidor incompleta 🌱' }, 500)
      }
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
         global: { headers: { Authorization: authHeader } }
      })
      const {
         data: { user }
      } = await supabase.auth.getUser()
      if (!user) return jsonRes({ msg: 'Sesión inválida, vuelve a entrar 🌱' }, 401)

      const body = (await req.json().catch(() => null)) as RequestBody | null
      if (!body?.meal_type) {
         return jsonRes({ msg: 'Falta el tipo de comida' }, 400)
      }

      const { data: profile, error: profileError } = await supabase
         .from('profiles')
         .select(
            'id, region, goal, target_kcal, target_protein_g, target_carbs_g, target_fats_g, dietary_restrictions, allergies, disliked_foods, budget_level, cooks_at_home, meals_per_day, onboarding_completed'
         )
         .eq('id', user.id)
         .single()

      if (profileError || !profile) {
         return jsonRes({ msg: 'No encontramos tu perfil 🍃' }, 404)
      }
      const p = profile as ProfileRow

      if (!p.onboarding_completed) {
         return jsonRes(
            { msg: 'Termina tu onboarding primero, ahí calculamos tu plan 🌱' },
            400
         )
      }
      if (!p.target_kcal || !p.target_protein_g || !p.target_carbs_g || !p.target_fats_g) {
         return jsonRes({ msg: 'Faltan datos calóricos en tu perfil 🌿' }, 400)
      }

      // Rate limit
      const today = new Date().toISOString().slice(0, 10)
      const { count } = await supabase
         .from('pattern_insights')
         .select('id', { count: 'exact', head: true })
         .eq('user_id', user.id)
         .eq('pattern_type', 'meal_generated')
         .gte('detected_at', `${today}T00:00:00Z`)

      if ((count ?? 0) >= MAX_GENERATIONS_PER_DAY) {
         return jsonRes(
            { msg: 'Hoy ya generaste muchas opciones, descansemos 🌿' },
            429
         )
      }

      // Resolver patrón alimentario
      const mealsPerDayRaw = (p.meals_per_day ?? 3) as number
      const mealsPerDay = (
         [2, 3, 4, 5].includes(mealsPerDayRaw) ? mealsPerDayRaw : 3
      ) as 2 | 3 | 4 | 5

      // Target macroespecífico (con validación de Lucía por mealsPerDay)
      const target = body.override_target ?? {
         kcal: p.target_kcal,
         proteinG: p.target_protein_g,
         carbsG: p.target_carbs_g,
         fatsG: p.target_fats_g
      }
      const mealTarget = computeMealTarget({
         dailyKcal: target.kcal,
         dailyProteinG: target.proteinG,
         dailyCarbsG: target.carbsG,
         dailyFatsG: target.fatsG,
         mealType: body.meal_type,
         mealsPerDay
      })
      if (!mealTarget) {
         return jsonRes(
            {
               msg: `Esa comida no está en tu plan de ${mealsPerDay} comidas 🌿`
            },
            400
         )
      }

      // User context
      const ctx: UserContextForMeal = {
         region: p.region ?? 'LATAM',
         goal: (p.goal as UserContextForMeal['goal']) ?? 'maintain',
         dietaryRestrictions: p.dietary_restrictions ?? [],
         allergies: p.allergies ?? '',
         dislikedFoods: p.disliked_foods ?? [],
         budgetLevel: p.budget_level ?? 'medium',
         cooksAtHome: p.cooks_at_home ?? 'sometimes',
         mealsPerDay
      }

      // Pool filtrado por meal_type + excluded
      const pool = filterIngredientPool(SEED_INGREDIENTS, ctx, {
         mealType: body.meal_type,
         excludedIngredientIds: body.excluded_ingredient_ids ?? []
      })
      if (pool.length < 4) {
         return jsonRes(
            {
               msg:
                  'No tenemos suficientes ingredientes para esa comida. Probá quitar algún bloqueo 🌿'
            },
            422
         )
      }

      // 3 SETS DISTINTOS de componentes (variedad real)
      const seed = Math.floor(Math.random() * 1000)
      const componentsList = selectMultipleComponents({
         pool,
         target: mealTarget,
         count: 3,
         seed,
         mealType,
         favoriteIngredientIds:
            (p as { favorite_ingredient_ids?: string[] | null }).favorite_ingredient_ids ?? []
      })
      if (componentsList.length === 0) {
         return jsonRes(
            { msg: 'No encontramos combinaciones válidas, intentemos de nuevo 🌱' },
            500
         )
      }

      // Cascada IA en PARALELO: 1 llamada por opción, cada una con su set + estilo
      const groqKey = Deno.env.get('GROQ_API_KEY')
      const geminiKey = Deno.env.get('GEMINI_API_KEY')
      const providers: LLMProvider[] = []
      if (groqKey) providers.push(createGroqProvider(groqKey))
      if (geminiKey) providers.push(createGeminiProvider(geminiKey))

      const maxPrepTime = maxPrepTimeForUser(ctx)

      const optionResults = await Promise.all(
         componentsList.map((components, idx) =>
            generateOption({
               providers,
               components,
               mealType: body.meal_type,
               ctx,
               maxPrepTime,
               styleHint: STYLE_HINTS[idx % STYLE_HINTS.length]
            })
         )
      )

      // Garantizar 3 opciones — si selectMultiple devolvió < 3, completar con fallback
      while (optionResults.length < 3 && componentsList.length > 0) {
         const fillIdx = optionResults.length
         const comp = componentsList[fillIdx % componentsList.length]
         const fb = buildMealFallback(comp, body.meal_type)
         optionResults.push({
            option: fb[fillIdx % fb.length],
            components: comp,
            source: 'fallback'
         })
      }

      const usedAi = optionResults.filter((r) => r.source !== 'fallback').length
      const globalSource: 'ai' | 'ai_retry' | 'fallback' | 'mixed' =
         usedAi === 3 ? 'ai' : usedAi === 0 ? 'fallback' : 'mixed'

      // Log no bloqueante
      void supabase.from('pattern_insights').insert({
         user_id: user.id,
         pattern_type:
            globalSource === 'fallback' ? 'ai_fallback_used' : 'meal_generated',
         description: `Generación v2 — fuente global: ${globalSource} (${usedAi}/3 con IA)`,
         data: {
            meal_type: body.meal_type,
            meals_per_day: mealsPerDay,
            source: globalSource,
            excluded_count: body.excluded_ingredient_ids?.length ?? 0,
            ai_count: usedAi,
            target: mealTarget
         }
      })

      return jsonRes({
         msg: 'OK',
         data: {
            options: optionResults.map((r) => ({
               ...r.option,
               components: summarize(r.components),
               source: r.source
            })),
            target: mealTarget,
            source: globalSource
         }
      })
   } catch (e) {
      console.error('[generate-meal-options]', e)
      return jsonRes(
         {
            msg:
               (e instanceof Error ? e.message : null) ||
               'Algo no salió como esperábamos, intentemos de nuevo 🌱'
         },
         500
      )
   }
})

// ============================================================
//  Generar 1 opción: Groq → Groq retry → Gemini → fallback
// ============================================================
const generateOption = async (input: {
   providers: LLMProvider[]
   components: MealComponents
   mealType: MealType
   ctx: UserContextForMeal
   maxPrepTime: number
   styleHint: string
}): Promise<OptionResult> => {
   const userPrompt = buildSinglePlatePrompt({
      components: input.components,
      mealType: input.mealType,
      ctx: input.ctx,
      maxPrepTime: input.maxPrepTime,
      styleHint: input.styleHint
   })
   const allowedIngredients = [
      input.components.protein.ingredient.name,
      input.components.carb.ingredient.name,
      input.components.fat.ingredient.name,
      input.components.vegetable.ingredient.name
   ].filter(Boolean)

   const groq = input.providers.find((p) => p.name === 'groq')
   const gemini = input.providers.find((p) => p.name === 'gemini')

   if (groq) {
      const r1 = await tryOnce(groq, SYSTEM_PROMPT, userPrompt, allowedIngredients)
      if (r1.ok) {
         return { option: r1.option, components: input.components, source: 'ai' }
      }
      const r2 = await tryOnce(
         groq,
         SYSTEM_PROMPT + `\n\nATENCIÓN: en el intento anterior fallaste por "${r1.reason}". No repitas ese error.`,
         userPrompt,
         allowedIngredients
      )
      if (r2.ok) {
         return { option: r2.option, components: input.components, source: 'ai_retry' }
      }
   }
   if (gemini) {
      const r3 = await tryOnce(gemini, SYSTEM_PROMPT, userPrompt, allowedIngredients)
      if (r3.ok) {
         return { option: r3.option, components: input.components, source: 'ai_retry' }
      }
   }

   // Fallback determinístico: usa una de las 3 plantillas
   const fb = buildMealFallback(input.components, input.mealType)
   const styleIdx = STYLE_HINTS.indexOf(input.styleHint as (typeof STYLE_HINTS)[number])
   return {
      option: fb[Math.max(0, styleIdx) % fb.length],
      components: input.components,
      source: 'fallback'
   }
}

const tryOnce = async (
   provider: LLMProvider,
   systemPrompt: string,
   userPrompt: string,
   allowedIngredients: string[]
): Promise<{ ok: true; option: PlateOption } | { ok: false; reason: string }> => {
   try {
      const res = await provider.generate({ systemPrompt, userPrompt })
      const validation = validateSinglePlate({
         raw: res.raw,
         allowedIngredients
      })
      if (!validation.valid) {
         return { ok: false, reason: `validation:${validation.reason}` }
      }
      return { ok: true, option: validation.option }
   } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown'
      return { ok: false, reason: `network:${msg.slice(0, 80)}` }
   }
}

const summarize = (c: MealComponents) => ({
   protein: { id: c.protein.ingredient.id, name: c.protein.ingredient.name, grams: c.protein.grams },
   carb: { id: c.carb.ingredient.id, name: c.carb.ingredient.name, grams: c.carb.grams },
   fat: { id: c.fat.ingredient.id, name: c.fat.ingredient.name, grams: c.fat.grams },
   vegetable:
      c.vegetable.grams > 0
         ? { id: c.vegetable.ingredient.id, name: c.vegetable.ingredient.name, grams: c.vegetable.grams }
         : null,
   actualMacros: c.actualMacros
})
