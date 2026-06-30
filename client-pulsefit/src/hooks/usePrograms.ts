import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fntCancelActiveProgram, fntCreateProgram, fntGetActiveProgram } from '@/api/fntPrograms'
import { useErrorHandling } from './useErrorHandling'
import { useAuth } from './useAuth'
import { computeActivePhase } from '@/features/program-engine'
import type {
   ItfActivePhase,
   ItfCreateProgramInput,
   ItfTrainingProgram
} from '@/interface/itfPrograms'

const PROGRAM_KEY = ['training-program', 'active'] as const

export const useActiveProgram = () => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<ItfTrainingProgram | null>({
      queryKey: PROGRAM_KEY,
      queryFn: fntGetActiveProgram,
      enabled: !!user && onboardingCompleted,
      staleTime: 5 * 60 * 1000,
      retry: false
   })
}

/** Devuelve la fase activa hoy (calculada en cliente). */
export const useActivePhase = (): ItfActivePhase | null => {
   const { data: program } = useActiveProgram()
   if (!program) return null
   return computeActivePhase(program)
}

export const useCreateProgram = () => {
   const queryClient = useQueryClient()
   const { handleApiError } = useErrorHandling()
   return useMutation<ItfTrainingProgram, Error, ItfCreateProgramInput>({
      mutationFn: fntCreateProgram,
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: PROGRAM_KEY })
         toast.success('Tu programa está listo 🌱')
      },
      onError: (e) => handleApiError(e)
   })
}

export const useCancelActiveProgram = () => {
   const queryClient = useQueryClient()
   const { handleApiError } = useErrorHandling()
   return useMutation<void, Error, void>({
      mutationFn: fntCancelActiveProgram,
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: PROGRAM_KEY })
         toast('Programa cancelado. Empieza otro cuando quieras 🌿')
      },
      onError: (e) => handleApiError(e)
   })
}
