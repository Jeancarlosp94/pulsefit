import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/api/supabaseConf', () => ({
   supabase: {
      auth: {
         getSession: vi.fn(async () => ({ data: { session: null } })),
         onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } }
         }))
      },
      from: vi.fn(() => ({
         select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: vi.fn(async () => ({ data: null, error: null })) }))
         })),
         update: vi.fn(() => ({
            eq: vi.fn(() => ({
               select: vi.fn(() => ({ single: vi.fn(async () => ({ data: null, error: null })) }))
            }))
         }))
      }))
   }
}))

vi.mock('@/api/fntAuth', () => ({
   fntSignIn: vi.fn(async () => ({ user: { id: 'u1' }, session: { access_token: 't' } })),
   fntSignUp: vi.fn(async () => ({ user: { id: 'u1' }, session: null })),
   fntSignOut: vi.fn(async () => undefined),
   fntSignInWithGoogle: vi.fn(async () => ({})),
   fntForgotPassword: vi.fn(async () => ({})),
   fntGetProfile: vi.fn(async () => ({
      id: 'u1',
      email: 'roberto@example.com',
      name: 'Roberto',
      onboarding_completed: false
   })),
   fntUpdateProfile: vi.fn(async (_id: string, patch: Record<string, unknown>) => ({
      id: 'u1',
      email: 'roberto@example.com',
      name: 'Roberto',
      onboarding_completed: false,
      ...patch
   }))
}))

import { useAuthStore } from './auth'

const reset = () => {
   useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      loading: false,
      initialized: false
   })
}

describe('useAuthStore', () => {
   beforeEach(() => {
      reset()
      localStorage.clear()
   })

   it('signIn carga usuario y perfil', async () => {
      await useAuthStore.getState().signIn({ email: 'r@a.co', password: 'x12345678' })
      const s = useAuthStore.getState()
      expect(s.user?.id).toBe('u1')
      expect(s.profile?.name).toBe('Roberto')
      expect(s.loading).toBe(false)
   })

   it('signOut limpia user, session y profile', async () => {
      useAuthStore.setState({
         user: { id: 'u1' } as never,
         session: { access_token: 't' } as never,
         profile: { id: 'u1' } as never
      })
      await useAuthStore.getState().signOut()
      const s = useAuthStore.getState()
      expect(s.user).toBeNull()
      expect(s.session).toBeNull()
      expect(s.profile).toBeNull()
   })

   it('updateProfile mergea el patch en el perfil', async () => {
      useAuthStore.setState({ user: { id: 'u1' } as never })
      const updated = await useAuthStore.getState().updateProfile({ name: 'Roby' } as never)
      expect(updated?.name).toBe('Roby')
      expect(useAuthStore.getState().profile?.name).toBe('Roby')
   })
})
