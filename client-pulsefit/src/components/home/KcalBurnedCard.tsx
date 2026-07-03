import { Flame } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useTodayCaloriesBurned } from '@/hooks/useWorkoutLogs'

/**
 * Sprint 11.13: card que muestra las kcal quemadas HOY.
 * Suma workout_logs.calories_burned del día en curso.
 *
 * Se oculta si el usuario aún no ha loggeado ninguna actividad hoy —
 * evita ocupar espacio visual con un "0 kcal" que no aporta información.
 */
interface KcalBurnedCardProps {
   /** kcal consumidas hoy (comidas). Opcional; si viene, muestra balance neto. */
   consumedKcal?: number
   targetKcal?: number
}

export const KcalBurnedCard = ({ consumedKcal, targetKcal }: KcalBurnedCardProps) => {
   const burnedQuery = useTodayCaloriesBurned()
   const burned = burnedQuery.data ?? 0

   if (burned <= 0) return null

   const showBalance =
      typeof consumedKcal === 'number' && typeof targetKcal === 'number' && targetKcal > 0
   const netBalance = showBalance ? (consumedKcal as number) - burned : null

   return (
      <Card className='border-primary/20 bg-primary/5'>
         <CardContent className='flex items-center justify-between gap-3 pt-6'>
            <div className='flex items-start gap-3'>
               <Flame className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
               <div className='space-y-0.5'>
                  <p className='text-sm font-medium'>{burned} kcal quemadas hoy 🔥</p>
                  {showBalance ? (
                     <p className='text-xs text-muted-foreground'>
                        Balance neto ~{netBalance} kcal · Meta {targetKcal} kcal
                     </p>
                  ) : (
                     <p className='text-xs text-muted-foreground'>
                        Suma de tus rutinas y actividades registradas hoy.
                     </p>
                  )}
               </div>
            </div>
         </CardContent>
      </Card>
   )
}
