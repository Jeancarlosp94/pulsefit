import { supabase } from './supabaseConf'
import type { ItfLogMealInput, ItfMealLog } from '@/interface/itfMeals'

/**
 * Registra una decisión sobre una comida (planned/substituted/skipped).
 * RLS verifica user_id.
 */
export const fntLogMeal = async (input: ItfLogMealInput): Promise<ItfMealLog> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   const { data, error } = await supabase
      .from('meal_logs')
      .insert({
         user_id: userId,
         plan_id: input.plan_id ?? null,
         day_index: input.day_index ?? null,
         meal_type: input.meal_type,
         status: input.status,
         recipe_name: input.recipe_name ?? null,
         kcal: input.kcal ?? null,
         protein_g: input.protein_g ?? null,
         carbs_g: input.carbs_g ?? null,
         fats_g: input.fats_g ?? null,
         notes: input.notes ?? null
      } as never)
      .select('*')
      .single()

   if (error) {
      throw new Error(`No pudimos guardar la comida: ${error.message.slice(0, 100)} 🌿`)
   }
   return data as ItfMealLog
}

/** Devuelve los logs del día actual del usuario (UTC ~24h). */
export const fntGetTodayMealLogs = async (): Promise<ItfMealLog[]> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return []

   /* Pedimos los últimos 36h y filtramos client-side por LOCAL day para
    * tener huso horario consistente con la UI. */
   const since = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()

   const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', since)
      .order('logged_at', { ascending: false })

   if (error) throw new Error(error.message)
   return (data as ItfMealLog[] | null) ?? []
}

/** Borra un log (cuando el usuario deshace su elección). */
export const fntDeleteMealLog = async (id: string): Promise<void> => {
   const { error } = await supabase.from('meal_logs').delete().eq('id', id)
   if (error) throw new Error(error.message)
}
