import { cn } from '@/utils'

interface MacroBarProps {
   label: string
   consumed: number
   target: number
   unit?: string
   colorClass?: string
}

/** Barra visual reusable de progreso de un macro. */
export const MacroBar = ({
   label,
   consumed,
   target,
   unit = 'g',
   colorClass = 'bg-primary'
}: MacroBarProps) => {
   const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0
   return (
      <div className='space-y-1'>
         <div className='flex items-center justify-between text-xs'>
            <span className='text-muted-foreground'>{label}</span>
            <span className='font-medium text-foreground'>
               {consumed}/{target}
               {unit}
            </span>
         </div>
         <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
            <div className={cn('h-full transition-all', colorClass)} style={{ width: `${pct}%` }} />
         </div>
      </div>
   )
}
