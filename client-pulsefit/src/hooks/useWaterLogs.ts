import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fntAddWaterDelta, fntGetTodayWaterCount } from '@/api/fntWaterLogs'
import { useErrorHandling } from './useErrorHandling'
import { useAuth } from './useAuth'
import type { ItfWaterLog } from '@/interface/itfMeals'

const WATER_TODAY_KEY = ['water-logs', 'today'] as const

/** Cantidad de vasos del día actual + lista de logs. */
export const useTodayWater = () => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<{ count: number; logs: ItfWaterLog[] }>({
      queryKey: WATER_TODAY_KEY,
      queryFn: fntGetTodayWaterCount,
      enabled: !!user && onboardingCompleted,
      staleTime: 30 * 1000
   })
}

/** Suma o resta un vaso del día (con feedback compasivo). */
export const useAddWater = () => {
   const queryClient = useQueryClient()
   const { handleApiError } = useErrorHandling()
   return useMutation<ItfWaterLog, Error, 1 | -1>({
      mutationFn: fntAddWaterDelta,
      onMutate: async (delta) => {
         /* Optimistic update: actualiza el cache antes de la respuesta. */
         await queryClient.cancelQueries({ queryKey: WATER_TODAY_KEY })
         const prev = queryClient.getQueryData<{ count: number; logs: ItfWaterLog[] }>(
            WATER_TODAY_KEY
         )
         if (prev) {
            queryClient.setQueryData(WATER_TODAY_KEY, {
               count: Math.max(0, prev.count + delta),
               logs: prev.logs
            })
         }
         return { prev }
      },
      onError: (e, _delta, context) => {
         /* Revertir el optimistic update. */
         const ctx = context as { prev?: { count: number; logs: ItfWaterLog[] } } | undefined
         if (ctx?.prev) queryClient.setQueryData(WATER_TODAY_KEY, ctx.prev)
         handleApiError(e)
      },
      onSuccess: (_log, delta) => {
         queryClient.invalidateQueries({ queryKey: WATER_TODAY_KEY })
         if (delta === 1) toast.success('Vaso registrado 💧')
      }
   })
}
