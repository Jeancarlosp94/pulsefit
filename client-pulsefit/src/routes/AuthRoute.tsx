import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoaderUI } from '@/components/LoaderUI'
import { useAuth } from '@/hooks/useAuth'

interface AuthRouteProps {
   children: ReactNode
}

/**
 * Guard de rutas privadas:
 *   - Sin sesión → redirige a `/login`.
 *   - Con sesión pero `onboarding_completed === false` y la ruta no es
 *     `/onboarding` → redirige a `/onboarding`.
 *   - Con sesión + onboarding terminado → renderiza.
 */
export const AuthRoute = ({ children }: AuthRouteProps) => {
   const location = useLocation()
   const { isAuthenticated, profile, initialized } = useAuth()

   if (!initialized) return <LoaderUI fullscreen />

   if (!isAuthenticated) {
      return <Navigate to='/login' replace state={{ from: location.pathname }} />
   }

   const onboardingCompleted = profile?.onboarding_completed === true
   const isOnboardingPath =
      location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/')
   const isProfilePath = location.pathname === '/perfil'

   /* Si el perfil aún no cargó, no decidimos: dejamos pasar a la ruta destino
    * y que el contenido decida (evita un loop si profile se carga lento). */
   if (profile && !onboardingCompleted && !isOnboardingPath && !isProfilePath) {
      return <Navigate to='/onboarding' replace />
   }

   return <>{children}</>
}
