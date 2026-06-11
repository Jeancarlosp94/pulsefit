import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fntApplyReviewAdjustments, fntComposeWeeklyReview, fntSaveReview } from '@/api/fntReview'
import { useErrorHandling } from './useErrorHandling'
import { useAuth } from './useAuth'
import type { ItfAdjustment, ItfWeeklyReview } from '@/features/review-engine'

/** On-demand: compone la revisión semanal (analyzer + IA + fallback). */
export const useComposeWeeklyReview = () => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<ItfWeeklyReview>({
      queryKey: ['weekly-review', 'composed'],
      queryFn: fntComposeWeeklyReview,
      enabled: !!user && onboardingCompleted,
      staleTime: 5 * 60 * 1000,
      retry: false
   })
}

interface SaveInput {
   review: ItfWeeklyReview
   accepted: ItfAdjustment[]
}

/** Persiste la revisión + aplica los ajustes aceptados al perfil. */
export const useApplyReview = () => {
   const queryClient = useQueryClient()
   const { handleApiError } = useErrorHandling()
   return useMutation<void, Error, SaveInput>({
      mutationFn: async ({ review, accepted }) => {
         const decision: 'accepted_all' | 'partial' | 'rejected' =
            accepted.length === review.adjustments.length && accepted.length > 0
               ? 'accepted_all'
               : accepted.length === 0
                 ? 'rejected'
                 : 'partial'

         await fntSaveReview({
            review,
            accepted_ids: accepted.map((a) => a.id),
            decision
         })

         if (accepted.length > 0) {
            await fntApplyReviewAdjustments(accepted)
         }
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['weekly-review'] })
         queryClient.invalidateQueries({ queryKey: ['progress'] })
         queryClient.invalidateQueries({ queryKey: ['profile'] })
         toast.success('Listo. Empezamos una nueva semana 🌱')
      },
      onError: (e) => handleApiError(e)
   })
}
