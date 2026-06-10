import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fntGetTodayMood, fntLogMood } from '@/api/fntMoodLogs'
import { useErrorHandling } from './useErrorHandling'
import { useAuth } from './useAuth'
import type { ItfLogMoodInput, ItfMoodLog } from '@/interface/itfMeals'

const TODAY_MOOD_KEY = ['mood-logs', 'today'] as const

/** Mood del día actual (null si no se registró todavía). */
export const useTodayMood = () => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<ItfMoodLog | null>({
      queryKey: TODAY_MOOD_KEY,
      queryFn: fntGetTodayMood,
      enabled: !!user && onboardingCompleted,
      staleTime: 60 * 1000
   })
}

/** Guarda el mood del día (upsert). */
export const useLogMood = () => {
   const queryClient = useQueryClient()
   const { handleApiError } = useErrorHandling()
   return useMutation<ItfMoodLog, Error, ItfLogMoodInput>({
      mutationFn: fntLogMood,
      onSuccess: (log) => {
         queryClient.setQueryData(TODAY_MOOD_KEY, log)
         toast.success('Gracias por contarnos 🌱')
      },
      onError: (e) => handleApiError(e)
   })
}
