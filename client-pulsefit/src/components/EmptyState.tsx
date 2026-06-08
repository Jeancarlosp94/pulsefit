import type { LucideIcon } from 'lucide-react'
import { Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'

interface EmptyStateProps {
   icon?: LucideIcon
   title: string
   description?: string
   action?: {
      label: string
      onClick: () => void
   }
   children?: ReactNode
   className?: string
}

/**
 * Estado vacío cálido. Usar siempre que una lista no tiene datos: nunca
 * mostrar "no hay nada" en seco. Siempre invitar al siguiente paso.
 */
export const EmptyState = ({
   icon: Icon = Sparkles,
   title,
   description,
   action,
   children,
   className
}: EmptyStateProps) => {
   return (
      <div
         className={cn(
            'mx-auto flex max-w-sm flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-card/40 p-8 text-center',
            className
         )}
      >
         <span className='flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <Icon className='h-7 w-7' aria-hidden='true' />
         </span>
         <div className='space-y-1'>
            <h2 className='font-display text-xl text-foreground'>{title}</h2>
            {description ? <p className='text-sm text-muted-foreground'>{description}</p> : null}
         </div>
         {action ? (
            <Button onClick={action.onClick} className='mt-2'>
               {action.label}
            </Button>
         ) : null}
         {children}
      </div>
   )
}
