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
      context?: { response?: Response; status?: number; msg?: string }
      message?: string
   }
   if (e.context?.msg) {
      const wrapped = new Error(e.context.msg)
      ;(wrapped as { status?: number }).status = e.context.status
      return wrapped
   }
   const response = e.context?.response
   if (response instanceof Response) {
      const status = response.status
      let body: { msg?: string } | null = null
      try {
         body = await response.clone().json()
      } catch {
         try {
            const text = await response.clone().text()
            body = { msg: text.slice(0, 200) }
         } catch {
            body = null
         }
      }
      const msg =
         body?.msg ||
         (status === 404
            ? 'Esa función todavía no está disponible 🍃'
            : status === 401
              ? 'Tu sesión expiró, vuelve a entrar 🌱'
              : status === 429
                ? 'Hoy ya generaste muchas opciones, descansemos 🌿'
                : 'Algo no salió como esperábamos, intentemos de nuevo 🌿')
      const wrapped = new Error(msg)
      ;(wrapped as { status?: number }).status = status
      return wrapped
   }
   const networkMsg = e.message || 'No pudimos conectar con el servidor 📡'
   const wrapped = new Error(networkMsg)
   ;(wrapped as { status?: number }).status = 503
   return wrapped
}
