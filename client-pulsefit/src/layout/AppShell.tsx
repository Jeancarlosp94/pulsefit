import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'

interface AppShellProps {
   children: ReactNode
   userName?: string | null
   avatarUrl?: string | null
   /** Si es false (ej: pantallas de onboarding inmersivas) ocultamos navegación. */
   showNav?: boolean
}

/**
 * Estructura raíz para rutas autenticadas. Mobile-first: contenedor centrado
 * en `max-w-md`, scroll vertical en el contenido y padding inferior para que
 * el BottomNav (h ~ 76px) nunca tape contenido real.
 */
export const AppShell = ({ children, userName, avatarUrl, showNav = true }: AppShellProps) => {
   const navigate = useNavigate()

   return (
      <div className='relative flex min-h-dvh flex-col bg-background text-foreground'>
         {showNav ? (
            <TopBar
               userName={userName}
               avatarUrl={avatarUrl}
               onAvatarClick={() => navigate('/perfil')}
            />
         ) : null}

         <main className='mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-4' data-testid='app-main'>
            {children}
         </main>

         {showNav ? <BottomNav /> : null}
      </div>
   )
}
