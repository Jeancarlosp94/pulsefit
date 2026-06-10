import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fntDeleteMealLog, fntGetTodayMealLogs, fntLogMeal } from '@/api/fntMealLogs'
import { useErrorHandling } from './useErrorHandling'
import { useAuth } from './useAuth'
import type { ItfLogMealInput, ItfMealLog } from '@/interface/itfMeals'

const TODAY_LOGS_KEY = ['meal-logs', 'today'] as const

/** Logs de comida del día actual. */
export const useTodayMealLogs = () => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<ItfMealLog[]>({
      queryKey: TODAY_LOGS_KEY,
      queryFn: fntGetTodayMealLogs,
      enabled: !!user && onboardingCompleted,
      staleTime: 30 * 1000
   })
}

/** Registra una decisión sobre una comida. */
export const useLogMeal = () => {
   const queryClient = useQueryClient()
   const { handleApiError } = useErrorHandling()
   return useMutation<ItfMealLog, Error, ItfLogMealInput>({
      mutationFn: fntLogMeal,
      onSuccess: (log) => {
         queryClient.invalidateQueries({ queryKey: TODAY_LOGS_KEY })
         if (log.status === 'planned') toast.success('¡Listo! Comida registrada 🌱')
         else if (log.status === 'substituted') toast.success('Cambio registrado 🌿')
         else toast('Comida marcada como saltada 🌿')
      },
      onError: (e) => handleApiError(e)
   })
}

/** Deshace un log existente. */
export const useDeleteMealLog = () => {
   const queryClient = useQueryClient()
   const { handleApiError } = useErrorHandling()
   return useMutation<void, Error, string>({
      mutationFn: fntDeleteMealLog,
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: TODAY_LOGS_KEY })
         toast('Registro deshecho 🌱')
      },
      onError: (e) => handleApiError(e)
   })
}
