import { Droplet, Minus, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useTodayWater, useAddWater } from '@/hooks/useWaterLogs'
import { cn } from '@/utils'

interface WaterTrackerCardProps {
   /** Vasos objetivo del día (típicamente derivados de hidratación = ml/250). */
   targetGlasses?: number
}

/**
 * Card de hidratación. Muestra una fila de chips visuales (vasos)
 * + botones para sumar/restar.
 *
 * Usa optimistic update: el contador reacciona al instante aunque la
 * red tarde.
 */
export const WaterTrackerCard = ({ targetGlasses = 8 }: WaterTrackerCardProps) => {
   const { data } = useTodayWater()
   const addWater = useAddWater()
   const count = data?.count ?? 0
   const display = Math.max(targetGlasses, count) /* chips visibles */

   return (
      <Card>
         <CardContent className='space-y-3 pt-6'>
            <div className='flex items-center justify-between'>
               <div className='flex items-center gap-2 text-sm'>
                  <Droplet className='h-4 w-4 text-primary' />
                  <span className='font-medium'>Agua hoy</span>
               </div>
               <span className='text-xs text-muted-foreground'>
                  {count}/{targetGlasses}
               </span>
            </div>

            <div className='flex flex-wrap items-center gap-1.5'>
               {Array.from({ length: display }).map((_, i) => {
                  const filled = i < count
                  return (
                     <div
                        key={i}
                        className={cn(
                           'h-6 w-4 rounded-sm border transition-colors',
                           filled ? 'border-primary bg-primary/30' : 'border-border bg-muted/40'
                        )}
                        aria-label={filled ? 'Vaso lleno' : 'Vaso vacío'}
                     />
                  )
               })}
            </div>

            <div className='flex items-center justify-end gap-1.5'>
               <button
                  type='button'
                  onClick={() => addWater.mutate(-1)}
                  disabled={count === 0 || addWater.isPending}
                  aria-label='Quitar un vaso'
                  className='flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30'
               >
                  <Minus className='h-3.5 w-3.5' />
               </button>
               <button
                  type='button'
                  onClick={() => addWater.mutate(1)}
                  disabled={addWater.isPending}
                  aria-label='Agregar un vaso'
                  className='flex h-8 w-8 items-center justify-center rounded-md border border-primary bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-30'
               >
                  <Plus className='h-3.5 w-3.5' />
               </button>
            </div>
         </CardContent>
      </Card>
   )
}
