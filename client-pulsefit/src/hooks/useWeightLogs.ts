import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fntGetRecentWeights, fntLogWeight } from '@/api/fntWeightLogs'
import { useErrorHandling } from './useErrorHandling'
import { useAuth } from './useAuth'
import type { ItfLogWeightInput, ItfWeightLog } from '@/interface/itfMeals'

const WEIGHTS_KEY = ['weight-logs', 'recent'] as const

/** Lista de pesos recientes (default últimos 30 días). */
export const useRecentWeights = (limit = 30) => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<ItfWeightLog[]>({
      queryKey: WEIGHTS_KEY,
      queryFn: () => fntGetRecentWeights(limit),
      enabled: !!user && onboardingCompleted,
      staleTime: 60 * 1000
   })
}

/** Upsert el peso del día. */
export const useLogWeight = () => {
   const queryClient = useQueryClient()
   const { handleApiError } = useErrorHandling()
   return useMutation<ItfWeightLog, Error, ItfLogWeightInput>({
      mutationFn: fntLogWeight,
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: WEIGHTS_KEY })
         toast.success('Peso registrado ⚖️')
      },
      onError: (e) => handleApiError(e)
   })
}
