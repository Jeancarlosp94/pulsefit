/**
 * Edge Function: generate-workout-session
 *
 * Orquesta el generador híbrido de rutinas:
 *   1. Auth → load profile.
 *   2. Rate limit (10 generaciones/día/usuario).
 *   3. planSession → focus + tiempo + RPE objetivo.
 *   4. filterExercisePool → catálogo filtrado por nivel/lesiones/equipo.
 *   5. selectExercises + prescribePrograma → series/reps/descansos.
 *   6. Cascada IA: Groq → Groq retry → Gemini → fallback templates.
 *   7. Validar respuesta (rechazar si IA modifica prescripción).
 *   8. Devolver { msg, data: { session, prescribed, focus, source } }.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonRes } from '../_shared/cors.ts'
import {
   planSession,
   filterExercisePool,
   selectExercises,
   prescribePrograma,
   SYSTEM_PROMPT,
   buildUserPrompt,
   validateRoutineResponse,
   buildRoutineFallback,
   type FitnessLevel,
   type PrescribedExercise,
   type SessionFocus,
   type UserContextForWorkout
} from '../_shared/routine-engine.ts'
import { SEED_EXERCISES } from '../_shared/seed-exercises.ts'
import {
   createGeminiProvider,
   createGroqProvider,
   type LLMProvider
} from '../_shared/llm-providers.ts'

const MAX_GENERATIONS_PER_DAY = 10

interface RequestBody {
   day_of_week: number
   override_focus?: SessionFocus
   /** Sprint 11.11: modalidad enviada por el cliente desde activePhase. */
   modality?: 'gym' | 'hiit' | 'calistenia' | 'yoga' | 'barre' | 'pilates' | 'crossfit' | 'hybrid'
}

interface ProfileRow {
   id: string
   fitness_level: FitnessLevel | null
   activity_level: string | null
   equipment: string[] | null
   medical_conditions: string[] | null
   available_days: number[] | null
   available_minutes: number | null
   onboarding_completed: boolean
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
      if (!body || typeof body.day_of_week !== 'number') {
         return jsonRes({ msg: 'Falta el día de la semana' }, 400)
      }

      const { data: profile, error: pErr } = await supabase
         .from('profiles')
         .select(
            'id, fitness_level, activity_level, equipment, medical_conditions, available_days, available_minutes, onboarding_completed'
         )
         .eq('id', user.id)
         .single()
      if (pErr || !profile) return jsonRes({ msg: 'No encontramos tu perfil 🍃' }, 404)
      const p = profile as ProfileRow
      if (!p.onboarding_completed) {
         return jsonRes(
            { msg: 'Termina tu onboarding primero, ahí preparamos tu plan 🌱' },
            400
         )
      }

      // Rate limit
      const today = new Date().toISOString().slice(0, 10)
      const { count } = await supabase
         .from('pattern_insights')
         .select('id', { count: 'exact', head: true })
         .eq('user_id', user.id)
         .eq('pattern_type', 'workout_generated')
         .gte('detected_at', `${today}T00:00:00Z`)
      if ((count ?? 0) >= MAX_GENERATIONS_PER_DAY) {
         return jsonRes(
            { msg: 'Hoy ya generaste varias rutinas, descansemos un poco 🌿' },
            429
         )
      }

      const ctx: UserContextForWorkout = {
         activityLevel: p.activity_level ?? 'moderate',
         fitnessLevel: p.fitness_level ?? 'beginner',
         equipment: p.equipment ?? ['bodyweight'],
         injuredZones: p.medical_conditions ?? [],
         availableMinutes: p.available_minutes ?? 30,
         /* weekInBlock: por ahora siempre 1 (Fase 9 calculará bloques reales). */
         weekInBlock: 1,
         /* Sprint 11.11: modalidad del cliente (de su activePhase). */
         modality: body.modality
      }

      // 3. Planner
      const plan = planSession({
         ctx,
         dayOfWeek: body.day_of_week,
         availableDays: p.available_days ?? [body.day_of_week],
         overrideFocus: body.override_focus
      })

      // 4-5. Pool + selector + prescripción
      const pool = filterExercisePool({
         catalog: SEED_EXERCISES,
         ctx,
         focus: plan.focus
      })
      if (pool.length < 3) {
         return jsonRes(
            { msg: 'No hay ejercicios suficientes para tu perfil hoy 🌿' },
            422
         )
      }
      const seed = Math.floor(Math.random() * 100)
      const selected = selectExercises({
         pool,
         sessionMinutes: plan.sessionMinutes,
         seed
      })
      if (!selected || selected.length === 0) {
         return jsonRes(
            { msg: 'No encontramos combinación válida, intentemos de nuevo 🌱' },
            500
         )
      }
      const prescribed = prescribePrograma({
         selected,
         ctx,
         isDeloadWeek: plan.isDeloadWeek,
         prescribedRpe: plan.prescribedRpe
      })

