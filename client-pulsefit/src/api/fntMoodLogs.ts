import { supabase } from './supabaseConf'
import type { ItfLogMoodInput, ItfMoodLog } from '@/interface/itfMeals'

/** Upsert del mood del día actual. UNIQUE(user_id, log_date) garantiza unicidad. */
export const fntLogMood = async (input: ItfLogMoodInput): Promise<ItfMoodLog> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   const today = new Date().toISOString().slice(0, 10)

   const { data, error } = await supabase
      .from('mood_logs')
      .upsert(
         {
            user_id: userId,
            log_date: today,
            energy_level: input.energy_level,
            mood_level: input.mood_level,
            notes: input.notes ?? null
         } as never,
         { onConflict: 'user_id,log_date' }
      )
      .select('*')
      .single()

   if (error) {
      throw new Error(`No pudimos guardar tu estado: ${error.message.slice(0, 100)} 🌿`)
   }
   return data as ItfMoodLog
}

/** Devuelve el mood del día actual o null si no existe. */
export const fntGetTodayMood = async (): Promise<ItfMoodLog | null> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return null

   const today = new Date().toISOString().slice(0, 10)
   const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', today)
      .maybeSingle()

   if (error) throw new Error(error.message)
   return (data as ItfMoodLog | null) ?? null
}
