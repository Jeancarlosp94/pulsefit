import type {
   ItfOrganizedSession,
   ItfPrescribedExercise,
   ItfSessionFocus
} from '@/features/routine-generator'

export interface ItfWorkoutGenerationResponse {
   session: ItfOrganizedSession
   prescribed: ItfPrescribedExercise[]
   focus: ItfSessionFocus
   isDeloadWeek: boolean
   prescribedRpe: number
   source: 'ai' | 'ai_retry' | 'fallback'
}

export interface ItfGenerateWorkoutParams {
   day_of_week: number
   override_focus?: ItfSessionFocus
}
