import { useNavigate } from 'react-router-dom'
import { LifeBuoy, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AdherenceAlertCardProps {
   /** % adherencia detectada (0-100). */
   pct: number
   /** Sugerencia compasiva. */
   message: string
   /** Tap = el usuario cierra el banner por hoy. */
   onDismiss: () => void
   /** Tap = el usuario quiere ajustar el plan. Lleva al PlanPage para regenerar. */
   onAdjustPlan?: () => void
}

/**
 * Banner amistoso cuando detectamos adherencia crítica.
 * NO bloquea la app. Ofrece dos caminos:
 *   - "Ajustar mi plan" → lleva a PlanPage para regenerar con plan más light.
 *   - "Sigo así por ahora" → cierra el banner (vuelve a aparecer la próxima semana).
 */
export const AdherenceAlertCard = ({
   pct,
   message,
   onDismiss,
   onAdjustPlan
}: AdherenceAlertCardProps) => {
   const navigate = useNavigate()

   const handleAdjust = () => {
      if (onAdjustPlan) onAdjustPlan()
      else navigate('/plan')
   }

   return (
      <Card className='border-secondary/40 bg-secondary/5'>
         <CardContent className='space-y-3 pt-6'>
            <div className='flex items-start gap-3'>
               <LifeBuoy className='mt-0.5 h-5 w-5 shrink-0 text-secondary' />
               <div className='flex-1 space-y-1'>
                  <p className='text-sm font-medium'>Tu plan te quedó grande</p>
                  <p className='text-xs text-muted-foreground'>{message}</p>
                  <p className='text-[10px] text-muted-foreground'>
                     (Adherencia últimos 14 días: {pct}%)
                  </p>
               </div>
               <button
                  type='button'
                  onClick={onDismiss}
                  aria-label='Cerrar por ahora'
                  className='text-muted-foreground transition-colors hover:text-foreground'
               >
                  <X className='h-4 w-4' />
               </button>
            </div>
            <div className='grid grid-cols-2 gap-2'>
               <Button variant='outline' size='sm' onClick={onDismiss}>
                  Sigo así por ahora
               </Button>
               <Button size='sm' onClick={handleAdjust}>
                  Ajustar mi plan
               </Button>
            </div>
         </CardContent>
      </Card>
   )
}
