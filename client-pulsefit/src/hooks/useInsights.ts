import { useQuery } from '@tanstack/react-query'
import { fntGetInsights } from '@/api/fntInsights'
import { useAuth } from './useAuth'
import type { ItfPattern, ItfRecommendation } from '@/features/pattern-engine'

export const useInsights = () => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<{ patterns: ItfPattern[]; recommendations: ItfRecommendation[] }>({
      queryKey: ['insights'],
      queryFn: fntGetInsights,
      enabled: !!user && onboardingCompleted,
      staleTime: 5 * 60 * 1000
   })
}
