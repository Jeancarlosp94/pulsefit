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
 *
 * Sprint 11.9.1 — error feedback mejorado:
 *   - Si la Edge Function no está deployada (404), mensaje específico.
 *   - Si rate limit (429), mensaje claro.
 *   - Si falta perfil (400/404), invita a completar onboarding.
 *   - Se loggea el error completo a consola para debug.
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
      onError: (e) => {
         /* Sprint 11.9.1: loguear a consola para debug + mensaje específico
          * según el código de error (no solo el generic handleApiError). */
         console.error('[useGenerateWorkout] error:', e)
         const status = (e as { status?: number }).status
         if (status === 404) {
            toast.error('La función de entrenamiento no está disponible 🍃', {
               description:
                  'El admin necesita desplegar generate-workout-session en Supabase. Revisa BETA_GUIDE.md.'
            })
            return
         }
         if (status === 429) {
            toast('Ya generaste varias rutinas hoy 🌿', {
               description: 'Descansemos un poco. Mañana volvemos con energía.'
            })
            return
         }
         if (status === 422) {
            toast.error('No encontramos ejercicios para tu perfil 🌿', {
               description:
                  'Verifica que en Perfil tengas marcado el equipo disponible. Default: peso corporal.'
            })
            return
         }
         handleApiError(e)
      }
   })
}
