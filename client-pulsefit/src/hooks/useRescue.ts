import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fntLogRescueEvent, type ItfLogRescueInput } from '@/api/fntRescueEvents'
import { useErrorHandling } from './useErrorHandling'

/** Persiste un rescate elegido por el usuario. */
export const useLogRescue = () => {
   const { handleApiError } = useErrorHandling()
   return useMutation<void, Error, ItfLogRescueInput>({
      mutationFn: fntLogRescueEvent,
      onSuccess: (_data, vars) => {
         if (vars.alternative_chosen) {
            toast.success(`${vars.alternative_chosen.icon} Vamos por esa opción 🌿`)
         }
      },
      onError: (e) => handleApiError(e)
   })
}
