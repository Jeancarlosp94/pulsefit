import { Card, CardContent } from '@/components/ui/card'
import { getModalityNutritionTip } from '@/features/nutrition-engine'
import type { ItfModality } from '@/interface/itfPrograms'

/**
 * Sprint 11.14: card con tip nutricional contextualizado por modalidad
 * de la fase activa del programa.
 *
 * Se renderiza solo si el usuario tiene programa activo. El tip lo firma
 * Lucía y no reemplaza la distribución de macros — solo da timing práctico.
 */
interface ModalityNutritionCardProps {
   modality: ItfModality
}

export const ModalityNutritionCard = ({ modality }: ModalityNutritionCardProps) => {
   const tip = getModalityNutritionTip(modality)
   return (
      <Card className='border-accent/30 bg-accent/5'>
         <CardContent className='space-y-1 pt-6'>
            <div className='flex items-center gap-2'>
               <span aria-hidden='true' className='text-lg'>
                  {tip.emoji}
               </span>
               <p className='text-sm font-medium'>{tip.headline}</p>
            </div>
            <p className='text-xs text-muted-foreground'>{tip.detail}</p>
         </CardContent>
      </Card>
   )
}
