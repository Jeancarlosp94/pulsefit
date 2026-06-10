import { useEffect, useState } from 'react'
import { Timer, X } from 'lucide-react'
import { cn } from '@/utils'

interface RestTimerProps {
   /** Segundos prescritos para el descanso. */
   seconds: number
   /** Callback cuando el countdown llega a cero. */
   onComplete?: () => void
   /** Cerrar manualmente. */
   onClose: () => void
}

/**
 * Cronómetro sticky de descanso entre series. Cuenta hacia atrás desde
 * `seconds` y dispara `onComplete` al llegar a 0. Visualmente cambia a
 * primary cuando faltan 5s o menos para avisar que está por terminar.
 */
export const RestTimer = ({ seconds, onComplete, onClose }: RestTimerProps) => {
   const [remaining, setRemaining] = useState(seconds)

   useEffect(() => {
      setRemaining(seconds)
   }, [seconds])

   useEffect(() => {
      if (remaining <= 0) {
         onComplete?.()
         return
      }
      const id = window.setInterval(() => {
         setRemaining((r) => Math.max(0, r - 1))
      }, 1000)
      return () => window.clearInterval(id)
   }, [remaining, onComplete])

   const mins = Math.floor(remaining / 60)
   const secs = remaining % 60
   const display = `${mins}:${String(secs).padStart(2, '0')}`
   const closeToEnd = remaining <= 5 && remaining > 0

   return (
      <div
         className={cn(
            'fixed bottom-20 left-1/2 z-30 -translate-x-1/2 transform rounded-full border bg-background px-4 py-2 shadow-lg transition-colors',
            closeToEnd
               ? 'border-primary bg-primary/10 text-primary'
               : 'border-border text-foreground'
         )}
         role='timer'
         aria-live='polite'
      >
         <div className='flex items-center gap-3'>
            <Timer
               className={cn('h-4 w-4', closeToEnd ? 'text-primary' : 'text-muted-foreground')}
            />
            <span className='font-mono text-base font-medium tabular-nums'>{display}</span>
            <button
               type='button'
               onClick={onClose}
               aria-label='Cerrar cronómetro'
               className='text-muted-foreground hover:text-foreground'
            >
               <X className='h-3.5 w-3.5' />
            </button>
         </div>
      </div>
   )
}
