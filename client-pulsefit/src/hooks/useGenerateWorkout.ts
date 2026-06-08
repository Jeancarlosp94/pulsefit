import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fntGenerateWorkoutSession } from '@/api/fntWorkouts'
import { useErrorHandling } from './useErrorHandling'
import type {
   ItfGenerateWorkoutParams,
   ItfWorkoutGenerationResponse
} from '@/interface/itfWorkouts'

/**
 * Hook que invoca el generador híbrido de rutinas.
 * Mismo patrón que useGenerateMeal: useMutation + toasts compasivos.
 */
export const useGenerateWorkout = () => {
   const { handleApiError } = useErrorHandling()

   return useMutation<ItfWorkoutGenerationResponse, Error, ItfGenerateWorkoutParams>({
      mutationFn: fntGenerateWorkoutSession,
      onSuccess: (data) => {
         if (data.source === 'fallback') {
            toast('Te traigo una rutina simple para hoy 💪', {
               description: 'Mañana volvemos con la creatividad de siempre.'
            })
         } else if (data.isDeloadWeek) {
            toast.success('Semana de descarga: bajamos un poco la intensidad 🌊')
         } else {
            toast.success('Listo, mirá la rutina que te armamos 💪')
         }
      },
      onError: (e) => handleApiError(e)
   })
}