      // 6. Cascada IA
      const groqKey = Deno.env.get('GROQ_API_KEY')
      const geminiKey = Deno.env.get('GEMINI_API_KEY')
      const providers: LLMProvider[] = []
      if (groqKey) providers.push(createGroqProvider(groqKey))
      if (geminiKey) providers.push(createGeminiProvider(geminiKey))

      const cascade = await runCascade({
         providers,
         systemPrompt: SYSTEM_PROMPT,
         userPrompt: buildUserPrompt({ prescribed, focus: plan.focus, ctx }),
         prescribed,
         sessionMinutes: plan.sessionMinutes
      })

      const session =
         cascade.session ??
         buildRoutineFallback({ prescribed, sessionMinutes: plan.sessionMinutes })
      const source: 'ai' | 'ai_retry' | 'fallback' = cascade.source

      // 7. Log
      void supabase.from('pattern_insights').insert({
         user_id: user.id,
         pattern_type:
            source === 'fallback' ? 'ai_fallback_used_workout' : 'workout_generated',
         description:
            source === 'fallback'
               ? `Fallback usado tras ${cascade.attempts} intentos. Última razón: ${cascade.lastFailureReason ?? 'unknown'}`
               : `Generado por ${cascade.providerUsed ?? 'unknown'} en intento ${cascade.attempts}`,
         data: {
            focus: plan.focus,
            source,
            attempts: cascade.attempts,
            provider_used: cascade.providerUsed,
            last_failure_reason: cascade.lastFailureReason,
            is_deload_week: plan.isDeloadWeek,
            prescribed_rpe: plan.prescribedRpe
         }
      })

      return jsonRes({
         msg: 'OK',
         data: {
            session,
            prescribed,
            focus: plan.focus,
            isDeloadWeek: plan.isDeloadWeek,
            prescribedRpe: plan.prescribedRpe,
            source
         }
      })
   } catch (e) {
      console.error('[generate-workout-session]', e)
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
//  CASCADA
// ============================================================
interface CascadeResult {
   session: ReturnType<typeof buildRoutineFallback> | null
   source: 'ai' | 'ai_retry' | 'fallback'
   attempts: number
   providerUsed: 'groq' | 'gemini' | null
   lastFailureReason: string | null
}

const runCascade = async (input: {
   providers: LLMProvider[]
   systemPrompt: string
   userPrompt: string
   prescribed: PrescribedExercise[]
   sessionMinutes: number
}): Promise<CascadeResult> => {
   const groq = input.providers.find((p) => p.name === 'groq')
   const gemini = input.providers.find((p) => p.name === 'gemini')

   let attempts = 0
   let lastFailureReason: string | null = null

   if (groq) {
      attempts++
      const r1 = await tryOnce(
         groq,
         input.systemPrompt,
         input.userPrompt,
         input.prescribed,
         input.sessionMinutes
      )
      if (r1.ok) {
         return {
            session: r1.session,
            source: 'ai',
            attempts,
            providerUsed: 'groq',
            lastFailureReason
         }
      }
      lastFailureReason = r1.reason

      attempts++
      const r2 = await tryOnce(
         groq,
         input.systemPrompt +
            `\n\nATENCIÓN: en el intento anterior fallaste por "${r1.reason}". No repitas ese error.`,
         input.userPrompt,
         input.prescribed,
         input.sessionMinutes
      )
      if (r2.ok) {
         return {
            session: r2.session,
            source: 'ai_retry',
            attempts,
            providerUsed: 'groq',
            lastFailureReason
         }
      }
      lastFailureReason = r2.reason
   }

   if (gemini) {
      attempts++
      const r3 = await tryOnce(
         gemini,
         input.systemPrompt,
         input.userPrompt,
         input.prescribed,
         input.sessionMinutes
      )
      if (r3.ok) {
         return {
            session: r3.session,
            source: 'ai_retry',
            attempts,
            providerUsed: 'gemini',
            lastFailureReason
         }
      }
      lastFailureReason = r3.reason
   }

   return {
      session: null,
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
   prescribed: PrescribedExercise[],
   sessionMinutes: number
): Promise<
   | { ok: true; session: ReturnType<typeof buildRoutineFallback> }
   | { ok: false; reason: string }
> => {
   try {
      const res = await provider.generate({ systemPrompt, userPrompt })
      const validation = validateRoutineResponse({
         raw: res.raw,
         prescribed,
         sessionMinutes
      })
      if (!validation.valid) {
         return { ok: false, reason: `validation:${validation.reason}` }
      }
      return { ok: true, session: validation.session }
   } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown'
      return { ok: false, reason: `network:${msg.slice(0, 80)}` }
   }
}
