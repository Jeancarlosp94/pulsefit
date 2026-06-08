import { Progress } from '@/components/ui/progress'

interface StepProgressProps {
   step: number
   total?: number
}

/** Barra "Paso X de N" cálida, centrada, no agresiva. */
export const StepProgress = ({ step, total = 7 }: StepProgressProps) => {
   const pct = Math.round((step / total) * 100)
   return (
      <div className='mb-6 space-y-2'>
         <Progress value={pct} aria-label={`Paso ${step} de ${total}`} />
         <p className='text-center text-xs text-muted-foreground'>
            Paso {step} de {total}
         </p>
      </div>
   )
}
