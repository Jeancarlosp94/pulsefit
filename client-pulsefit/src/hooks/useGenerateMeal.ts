import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fntGenerateMealOptions } from '@/api/fntMeals'
import { useErrorHandling } from './useErrorHandling'
import type { ItfGenerateMealParams, ItfMealGenerationResponse } from '@/interface/itfMeals'

/**
 * Hook que invoca el generador híbrido de comidas.
 * El SDK de react-query ya cubre loading/error/success.
 *
 * Cuando la respuesta viene del fallback determinístico (source === 'fallback'),
 * mostramos un toast cálido pero sin alarmar al usuario: la app NUNCA muestra
 * "la IA falló" — solo "te traigo opciones simples para hoy".
 */
export const useGenerateMeal = () => {
   const { handleApiError } = useErrorHandling()

   return useMutation<ItfMealGenerationResponse, Error, ItfGenerateMealParams>({
      mutationFn: fntGenerateMealOptions,
      onSuccess: (data) => {
         if (data.source === 'fallback') {
            toast('Te traigo opciones simples para hoy 🌿', {
               description: 'Mañana volveremos con la creatividad de siempre.'
            })
         } else {
            toast.success('Listo, mira qué te preparamos 🌱')
         }
      },
      onError: (e) => handleApiError(e)
   })
}
