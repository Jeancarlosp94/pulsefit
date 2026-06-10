import { supabase } from './supabaseConf'
import type { ItfLogWeightInput, ItfWeightLog } from '@/interface/itfMeals'

/**
 * Upsert del peso del día actual. Si ya existe entrada para hoy, la actualiza.
 * Si no, la inserta. UNIQUE(user_id, log_date) garantiza la unicidad.
 */
export const fntLogWeight = async (input: ItfLogWeightInput): Promise<ItfWeightLog> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   const today = new Date().toISOString().slice(0, 10) /* YYYY-MM-DD */

   const { data, error } = await supabase
      .from('weight_logs')
      .upsert(
         {
            user_id: userId,
            log_date: today,
            weight_kg: input.weight_kg,
            notes: input.notes ?? null
         } as never,
         { onConflict: 'user_id,log_date' }
      )
      .select('*')
      .single()

   if (error) {
      throw new Error(`No pudimos guardar el peso: ${error.message.slice(0, 100)} 🌿`)
   }
   return data as ItfWeightLog
}

/** Lee los últimos N registros del peso (default 30 días). */
export const fntGetRecentWeights = async (limit = 30): Promise<ItfWeightLog[]> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return []

   const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(limit)

   if (error) throw new Error(error.message)
   return (data as ItfWeightLog[] | null) ?? []
}
