import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnboardingFooterProps {
   onBack?: () => void
   nextLabel?: string
   nextType?: 'button' | 'submit'
   isFirst?: boolean
   isLast?: boolean
   isLoading?: boolean
   disabled?: boolean
}

/**
 * Footer fijo del wizard con botones atrás / siguiente.
 * No muestra "atrás" en el step 1. En step 7 cambia el label a "Terminar".
 */
export const OnboardingFooter = ({
   onBack,
   nextLabel,
   nextType = 'submit',
   isFirst = false,
   isLast = false,
   isLoading = false,
   disabled = false
}: OnboardingFooterProps) => {
   const label = nextLabel ?? (isLast ? 'Terminar 🌱' : 'Siguiente')
   return (
      <div className='mt-8 flex items-center gap-3'>
         {!isFirst ? (
            <Button
               type='button'
               variant='ghost'
               onClick={onBack}
               disabled={isLoading}
               className='flex-1'
            >
               <ArrowLeft className='h-4 w-4' />
               Atrás
            </Button>
         ) : null}
         <Button type={nextType} className='flex-1' disabled={disabled || isLoading}>
            {isLoading ? (
               <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
               <>
                  {label}
                  {!isLast ? <ArrowRight className='h-4 w-4' /> : null}
               </>
            )}
         </Button>
      </div>
   )
}
