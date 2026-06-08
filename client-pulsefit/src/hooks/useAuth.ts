import { useAuthStore } from '@/store/auth'

/**
 * Hook de auth. Selecciona los campos del store con sintaxis cómoda y
 * estable (cada selector es un primitivo o función referencialmente estable).
 */
export const useAuth = () => {
   const user = useAuthStore((s) => s.user)
   const session = useAuthStore((s) => s.session)
   const profile = useAuthStore((s) => s.profile)
   const loading = useAuthStore((s) => s.loading)
   const initialized = useAuthStore((s) => s.initialized)

   const signIn = useAuthStore((s) => s.signIn)
   const signUp = useAuthStore((s) => s.signUp)
   const signOut = useAuthStore((s) => s.signOut)
   const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
   const forgotPassword = useAuthStore((s) => s.forgotPassword)
   const loadProfile = useAuthStore((s) => s.loadProfile)
   const updateProfile = useAuthStore((s) => s.updateProfile)

   const isAuthenticated = !!user
   const onboardingCompleted = profile?.onboarding_completed ?? false

   return {
      user,
      session,
      profile,
      loading,
      initialized,
      isAuthenticated,
      onboardingCompleted,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      forgotPassword,
      loadProfile,
      updateProfile
   }
}
