import { supabase } from './supabaseConf'
import type { ItfWaterLog } from '@/interface/itfMeals'

/** Inserta un delta de vaso (+1 o -1) en `water_logs`. */
export const fntAddWaterDelta = async (delta: 1 | -1): Promise<ItfWaterLog> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   const { data, error } = await supabase
      .from('water_logs')
      .insert({ user_id: userId, delta_glasses: delta } as never)
      .select('*')
      .single()

   if (error) {
      throw new Error(`No pudimos registrar el vaso: ${error.message.slice(0, 100)} 🌿`)
   }
   return data as ItfWaterLog
}

/** Lee los logs del día actual (filtra local). Devuelve la suma de deltas. */
export const fntGetTodayWaterCount = async (): Promise<{
   count: number
   logs: ItfWaterLog[]
}> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return { count: 0, logs: [] }

   /* Pedimos últimas 36h y filtramos por LOCAL day en el cliente. */
   const since = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()

   const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', since)
      .order('logged_at', { ascending: false })

   if (error) throw new Error(error.message)
   const rows = (data as ItfWaterLog[] | null) ?? []
   const now = new Date()
   const todayLogs = rows.filter((r) => {
      const d = new Date(r.logged_at)
      return (
         d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate()
      )
   })
   const count = todayLogs.reduce((sum, r) => sum + r.delta_glasses, 0)
   return { count: Math.max(0, count), logs: todayLogs }
}
