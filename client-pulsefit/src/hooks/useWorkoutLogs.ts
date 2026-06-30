import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
   fntGetRecentLogs,
   fntGetRecentLogsByExercise,
   fntLogActivity,
   fntLogSet
} from '@/api/fntWorkoutLogs'
import { useErrorHandling } from './useErrorHandling'
import { useAuth } from './useAuth'
import type { ItfLogActivityInput, ItfLogSetInput, ItfWorkoutLog } from '@/interface/itfWorkouts'

const recentLogsKey = (exerciseId: string) => ['workout-logs', exerciseId] as const
const recentLogsBatchKey = (exerciseIds: string[]) =>
   ['workout-logs-batch', exerciseIds.slice().sort().join('|')] as const

/** Logs recientes de UN ejercicio (default últimos 5). */
export const useRecentLogs = (exerciseId: string, limit = 5) => {
   const { user, onboardingCompleted } = useAuth()
   return useQuery<ItfWorkoutLog[]>({
      queryKey: recentLogsKey(exerciseId),
      queryFn: () => fntGetRecentLogs(exerciseId, limit),
      enabled: !!user && onboardingCompleted && !!exerciseId,
      staleTime: 60 * 1000 /* 1 min */
   })
}

/** Logs recientes de varios ejercicios en una sola query. Para RegistrarPage. */
export const useRecentLogsByExercise = (exerciseIds: string[], limit = 3) => {
   const { user, onboardingCompleted } = useAuth()
   const ids = exerciseIds.filter(Boolean)
   return useQuery<Record<string, ItfWorkoutLog[]>>({
      queryKey: recentLogsBatchKey(ids),
      queryFn: () => fntGetRecentLogsByExercise(ids, limit),
      enabled: !!user && onboardingCompleted && ids.length > 0,
      staleTime: 60 * 1000
   })
}

/** Registrar un set: persiste + invalida cache + toast. */
export const useLogSet = () => {
   const queryClient = useQueryClient()
   const { handleApiError } = useErrorHandling()
   return useMutation<ItfWorkoutLog, Error, ItfLogSetInput>({
      mutationFn: fntLogSet,
      onSuccess: (log) => {
         /* Invalidar la query del ejercicio específico y la batch. */
         if (log.exercise_id) {
            queryClient.invalidateQueries({ queryKey: recentLogsKey(log.exercise_id) })
         }
         queryClient.invalidateQueries({ queryKey: ['workout-logs-batch'] })
         queryClient.invalidateQueries({ queryKey: ['progress'] })
         queryClient.invalidateQueries({ queryKey: ['adherence-alert'] })
         toast.success('Set guardado 💪')
      },
      onError: (e) => handleApiError(e)
   })
}

const ACTIVITY_TOAST: Record<ItfLogActivityInput['activity_type'], string> = {
   cardio: '¡Cardio registrado! 💨',
   sport: '¡Buen partido! 🏆',
   dance: '¡A bailar! 💃',
   movement: 'Movimiento contado 🌿'
}

/** Sprint 11.7: registrar actividad no-strength (cardio/sport/dance/movement). */
export const useLogActivity = () => {
   const queryClient = useQueryClient()
   const { handleApiError } = useErrorHandling()
   return useMutation<ItfWorkoutLog, Error, ItfLogActivityInput>({
      mutationFn: fntLogActivity,
      onSuccess: (_log, vars) => {
         queryClient.invalidateQueries({ queryKey: ['workout-logs-batch'] })
         queryClient.invalidateQueries({ queryKey: ['progress'] })
         queryClient.invalidateQueries({ queryKey: ['adherence-alert'] })
         toast.success(ACTIVITY_TOAST[vars.activity_type] ?? 'Actividad registrada 🌱')
      },
      onError: (e) => handleApiError(e)
   })
}
