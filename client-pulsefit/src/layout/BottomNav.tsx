import { Home, ClipboardList, PlusCircle, LineChart, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/utils'

interface NavItem {
   to: string
   label: string
   icon: React.ComponentType<{ className?: string }>
   highlight?: boolean
}

const items: NavItem[] = [
   { to: '/home', label: 'Hoy', icon: Home },
   { to: '/plan', label: 'Plan', icon: ClipboardList },
   { to: '/registrar', label: 'Registrar', icon: PlusCircle, highlight: true },
   { to: '/progreso', label: 'Progreso', icon: LineChart },
   { to: '/perfil', label: 'Perfil', icon: User }
]

/**
 * BottomNav fijo. Diseñado para mobile-first 375px: target táctil mínimo 44px,
 * separación amplia y CTA central destacado en color accent (coral cálido).
 */
export const BottomNav = () => {
   return (
      <nav
         aria-label='Navegación principal'
         className='fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80'
      >
         <ul className='mx-auto flex max-w-md items-end justify-around px-2 py-2'>
            {items.map(({ to, label, icon: Icon, highlight }) => (
               <li key={to} className='flex-1'>
                  <NavLink
                     to={to}
                     end
                     aria-label={label}
                     className={({ isActive }) =>
                        cn(
                           'group relative flex flex-col items-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                           highlight && '-mt-6',
                           isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        )
                     }
                  >
                     {({ isActive }) =>
                        highlight ? (
                           <>
                              <span
                                 className={cn(
                                    'flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform group-hover:scale-105',
                                    isActive && 'ring-4 ring-accent/30'
                                 )}
                              >
                                 <Icon className='h-6 w-6' />
                              </span>
                              <span>{label}</span>
                           </>
                        ) : (
                           <>
                              <Icon
                                 className={cn(
                                    'h-5 w-5 transition-transform',
                                    isActive && 'scale-110'
                                 )}
                              />
                              <span>{label}</span>
                           </>
                        )
                     }
                  </NavLink>
               </li>
            ))}
         </ul>
      </nav>
   )
}
