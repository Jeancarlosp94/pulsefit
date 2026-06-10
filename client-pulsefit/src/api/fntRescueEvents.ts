import { supabase } from './supabaseConf'
import type {
   ItfRescueAlternative,
   ItfRescueDomain,
   ItfRescueTrigger
} from '@/features/rescue-engine'

export interface ItfLogRescueInput {
   domain: ItfRescueDomain
   trigger: ItfRescueTrigger
   reason?: string
   alternatives_offered: ItfRescueAlternative[]
   alternative_chosen: ItfRescueAlternative | null
}

/** Persiste un evento de rescate al elegir o saltar. */
export const fntLogRescueEvent = async (input: ItfLogRescueInput): Promise<void> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   const { error } = await supabase.from('rescue_events').insert({
      user_id: userId,
      domain: input.domain,
      trigger_type: input.trigger,
      reason: input.reason ?? null,
      alternatives_offered: input.alternatives_offered,
      alternative_chosen: input.alternative_chosen,
      user_completed: input.alternative_chosen ? true : false
   } as never)

   if (error) {
      throw new Error(`No pudimos registrar el rescate: ${error.message.slice(0, 100)} 🌿`)
   }
}
