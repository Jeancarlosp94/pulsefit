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
 */
export const fntGenerateWorkoutSession = async (
   params: ItfGenerateWorkoutParams
): Promise<ItfWorkoutGenerationResponse> => {
   const { data, error } = await supabase.functions.invoke<{
      msg: string
      data: ItfWorkoutGenerationResponse
   }>('generate-workout-session', { body: params })

   if (error) {
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
   if (!data?.data) throw new Error('Respuesta inesperada del servidor 🌿')
   return data.data
}
