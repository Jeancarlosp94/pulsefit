import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { LoaderUI } from '@/components/LoaderUI'
import { useAuth } from '@/hooks/useAuth'

interface NotAuthRouteProps {
   children: ReactNode
}

/**
 * Guard de rutas públicas (login, register, forgot-password):
 *   - Si hay sesión y onboarding completo → `/home`.
 *   - Si hay sesión y onboarding pendiente → `/onboarding`.
 *   - Si no hay sesión → renderiza.
 */
export const NotAuthRoute = ({ children }: NotAuthRouteProps) => {
   const { isAuthenticated, profile, initialized } = useAuth()

   if (!initialized) return <LoaderUI fullscreen />

   if (isAuthenticated) {
      const completed = profile?.onboarding_completed === true
      return <Navigate to={completed ? '/home' : '/onboarding'} replace />
   }

   return <>{children}</>
}
