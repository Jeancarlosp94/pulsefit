import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '@/api/supabaseConf'
import {
   fntSignIn,
   fntSignUp,
   fntSignOut,
   fntSignInWithGoogle,
   fntForgotPassword,
   fntGetProfile,
   fntUpdateProfile
} from '@/api/fntAuth'
import type {
   ItfUser,
   ItfSession,
   ItfProfile,
   ItfSignInPayload,
   ItfSignUpPayload,
   ItfForgotPasswordPayload
} from '@/interface'

interface AuthState {
   user: ItfUser | null
   session: ItfSession | null
   profile: ItfProfile | null
   loading: boolean
   initialized: boolean

   /** Acciones */
   signIn: (payload: ItfSignInPayload) => Promise<void>
   signUp: (payload: ItfSignUpPayload) => Promise<void>
   signOut: () => Promise<void>
   signInWithGoogle: () => Promise<void>
   forgotPassword: (payload: ItfForgotPasswordPayload) => Promise<void>
   loadProfile: () => Promise<ItfProfile | null>
   updateProfile: (patch: Partial<ItfProfile>) => Promise<ItfProfile | null>

   /** Internas (uso en init/onAuthStateChange) */
   _setSession: (session: ItfSession | null) => void
   _markInitialized: () => void
}

/**
 * Store de autenticación. Persiste solo `user` y `profile` (NO el JWT — el SDK
 * de Supabase ya persiste la sesión completa en localStorage con la clave
 * `pulsefit-auth`).
 */
export const useAuthStore = create<AuthState>()(
   persist(
      (set, get) => ({
         user: null,
         session: null,
         profile: null,
         loading: false,
         initialized: false,

         signIn: async (payload) => {
            set({ loading: true })
            try {
               const data = await fntSignIn(payload)
               set({ user: data.user, session: data.session })
               if (data.user) {
                  const profile = await fntGetProfile(data.user.id).catch(() => null)
                  set({ profile })
               }
            } finally {
               set({ loading: false })
            }
         },

         signUp: async (payload) => {
            set({ loading: true })
            try {
               const data = await fntSignUp(payload)
               set({ user: data.user, session: data.session })
            } finally {
               set({ loading: false })
            }
         },

         signOut: async () => {
            set({ loading: true })
            try {
               await fntSignOut()
            } finally {
               set({ user: null, session: null, profile: null, loading: false })
            }
         },

         signInWithGoogle: async () => {
            set({ loading: true })
            try {
               await fntSignInWithGoogle()
               /* OAuth redirige fuera de la app; al volver onAuthStateChange dispara. */
            } finally {
               set({ loading: false })
            }
         },

         forgotPassword: async (payload) => {
            await fntForgotPassword(payload)
         },

         loadProfile: async () => {
            const user = get().user
            if (!user) return null
            const profile = await fntGetProfile(user.id).catch(() => null)
            set({ profile })
            return profile
         },

         updateProfile: async (patch) => {
            const user = get().user
            if (!user) return null
            const updated = await fntUpdateProfile(user.id, patch)
            set({ profile: updated })
            return updated
         },

         _setSession: (session) => {
            set({
               session,
               user: session?.user ?? null
            })
         },

         _markInitialized: () => set({ initialized: true })
      }),
      {
         name: 'pulsefit-auth-store',
         storage: createJSONStorage(() => localStorage),
         partialize: (state) => ({
            /* No persistimos `loading` ni `session` (los reconstruye el SDK). */
            user: state.user,
            profile: state.profile
         }),
         version: 1
      }
   )
)

/**
 * Inicializa el store leyendo la sesión actual de Supabase y suscribiéndose
 * a cambios. Llamar UNA VEZ desde el bootstrap (`main.tsx` o un `useEffect`
 * en `App`).
 */
export const initAuthSubscription = async (): Promise<() => void> => {
   const store = useAuthStore.getState()

   const {
      data: { session }
   } = await supabase.auth.getSession()
   store._setSession(session)
   if (session?.user) {
      await store.loadProfile()
   }
   store._markInitialized()

   const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      const s = useAuthStore.getState()
      s._setSession(newSession)
      if (event === 'SIGNED_OUT') {
         useAuthStore.setState({ profile: null })
      } else if (newSession?.user) {
         await s.loadProfile()
      }
   })

   return () => sub.subscription.unsubscribe()
}
