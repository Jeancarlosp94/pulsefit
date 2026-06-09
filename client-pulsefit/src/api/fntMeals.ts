import { supabase } from './supabaseConf'
import type {
   ItfGenerateMealParams,
   ItfMealGenerationResponse,
   ItfOptionComponents,
   ItfPlateOptionWithComponents
} from '@/interface/itfMeals'
import type { ItfPlateOption } from '@/features/meal-generator'

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
 *
 * **Backward compat:** si la Edge Function aún no se redeployó con la API v2,
 * normalizamos el formato viejo (`{ options[], components, target }`) al nuevo
 * (`{ options[]={...,components} }`) para que el cliente NO crashee.
 */
const FUNCTION_TIMEOUT_MS = 15_000

export const fntGenerateMealOptions = async (
   params: ItfGenerateMealParams
): Promise<ItfMealGenerationResponse> => {
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
   const invokePromise = supabase.functions.invoke<unknown>('generate-meal-options', {
      body: params
   })

   const result = await Promise.race([invokePromise, timeoutPromise])
   const { data, error } = result as {
      data: unknown
      error: unknown
   }

   if (error) {
      throw await normalizeFunctionsError(error)
   }
   const payload = (data as { data?: unknown })?.data
   if (!payload) throw new Error('Respuesta inesperada del servidor 🌿')

   return normalizeResponse(payload)
}

/* ----------------------------------------------------------------------------
 *  Normalizador de respuesta — soporta formato v1 (legacy) y v2 (actual).
 * -------------------------------------------------------------------------- */

interface LegacyResponse {
   options: ItfPlateOption[]
   components?: ItfOptionComponents
   target: ItfMealGenerationResponse['target']
   source?: ItfMealGenerationResponse['source']
}

const isNewFormat = (raw: unknown): raw is ItfMealGenerationResponse => {
   if (!raw || typeof raw !== 'object') return false
   const r = raw as { options?: unknown }
   if (!Array.isArray(r.options)) return false
   const first = r.options[0] as { components?: unknown } | undefined
   return !!first?.components
}

const normalizeResponse = (raw: unknown): ItfMealGenerationResponse => {
   if (isNewFormat(raw)) return raw

   /* Formato legacy: cada opción comparte el mismo `data.components` raíz.
    * Reasignamos `components` a cada opción para que el cliente lea uniforme. */
   const legacy = raw as LegacyResponse
   if (!legacy.options || !Array.isArray(legacy.options)) {
      throw new Error('Respuesta inesperada del servidor 🌿')
   }
   const sharedComponents = legacy.components ?? {
      protein: { name: '—', grams: 0 },
      carb: { name: '—', grams: 0 },
      fat: { name: '—', grams: 0 },
      vegetable: null,
      actualMacros: legacy.target
   }
   const adapted: ItfPlateOptionWithComponents[] = legacy.options.map((opt) => ({
      ...opt,
      components: sharedComponents,
      source: legacy.source === 'fallback' ? 'fallback' : 'ai'
   }))
   return {
      options: adapted,
      target: legacy.target,
      source: legacy.source ?? 'ai'
   }
}

/* ----------------------------------------------------------------------------
 *  Normalizador de errores del SDK de Supabase Functions.
 * -------------------------------------------------------------------------- */

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
