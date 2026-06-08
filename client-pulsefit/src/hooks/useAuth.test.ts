import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@/api/supabaseConf', () => ({
   supabase: {
      auth: {
         getSession: vi.fn(async () => ({ data: { session: null } })),
         onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } }
         }))
      }
   }
}))

import { useAuthStore } from '@/store/auth'
import { useAuth } from './useAuth'

describe('useAuth', () => {
   beforeEach(() => {
      useAuthStore.setState({
         user: null,
         session: null,
         profile: null,
         loading: false,
         initialized: false
      })
   })

   it('isAuthenticated es false sin user', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.onboardingCompleted).toBe(false)
   })

   it('isAuthenticated es true cuando hay user', () => {
      useAuthStore.setState({
         user: { id: 'u1', email: 'r@a.co' } as never,
         profile: { id: 'u1', onboarding_completed: true } as never
      })
      const { result } = renderHook(() => useAuth())
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.onboardingCompleted).toBe(true)
   })

   it('expone funciones de auth como referencias estables', () => {
      const { result } = renderHook(() => useAuth())
      expect(typeof result.current.signIn).toBe('function')
      expect(typeof result.current.signOut).toBe('function')
      expect(typeof result.current.signInWithGoogle).toBe('function')
   })
})
