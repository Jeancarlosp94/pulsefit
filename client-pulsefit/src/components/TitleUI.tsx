import type { ReactNode } from 'react'
import { cn } from '@/utils'

interface TitleUIProps {
   title: string
   subtitle?: string
   action?: ReactNode
   className?: string
   /** `as` para semántica accesible: por defecto h1, ajustable en subpáginas. */
   as?: 'h1' | 'h2'
}

/**
 * Título de página con tipografía DM Serif Display. Mantiene jerarquía y
 * deja un slot para acciones (ej: filtros, botón compartir).
 */
export const TitleUI = ({ title, subtitle, action, className, as: Tag = 'h1' }: TitleUIProps) => {
   return (
      <header className={cn('mb-4 flex items-start justify-between gap-3', className)}>
         <div className='min-w-0'>
            <Tag className='font-display text-3xl leading-tight text-foreground'>{title}</Tag>
            {subtitle ? <p className='mt-1 text-sm text-muted-foreground'>{subtitle}</p> : null}
         </div>
         {action ? <div className='shrink-0'>{action}</div> : null}
      </header>
   )
}
