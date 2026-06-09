import { supabase } from './supabaseConf'
import type {
   ItfGenerateWorkoutParams,
   ItfWorkoutGenerationResponse
} from '@/interface/itfWorkouts'

/**
 * Invoca la Edge Function `generate-workout-session` que orquesta el motor
 * híbrido de rutinas (planner + selector + Groq → Gemini → fallback).
 *
 * El cliente NUNCA llama a Groq/Gemini directamente.
 *
 * Maneja `FunctionsHttpError` extrayendo el msg compasivo del cuerpo de la
 * respuesta para que `useErrorHandling` muestre el mensaje exacto.
 */
export const fntGenerateWorkoutSession = async (
   params: ItfGenerateWorkoutParams
): Promise<ItfWorkoutGenerationResponse> => {
   const { data, error } = await supabase.functions.invoke<{
      msg: string
      data: ItfWorkoutGenerationResponse
   }>('generate-workout-session', { body: params })

   if (error) {
      throw await normalizeFunctionsError(error)
   }
   if (!data?.data) throw new Error('Respuesta inesperada del servidor 🌿')
   return data.data
}

const normalizeFunctionsError = async (raw: unknown): Promise<Error> => {
   const e = raw as {
      name?: string
      message?: string
      context?: Response | { response?: Response; status?: number; msg?: string }
   }

   /* FunctionsHttpError del SDK expone Response DIRECTAMENTE en `context`. */
   const ctx = e.context
   const directResponse = ctx instanceof Response ? ctx : undefined
   const nestedResponse =
      ctx && !(ctx instanceof Response) ? (ctx as { response?: Response }).response : undefined
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
                ? 'Hoy ya generaste varias rutinas, descansemos 🌿'
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
