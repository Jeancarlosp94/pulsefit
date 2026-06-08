import { Bell } from 'lucide-react'
import { useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getGreeting } from '@/utils'

interface TopBarProps {
   userName?: string | null
   avatarUrl?: string | null
   onAvatarClick?: () => void
}

const getInitials = (name?: string | null): string => {
   if (!name) return 'PF'
   return (
      name
         .split(' ')
         .filter(Boolean)
         .slice(0, 2)
         .map((part) => part[0]?.toUpperCase())
         .join('') || 'PF'
   )
}

/**
 * TopBar con saludo dinámico según hora local. El botón de notificaciones es
 * placeholder por ahora (Fase 9+ activa los logros y recordatorios).
 */
export const TopBar = ({ userName, avatarUrl, onAvatarClick }: TopBarProps) => {
   const greeting = useMemo(() => getGreeting(), [])
   const initials = useMemo(() => getInitials(userName), [userName])
   const firstName = userName?.split(' ')[0] ?? ''

   return (
      <header className='sticky top-0 z-30 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80'>
         <div className='mx-auto flex max-w-md items-center justify-between gap-3 px-4 py-3'>
            <button
               type='button'
               onClick={onAvatarClick}
               aria-label='Abrir mi perfil'
               className='flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            >
               <Avatar>
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt='' /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
               </Avatar>
               <div className='text-left'>
                  <p className='text-xs text-muted-foreground'>{greeting}</p>
                  <p className='text-sm font-medium leading-tight text-foreground'>
                     {firstName || 'Bienvenida'}
                  </p>
               </div>
            </button>

            <Button
               variant='ghost'
               size='icon'
               aria-label='Notificaciones (próximamente)'
               className='text-muted-foreground'
               disabled
            >
               <Bell className='h-5 w-5' />
            </Button>
         </div>
      </header>
   )
}
