import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

interface ApiLikeError {
   status?: number
   statusCode?: number
   code?: string | number
   message?: string
   error?: { message?: string; status?: number }
}

const inferStatus = (error: unknown): number | null => {
   if (!error || typeof error !== 'object') return null
   const e = error as ApiLikeError
   if (typeof e.status === 'number') return e.status
   if (typeof e.statusCode === 'number') return e.statusCode
   if (e.error && typeof e.error.status === 'number') return e.error.status
   /* Códigos típicos de Supabase Auth/Postgres mapeados a HTTP. */
   if (e.code === 'PGRST116') return 404
   if (e.code === '23505') return 409
   if (typeof e.code === 'string' && e.code.startsWith('auth/')) return 401
   return null
}

const inferMessage = (error: unknown): string => {
   if (!error) return 'Algo no salió como esperábamos, intentemos de nuevo 🌿'
   if (typeof error === 'string') return error
   if (error instanceof Error && error.message) return error.message
   const e = error as ApiLikeError
   return e.message ?? e.error?.message ?? 'Algo no salió como esperábamos, intentemos de nuevo 🌿'
}

/**
 * Manejo unificado de errores de API. SIEMPRE compasivo:
 * - 401 → cerrar sesión y redirigir a login.
 * - 404 → toast "no encontramos eso 🍃".
 * - 400/422 → mostrar el `error.message` (Supabase ya viene en español).
 * - offline → toast "sin conexión, guardamos local…".
 * - resto → toast genérico cálido.
 */
export const useErrorHandling = () => {
   const navigate = useNavigate()

   const handleApiError = (error: unknown) => {
      console.error('[useErrorHandling]', error)

      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
         toast.warning('Sin conexión, guardamos local y sincronizamos después 📡')
         return
      }

      const status = inferStatus(error)
      const message = inferMessage(error)

      if (status === 401) {
         toast.warning(message || 'Tu sesión expiró, vuelve a entrar 🌱')
         /* signOut sin await: la navegación gana. */
         void useAuthStore.getState().signOut()
         navigate('/login', { replace: true })
         return
      }

      if (status === 404) {
         toast(message || 'No encontramos eso 🍃')
         return
      }

      if (status === 429) {
         toast.warning(message || 'Esperá un poco antes de volver a intentar 🌿')
         return
      }

      if (status === 400 || status === 422 || status === 409) {
         toast(message)
         return
      }

      /* Si el message viene normalizado (con emoji), lo usamos en vez del genérico.
       * Eso permite que mensajes específicos de Edge Functions lleguen al usuario. */
      const isCompassionate = /[🌱🌿🍃📡💪🥗]/u.test(message)
      if (isCompassionate) {
         toast(message)
         return
      }

      toast('Algo no salió como esperábamos, intentemos de nuevo 🌿')
   }

   return { handleApiError }
}
