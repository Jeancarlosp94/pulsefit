import { supabase } from './supabaseConf'
import type { ItfGenerateMealPlanParams, ItfMealPlan } from '@/interface/itfMeals'

/**
 * Invoca la Edge Function `generate-meal-plan` que orquesta:
 *   - 3 recetas por meal_type activo (variedad real entre las 3)
 *   - Distribución dinámica con jitter por día (suma EXACTA = target_kcal)
 *   - Gramos escalados por día (mismo plato, porciones ajustadas)
 *   - Persistencia en tabla meal_plans
 *
 * Timeout más amplio (30s) porque genera N×3 recetas en paralelo.
 */
const FUNCTION_TIMEOUT_MS = 30_000

export const fntGenerateMealPlan = async (
   params: ItfGenerateMealPlanParams
): Promise<ItfMealPlan> => {
   const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
         () =>
            reject(
               Object.assign(
                  new Error(
                     'Tardamos más de lo esperado armando tu plan. Probemos en un momento 🌿'
                  ),
                  { status: 504 }
               )
            ),
         FUNCTION_TIMEOUT_MS
      )
   )
   const invokePromise = supabase.functions.invoke<unknown>('generate-meal-plan', {
      body: params
   })

   const result = await Promise.race([invokePromise, timeoutPromise])
   const { data, error } = result as { data: unknown; error: unknown }

   if (error) throw await normalizeError(error)
   const payload = (data as { data?: { plan?: ItfMealPlan } })?.data?.plan
   if (!payload) throw new Error('Respuesta inesperada del servidor 🌿')
   return payload
}

/**
 * Lee el plan vigente del usuario actual (el más reciente).
 * Devuelve `null` si nunca generó plan.
 */
export const fntGetCurrentMealPlan = async (): Promise<ItfMealPlan | null> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return null

   const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

   if (error) throw new Error(error.message)
   return (data as ItfMealPlan | null) ?? null
}

const normalizeError = async (raw: unknown): Promise<Error> => {
   const e = raw as {
      context?: Response | { response?: Response; status?: number; msg?: string }
      message?: string
   }

   /* FunctionsHttpError del SDK de Supabase expone la Response DIRECTAMENTE en
    * `context`, no en `context.response`. Soportamos ambos formatos. */
   const ctx = e.context
   const directResponse = ctx instanceof Response ? ctx : undefined
   const nestedResponse =
      ctx && !(ctx instanceof Response) && (ctx as { response?: Response }).response
   const nestedMsg = ctx && !(ctx instanceof Response) ? (ctx as { msg?: string }).msg : undefined
   const nestedStatus =
      ctx && !(ctx instanceof Response) ? (ctx as { status?: number }).status : undefined

   if (nestedMsg) {
      const wrapped = new Error(nestedMsg)
      ;(wrapped as { status?: number }).status = nestedStatus
      return wrapped
   }
   const response = directResponse ?? nestedResponse
   if (response instanceof Response) {
      const status = response.status
      let body: Record<string, unknown> | null = null
      let rawText = ''
      try {
         rawText = await response.clone().text()
         body = JSON.parse(rawText)
      } catch {
         body = null
      }
      /* Logueamos a la consola del navegador para diagnóstico (no expone al usuario). */
      console.error('[fntMealPlan] Edge Function error', { status, body, rawText })

      const candidates = ['msg', 'message', 'error', 'error_description', 'details', 'hint']
      const extracted = body
         ? (candidates.map((k) => body?.[k]).find((v) => typeof v === 'string' && v.trim()) as
              | string
              | undefined)
         : undefined

      const msg =
         extracted ||
         (status === 404
            ? 'La función generate-meal-plan no está deployada todavía 🍃'
            : status === 401
              ? 'Tu sesión expiró, vuelve a entrar 🌱'
              : status === 429
                ? 'Hoy ya generaste muchas opciones, descansemos 🌿'
                : status >= 500
                  ? `Error del servidor (${status}). Revisá que la migración meal_plans esté aplicada 🌿`
                  : `No pudimos generar tu plan (HTTP ${status}). Intentemos de nuevo 🌿`)
      const wrapped = new Error(msg)
      ;(wrapped as { status?: number }).status = status
      return wrapped
   }
   const networkMsg = e.message || 'No pudimos conectar con el servidor 📡'
   console.error('[fntMealPlan] Network/unknown error', raw)
   const wrapped = new Error(networkMsg)
   ;(wrapped as { status?: number }).status = 503
   return wrapped
}
