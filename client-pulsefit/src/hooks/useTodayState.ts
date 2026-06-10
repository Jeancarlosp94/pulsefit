import { useMemo } from 'react'
import { useMealPlan } from './useMealPlan'
import { useTodayMealLogs } from './useMealLogs'
import { computeTodayState } from '@/features/home-engine'
import type { ItfTodayState } from '@/interface/itfMeals'

/**
 * Combina el plan vigente + logs del día actual y devuelve el snapshot del día.
 * Esta es la fuente de verdad que consume el HomePage rediseñado.
 */
export const useTodayState = (): {
   state: ItfTodayState
   isLoading: boolean
   hasError: boolean
} => {
   const planQuery = useMealPlan()
   const logsQuery = useTodayMealLogs()

   const state = useMemo(
      () =>
         computeTodayState({
            plan: planQuery.data ?? null,
            logs: logsQuery.data ?? []
         }),
      [planQuery.data, logsQuery.data]
   )

   return {
      state,
      isLoading: planQuery.isLoading || logsQuery.isLoading,
      hasError: planQuery.isError || logsQuery.isError
   }
}
