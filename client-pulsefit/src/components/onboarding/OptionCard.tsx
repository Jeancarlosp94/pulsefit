import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils'

interface OptionCardProps {
   selected: boolean
   onSelect: () => void
   label: string
   description?: string
   emoji?: string
   icon?: ReactNode
   compact?: boolean
}

/**
 * Tarjeta de selección estilo botón grande. Pensada para los selects
 * principales del onboarding (objetivo, sexo, nivel de actividad, etc.).
 * Touch target 60px+, animación sutil, focus accesible.
 */
export const OptionCard = ({
   selected,
   onSelect,
   label,
   description,
   emoji,
   icon,
   compact = false
}: OptionCardProps) => {
   return (
      <button
         type='button'
         onClick={onSelect}
         aria-pressed={selected}
         className={cn(
            'group relative flex w-full items-center gap-3 rounded-lg border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            compact ? 'p-3' : 'p-4',
            selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/40'
         )}
      >
         {emoji ? (
            <span className='text-2xl' aria-hidden='true'>
               {emoji}
            </span>
         ) : null}
         {icon ? <span className='text-primary'>{icon}</span> : null}
         <div className='flex-1 min-w-0'>
            <p className={cn('font-medium text-foreground', compact ? 'text-sm' : 'text-base')}>
               {label}
            </p>
            {description ? (
               <p className='text-xs text-muted-foreground mt-0.5'>{description}</p>
            ) : null}
         </div>
         {selected ? (
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'>
               <Check className='h-4 w-4' aria-hidden='true' />
            </span>
         ) : null}
      </button>
   )
}
