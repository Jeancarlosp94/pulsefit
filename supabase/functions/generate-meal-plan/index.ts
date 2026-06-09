/**
 * Edge Function: generate-meal-plan (Fase 6)
 *
 * Genera un PLAN COMPLETO multi-día (1-7 días) en una sola operación:
 *   - Por cada meal_type activo según meals_per_day:
 *      · Selecciona 3 sets distintos de componentes (variedad real).
 *      · Genera 3 recetas en PARALELO (Groq → Groq retry → Gemini → fallback).
 *   - Por cada día 1..N:
 *      · Calcula distribución calórica dinámica con jitter ±10% (suma EXACTA = target).
 *      · Asigna la receta correspondiente (rotación A→B→C→A).
 *      · Escala gramos proporcional al kcal del slot ese día.
 *   - Persiste el plan completo en `meal_plans` (RLS por user_id).
 *
 * Reglas preservadas:
 *   - MEAL_DISTRIBUTIONS sigue siendo el anchor base (firmado por Lucía).
 *   - MEAL_MIN_KCAL respeta los mínimos en cada slot.
 *   - selectMultipleComponents + validateSinglePlate idénticos a v2.
 *   - SYSTEM_PROMPT inviolable.
 *   - Rate limit: cuenta como 1 generación (no N×meals).
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonRes } from '../_shared/cors.ts'
import {
   filterIngredientPool,
   selectMultipleComponents,
   buildSinglePlatePrompt,
   SYSTEM_PROMPT,
   STYLE_HINTS,
   maxPrepTimeForUser,
   validateSinglePlate,
   buildMealFallback,
   computeDailyDistribution,
   recipeIndexForDay,
   getActiveMealTypes,
   type MealComponents,
   type MealType,
   type PlateOption,
   type UserContextForMeal,
   type MealsPerDay
} from '../_shared/meal-engine.ts'
import { SEED_INGREDIENTS } from '../_shared/seed-ingredients.ts'
import {
   createGeminiProvider,
   createGroqProvider,
   type LLMProvider
} from '../_shared/llm-providers.ts'

const MAX_GENERATIONS_PER_DAY = 30
const MAX_DAYS = 7

interface RequestBody {
   days?: number
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

interface RecipeResult {
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

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return jsonRes({ msg: 'Sesión inválida, vuelve a entrar 🌱' }, 401)

      const body = (await req.json().catch(() => null)) as RequestBody | null
      const days = Math.max(1, Math.min(MAX_DAYS, body?.days ?? 7))
      const excluded = body?.excluded_ingredient_ids ?? []

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

      // Rate limit (un plan completo cuenta como 1 generación)
      const today = new Date().toISOString().slice(0, 10)
      const { count } = await supabase
         .from('pattern_insights')
         .select('id', { count: 'exact', head: true })
         .eq('user_id', user.id)
         .eq('pattern_type', 'meal_generated')
         .gte('detected_at', `${today}T00:00:00Z`)

      if ((count ?? 0) >= MAX_GENERATIONS_PER_DAY) {
         return jsonRes({ msg: 'Hoy ya generaste muchas opciones, descansemos 🌿' }, 429)
      }

      const mealsPerDayRaw = (p.meals_per_day ?? 3) as number
      const mealsPerDay = (
         [2, 3, 4, 5].includes(mealsPerDayRaw) ? mealsPerDayRaw : 3
      ) as MealsPerDay

      const target = {
         kcal: p.target_kcal,
         proteinG: p.target_protein_g,
         carbsG: p.target_carbs_g,
         fatsG: p.target_fats_g
      }

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

      const activeMealTypes = getActiveMealTypes(mealsPerDay)
      const groqKey = Deno.env.get('GROQ_API_KEY')
      const geminiKey = Deno.env.get('GEMINI_API_KEY')
      const providers: LLMProvider[] = []
      if (groqKey) providers.push(createGroqProvider(groqKey))
      if (geminiKey) providers.push(createGeminiProvider(geminiKey))

      const maxPrepTime = maxPrepTimeForUser(ctx)
      const seed = Math.floor(Math.random() * 100000)

      /* === Fase A: generar 3 recetas POR CADA meal_type, en paralelo total. ===
       * Para cada meal_type activo armamos los 3 sets de componentes con un
       * target BASE (= target_diario × ratio_base de MEAL_DISTRIBUTIONS).
       * Las gramos quedan calculadas para ese baseKcal — luego escalamos en Fase B. */
      const recipesByMealType: Record<string, RecipeResult[]> = {}

      await Promise.all(
         activeMealTypes.map(async (mealType) => {
            const baseDistribution = computeDailyDistribution({
               mealsPerDay,
               dayIndex: 0,
               targetKcal: target.kcal,
               seed: 0 /* baseline sin jitter para gramos canónicas */
            })
            const baseKcal = baseDistribution.kcalByMeal[mealType] ?? 0
            if (baseKcal <= 0) return

            /* Macros base de esa comida (proporcional al ratio kcal). */
            const ratio = baseKcal / target.kcal
            const mealTarget = {
               kcal: baseKcal,
               proteinG: Math.round(target.proteinG * ratio),
               carbsG: Math.round(target.carbsG * ratio),
               fatsG: Math.round(target.fatsG * ratio)
            }

            const pool = filterIngredientPool(SEED_INGREDIENTS, ctx, {
               mealType,
               excludedIngredientIds: excluded
            })
            if (pool.length < 4) {
               recipesByMealType[mealType] = []
               return
            }

            const componentsList = selectMultipleComponents({
               pool,
               target: mealTarget,
               count: 3,
               seed: seed + mealType.length,
               mealType
            })
            if (componentsList.length === 0) {
               recipesByMealType[mealType] = []
               return
            }

            const recipes = await Promise.all(
               componentsList.map((components, idx) =>
                  generateRecipe({
                     providers,
                     components,
                     mealType,
                     ctx,
                     maxPrepTime,
                     styleHint: STYLE_HINTS[idx % STYLE_HINTS.length]
                  })
               )
            )

            /* Si faltan recetas (selectMultiple devolvió < 3), completar con fallback. */
            while (recipes.length < 3 && componentsList.length > 0) {
               const fillIdx = recipes.length
               const comp = componentsList[fillIdx % componentsList.length]
               const fb = buildMealFallback(comp, mealType)
               recipes.push({
                  option: fb[fillIdx % fb.length],
                  components: comp,
                  source: 'fallback'
               })
            }
            recipesByMealType[mealType] = recipes
         })
      )

      /* Si NINGÚN meal_type tuvo recetas, abortamos. */
      const totalRecipes = Object.values(recipesByMealType).reduce(
         (s, r) => s + r.length,
         0
      )
      if (totalRecipes === 0) {
         return jsonRes(
            { msg: 'No tenemos suficientes ingredientes. Probá quitar algún bloqueo 🌿' },
            422
         )
      }

      /* === Fase B: construir daily_schedule. ===
       * Para cada día 0..days-1:
       *   - computeDailyDistribution con jitter → kcal por meal_type.
       *   - Asignar recipeIdx = day % 3.
       *   - Escalar gramos: scaledGrams = baseGrams × (scaledKcal / baseKcal). */
      const dailySchedule = []
      for (let d = 0; d < days; d++) {
         const dist = computeDailyDistribution({
            mealsPerDay,
            dayIndex: d,
            targetKcal: target.kcal,
            seed
         })
         const meals: Record<string, unknown> = {}
         let dayTotal = 0
         for (const mealType of activeMealTypes) {
            const recipes = recipesByMealType[mealType] ?? []
            if (recipes.length === 0) continue
            const recipeIdx = recipeIndexForDay(d, recipes.length)
            const recipe = recipes[recipeIdx]
            const scaledKcal = dist.kcalByMeal[mealType] ?? 0
            const baseDist = computeDailyDistribution({
               mealsPerDay,
               dayIndex: 0,
               targetKcal: target.kcal,
               seed: 0
            })
            const baseKcal = baseDist.kcalByMeal[mealType] ?? scaledKcal
            const scaleFactor = baseKcal > 0 ? scaledKcal / baseKcal : 1

            meals[mealType] = {
               recipeIdx,
               scaledKcal,
               scaledGrams: {
                  protein: Math.round(recipe.components.protein.grams * scaleFactor),
                  carb: Math.round(recipe.components.carb.grams * scaleFactor),
                  fat: Math.round(recipe.components.fat.grams * scaleFactor),
                  vegetable: Math.round(recipe.components.vegetable.grams * scaleFactor)
               }
            }
            dayTotal += scaledKcal
         }
         dailySchedule.push({
            day: d + 1,
            meals,
            totalKcal: dayTotal
         })
      }

      /* Source global. */
      const allRecipes = Object.values(recipesByMealType).flat()
      const usedAi = allRecipes.filter((r) => r.source !== 'fallback').length
      const globalSource: 'ai' | 'fallback' | 'mixed' =
         usedAi === allRecipes.length
            ? 'ai'
            : usedAi === 0
               ? 'fallback'
               : 'mixed'

      /* Serializar recipes para jsonb. */
      const recipesJson: Record<string, unknown> = {}
      for (const [mt, recipes] of Object.entries(recipesByMealType)) {
         recipesJson[mt] = recipes.map((r) => ({
            ...r.option,
            components: summarize(r.components),
            baseKcal: r.components.actualMacros.kcal,
            source: r.source
         }))
      }

      /* Persistir en meal_plans. */
      const { data: inserted, error: insertError } = await supabase
         .from('meal_plans')
         .insert({
            user_id: user.id,
            days,
            meals_per_day: mealsPerDay,
            target_kcal: target.kcal,
            target_protein_g: target.proteinG,
            target_carbs_g: target.carbsG,
            target_fats_g: target.fatsG,
            excluded_ingredient_ids: excluded,
            recipes_by_meal_type: recipesJson,
            daily_schedule: dailySchedule,
            source: globalSource
         })
         .select('*')
         .single()

      if (insertError) {
         console.error('[generate-meal-plan] insert error', insertError)
         return jsonRes({ msg: 'No pudimos guardar el plan, intentemos de nuevo 🌿' }, 500)
      }

      /* Log no bloqueante. */
      void supabase.from('pattern_insights').insert({
         user_id: user.id,
         pattern_type:
            globalSource === 'fallback' ? 'ai_fallback_used' : 'meal_generated',
         description: `Plan ${days} días generado — fuente ${globalSource}`,
         data: {
            plan_id: inserted?.id,
            days,
            meals_per_day: mealsPerDay,
            source: globalSource,
            ai_count: usedAi,
            total_recipes: allRecipes.length
         }
      })

      return jsonRes({ msg: 'OK', data: { plan: inserted } })
   } catch (e) {
      console.error('[generate-meal-plan]', e)
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

/* ============================================================
 *  Helpers
 * ============================================================ */
const generateRecipe = async (input: {
   providers: LLMProvider[]
   components: MealComponents
   mealType: MealType
   ctx: UserContextForMeal
   maxPrepTime: number
   styleHint: string
}): Promise<RecipeResult> => {
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
      if (r1.ok) return { option: r1.option, components: input.components, source: 'ai' }
      const r2 = await tryOnce(
         groq,
         SYSTEM_PROMPT +
            `\n\nATENCIÓN: en el intento anterior fallaste por "${r1.reason}". No repitas ese error.`,
         userPrompt,
         allowedIngredients
      )
      if (r2.ok) return { option: r2.option, components: input.components, source: 'ai_retry' }
   }
   if (gemini) {
      const r3 = await tryOnce(gemini, SYSTEM_PROMPT, userPrompt, allowedIngredients)
      if (r3.ok) return { option: r3.option, components: input.components, source: 'ai_retry' }
   }

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
      const validation = validateSinglePlate({ raw: res.raw, allowedIngredients })
      if (!validation.valid) return { ok: false, reason: `validation:${validation.reason}` }
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
