/* Barrel de interfaces. Los tipos auto-generados viven en database.ts (regenerar con `pnpm types:db`). */
export type { Database, Tables, TablesInsert, TablesUpdate, Json } from './database'
export type {
   ItfUser,
   ItfSession,
   ItfProfile,
   ItfSignInPayload,
   ItfSignUpPayload,
   ItfForgotPasswordPayload,
   ItfAuthStatus
} from './itfAuth'
export type {
   ItfMealComponentSummary,
   ItfMealGenerationResponse,
   ItfGenerateMealParams
} from './itfMeals'
export type { ItfWorkoutGenerationResponse, ItfGenerateWorkoutParams } from './itfWorkouts'
