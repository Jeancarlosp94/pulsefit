/**
 * Edge Function: generate-meal-options
 *
 * Orquesta el generador híbrido de comidas:
 *   1. Auth → load profile.
 *   2. Rate limit check (30 generaciones/usuario/día).
 *   3. nutritional-target → macros target de la comida.
 *   4. ingredient-pool → filtra el seed por perfil.
 *   5. component-selector → arma combinación con cantidades exactas.
 *   6. Cascada IA: Groq → Groq retry → Gemini → fallback templates.
 *   7. Valida la respuesta IA (rechazo si modifica cantidades/ingredientes).
 *   8. Devuelve `{ msg, data: { options, target, components, source } }`.
 *
 * Source of truth: files/generadores-hibridos.md (secciones 2-12).
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonRes } from '../_shared/cors.ts'
import {
   computeMealTarget,
   filterIngredientPool,
   selectComponents,
   buildUserPrompt,
   SYSTEM_PROMPT,
   maxPrepTimeForUser,
   validateMealResponse,
   buildMealFallback,
   type MealType,
   type UserContextForMeal,
   type MealComponents
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

serve(async (req) => {
   // CORS preflight
   if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

   try {
      // 1 — Auth
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

      // 2 — Body
      const body = (await req.json().catch(() => null)) as RequestBody | null
      if (!body?.meal_type) {
         return jsonRes({ msg: 'Falta el tipo de comida' }, 400)
      }

      // 3 — Profile
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

      // 4 — Rate limit (últimas 24h)
      const today = new Date().toISOString().slice(0, 10)
      const { count } = await supabase
         .from('pattern_insights')
         .select('id', { count: 'exact', head: true })
         .eq('user_id', user.id)
         .eq('pattern_type', 'meal_generated')
         .gte('detected_at', `${today}T00:00:00Z`)

      if ((count ?? 0) >= MAX_GENERATIONS_PER_DAY) {
         return jsonRes(
            {
               msg:
                  'Hoy ya generaste muchas opciones, descansemos un poco 🌿. Mañana seguimos.'
            },
            429
         )
      }

      // 5 — Resolver el patrón alimentario del usuario
      const mealsPerDayRaw = (p.meals_per_day ?? 3) as number
      const mealsPerDay = (
         [2, 3, 4, 5].includes(mealsPerDayRaw) ? mealsPerDayRaw : 3
      ) as 2 | 3 | 4 | 5

      // 6 — Target macroespecífico (devuelve null si meal_type no aplica al patrón)
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
               msg: `Esa comida no está en tu plan de ${mealsPerDay} comidas. Cambiá tu patrón o elige otra comida 🌿`
            },
            400
         )
      }

      // 7 — User context
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

      // 7 — Pool + selector
      const pool = filterIngredientPool(SEED_INGREDIENTS, ctx)
      if (pool.length < 4) {
         return jsonRes(
            { msg: 'No tenemos suficientes ingredientes válidos para tu perfil 🌿' },
            422
         )
      }
      const seed = Math.floor(Math.random() * 100)
      const components = selectComponents({ pool, target: mealTarget, seed })
      if (!components) {
         return jsonRes(
            { msg: 'No encontramos una combinación válida, intentemos de nuevo 🌱' },
            500
         )
      }

      // 8 — Prompt para IA
      const userPrompt = buildUserPrompt({
         components,
         mealType: body.meal_type,
         ctx,
         maxPrepTime: maxPrepTimeForUser(ctx)
      })
      const allowedIngredients = [
         components.protein.ingredient.name,
         components.carb.ingredient.name,
         components.fat.ingredient.name,
         components.vegetable.ingredient.name
      ].filter((n) => n)

      // 9 — Cascada: Groq → Groq retry → Gemini → fallback
      const groqKey = Deno.env.get('GROQ_API_KEY')
      const geminiKey = Deno.env.get('GEMINI_API_KEY')
      const providers: LLMProvider[] = []
      if (groqKey) providers.push(createGroqProvider(groqKey))
      if (geminiKey) providers.push(createGeminiProvider(geminiKey))

      const cascade = await runCascade({
         providers,
         systemPrompt: SYSTEM_PROMPT,
         userPrompt,
         allowedIngredients
      })

      // 10 — Si todo falló: fallback determinístico
      const options = cascade.options ?? buildMealFallback(components, body.meal_type)
      const source: 'ai' | 'ai_retry' | 'fallback' = cascade.source

      // 11 — Log para análisis (no bloqueante)
      void supabase.from('pattern_insights').insert({
         user_id: user.id,
         pattern_type:
            source === 'fallback' ? 'ai_fallback_used' : 'meal_generated',
         description:
            source === 'fallback'
               ? `Fallback usado tras ${cascade.attempts} intentos. Última razón: ${cascade.lastFailureReason ?? 'unknown'}`
               : `Generado por ${cascade.providerUsed ?? 'unknown'} en intento ${cascade.attempts}`,
         data: {
            meal_type: body.meal_type,
            source,
            attempts: cascade.attempts,
            provider_used: cascade.providerUsed,
            last_failure_reason: cascade.lastFailureReason,
            target: mealTarget,
            components_summary: summarize(components)
         }
      })

      return jsonRes({
         msg: 'OK',
         data: {
            options,
            target: mealTarget,
            components: summarize(components),
            source
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
//  CASCADA: Groq → Groq retry → Gemini → null (que activa fallback)
// ============================================================
interface CascadeResult {
   options: ReturnType<typeof buildMealFallback> | null
   source: 'ai' | 'ai_retry' | 'fallback'
   attempts: number
   providerUsed: 'groq' | 'gemini' | null
   lastFailureReason: string | null
}

const runCascade = async (input: {
   providers: LLMProvider[]
   systemPrompt: string
   userPrompt: string
   allowedIngredients: string[]
}): Promise<CascadeResult> => {
   const groq = input.providers.find((p) => p.name === 'groq')
   const gemini = input.providers.find((p) => p.name === 'gemini')

   let attempts = 0
   let lastFailureReason: string | null = null

   // Intento 1 — Groq
   if (groq) {
      attempts++
      const r1 = await tryOnce(groq, input.systemPrompt, input.userPrompt, input.allowedIngredients)
      if (r1.ok) {
         return { options: r1.options, source: 'ai', attempts, providerUsed: 'groq', lastFailureReason }
      }
      lastFailureReason = r1.reason

      // Intento 2 — Groq retry con prompt más estricto
      attempts++
      const r2 = await tryOnce(
         groq,
         input.systemPrompt + `\n\nATENCIÓN: en el intento anterior fallaste por "${r1.reason}". No repitas ese error.`,
         input.userPrompt,
         input.allowedIngredients
      )
      if (r2.ok) {
         return { options: r2.options, source: 'ai_retry', attempts, providerUsed: 'groq', lastFailureReason }
      }
      lastFailureReason = r2.reason
   }

   // Intento 3 — Gemini fallback
   if (gemini) {
      attempts++
      const r3 = await tryOnce(gemini, input.systemPrompt, input.userPrompt, input.allowedIngredients)
      if (r3.ok) {
         return { options: r3.options, source: 'ai_retry', attempts, providerUsed: 'gemini', lastFailureReason }
      }
      lastFailureReason = r3.reason
   }

   // Todo falló: orquestador usa plantillas
   return {
      options: null,
      source: 'fallback',
      attempts,
      providerUsed: null,
      lastFailureReason
   }
}

const tryOnce = async (
   provider: LLMProvider,
   systemPrompt: string,
   userPrompt: string,
   allowedIngredients: string[]
): Promise<
   | { ok: true; options: ReturnType<typeof buildMealFallback> }
   | { ok: false; reason: string }
> => {
   try {
      const res = await provider.generate({ systemPrompt, userPrompt })
      const validation = validateMealResponse({
         raw: res.raw,
         allowedIngredients
      })
      if (!validation.valid) {
         return { ok: false, reason: `validation:${validation.reason}` }
      }
      return { ok: true, options: validation.options }
   } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown'
      return { ok: false, reason: `network:${msg.slice(0, 80)}` }
   }
}

// ============================================================
//  HELPERS
// ============================================================
const summarize = (c: MealComponents) => ({
   protein: { name: c.protein.ingredient.name, grams: c.protein.grams },
   carb: { name: c.carb.ingredient.name, grams: c.carb.grams },
   fat: { name: c.fat.ingredient.name, grams: c.fat.grams },
   vegetable:
      c.vegetable.grams > 0
         ? { name: c.vegetable.ingredient.name, grams: c.vegetable.grams }
         : null,
   actualMacros: c.actualMacros
})
