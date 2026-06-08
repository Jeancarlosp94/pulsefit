/* Barrel del módulo `api`. */
export { supabase } from './supabaseConf'
export {
   fntSignIn,
   fntSignUp,
   fntSignOut,
   fntSignInWithGoogle,
   fntForgotPassword,
   fntGetProfile,
   fntUpdateProfile
} from './fntAuth'
export { fntGenerateMealOptions } from './fntMeals'
export { fntGenerateWorkoutSession } from './fntWorkouts'
