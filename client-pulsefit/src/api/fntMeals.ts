import { supabase } from './supabaseConf'
import type { ItfGenerateMealParams, ItfMealGenerationResponse } from '@/interface/itfMeals'

/**
 * Invoca la Edge Function `generate-meal-options` que orquesta el motor
 * híbrido (motor determinístico + Groq → Gemini → fallback templates).
 *
 * El cliente NUNCA llama a Groq/Gemini directamente. La API key vive solo en
 * Deno.env del Edge Function. Esta capa solo serializa el request.
 */
export const fntGenerateMealOptions = async (
   params: ItfGenerateMealParams
): Promise<ItfMealGenerationResponse> => {
   const { data, error } = await supabase.functions.invoke<{
      msg: string
      data: ItfMealGenerationResponse
   }>('generate-meal-options', { body: params })

   if (error) {
      /* `error.context` puede traer el response real con nuestro `msg` compasivo. */
      const ctx = (error as { context?: { msg?: string } }).context
      if (ctx?.msg) {
         const wrapped = new Error(ctx.msg)
         ;(wrapped as { status?: number }).status = (
            (error as { context?: { status?: number } }).context as {
               status?: number
            }
         )?.status
         throw wrapped
      }
      throw error
   }
   if (!data?.data) {
      throw new Error('Respuesta inesperada del servidor 🌿')
   }
   return data.data
}
