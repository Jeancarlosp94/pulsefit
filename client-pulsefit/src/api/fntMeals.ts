import { supabase } from './supabaseConf'
import type { ItfGenerateMealParams, ItfMealGenerationResponse } from '@/interface/itfMeals'

/**
 * Invoca la Edge Function `generate-meal-options` que orquesta el motor
 * híbrido (motor determinístico + Groq → Gemini → fallback templates).
 *
 * El cliente NUNCA llama a Groq/Gemini directamente. La API key vive solo en
 * Deno.env del Edge Function. Esta capa solo serializa el request.
 *
 * Cuando la Edge Function devuelve un error, el SDK de Supabase tira un
 * `FunctionsHttpError` con la respuesta original en `context.response`.
 * Esta función la lee para construir un Error con `.status` y `.message`
 * que `useErrorHandling` pueda interpretar.
 */
const FUNCTION_TIMEOUT_MS = 15_000

export const fntGenerateMealOptions = async (
   params: ItfGenerateMealParams
): Promise<ItfMealGenerationResponse> => {
   /* Timeout duro a 15s: si Edge Function no responde, mostramos un mensaje
    * compasivo y el usuario puede reintentar (en vez de quedar colgado). */
   const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
         () =>
            reject(
               Object.assign(
                  new Error('Tardamos más de lo esperado. Probemos de nuevo en un momento 🌿'),
                  { status: 504 }
               )
            ),
         FUNCTION_TIMEOUT_MS
      )
   )
   const invokePromise = supabase.functions.invoke<{
      msg: string
      data: ItfMealGenerationResponse
   }>('generate-meal-options', { body: params })

   const result = await Promise.race([invokePromise, timeoutPromise])
   const { data, error } = result

   if (error) {
      throw await normalizeFunctionsError(error)
   }
   if (!data?.data) throw new Error('Respuesta inesperada del servidor 🌿')
   return data.data
}

/**
 * Normaliza un FunctionsHttpError / FunctionsRelayError / FunctionsFetchError
 * en un Error con `status` y `message` interpretable por `useErrorHandling`.
 */
const normalizeFunctionsError = async (raw: unknown): Promise<Error> => {
   const e = raw as {
      name?: string
      message?: string
      context?: { response?: Response; status?: number; msg?: string }
   }

   /* Caso 1: ya nos pasó el contexto con msg (legado). */
   if (e.context?.msg) {
      const wrapped = new Error(e.context.msg)
      ;(wrapped as { status?: number }).status = e.context.status
      return wrapped
   }

   /* Caso 2: tenemos la Response cruda. La leemos como JSON o texto. */
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

   /* Caso 3: error de red sin respuesta (CORS, timeout, función no existe). */
   const networkMsg = e.message || 'No pudimos conectar con el servidor 📡'
   const wrapped = new Error(networkMsg)
   /* Lo etiquetamos como "503-ish" para que useErrorHandling lo trate como genérico. */
   ;(wrapped as { status?: number }).status = 503
   return wrapped
}
