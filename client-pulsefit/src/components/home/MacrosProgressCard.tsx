import { Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MacroBar } from './MacroBar'
import type { ItfTodayState } from '@/interface/itfMeals'

interface MacrosProgressCardProps {
   state: ItfTodayState
}

export const MacrosProgressCard = ({ state }: MacrosProgressCardProps) => {
   if (!state.hasPlan || state.meals.length === 0) return null
   return (
      <Card>
         <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-base'>
               <Flame className='h-4 w-4 text-primary' />
               Tu día
            </CardTitle>
         </CardHeader>
         <CardContent className='space-y-3'>
            <MacroBar
               label='Calorías'
               consumed={state.consumed.kcal}
               target={state.targetKcal}
               unit=' kcal'
               colorClass='bg-primary'
            />
            <MacroBar
               label='Proteína'
               consumed={state.consumed.proteinG}
               target={state.targetProteinG}
               colorClass='bg-accent'
            />
            <MacroBar
               label='Carbos'
               consumed={state.consumed.carbsG}
               target={state.targetCarbsG}
               colorClass='bg-secondary'
            />
            <MacroBar
               label='Grasas'
               consumed={state.consumed.fatsG}
               target={state.targetFatsG}
               colorClass='bg-primary/60'
            />
         </CardContent>
      </Card>
   )
}
