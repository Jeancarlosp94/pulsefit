import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, CalendarDays, Dumbbell, ChevronRight } from 'lucide-react'
import { AppShell } from '@/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MealsPerDayDialog } from '@/components'
import { WelcomeCard, MealsRowCard, MacrosProgressCard } from '@/components/home'
import { useAuth } from '@/hooks/useAuth'
import { useTodayState } from '@/hooks/useTodayState'
import { useLogMeal } from '@/hooks/useMealLogs'
import type { ItfMealOfToday } from '@/interface/itfMeals'

const HomePage = () => {
   const { profile, user } = useAuth()
   const navigate = useNavigate()
   const [dialogOpen, setDialogOpen] = useState(false)
   const { state } = useTodayState()
   const logMeal = useLogMeal()

   const displayName = profile?.name ?? user?.email?.split('@')[0] ?? null
   const mealsPerDay = (profile?.meals_per_day as number | null) ?? null
   const needsMealsConfig = !mealsPerDay

   /* Tap rápido en una comida del día: marca como "planned".
    * (En Sprint 7.2 abriremos un dialog con 3 opciones; por ahora tap único). */
   const handleTapMeal = (meal: ItfMealOfToday) => {
      if (meal.status !== 'pending') {
         /* Si ya está registrada, navegamos al plan para que la veas. */
         navigate('/plan')
         return
      }
      logMeal.mutate({
         plan_id: state.hasPlan ? undefined : undefined,
         day_index: state.dayIndex ?? undefined,
         meal_type: meal.meal_type,
         status: 'planned',
         recipe_name: meal.recipe_name,
         kcal: meal.plannedKcal,
         protein_g: meal.plannedProteinG,
         carbs_g: meal.plannedCarbsG,
         fats_g: meal.plannedFatsG
      })
   }

   return (
      <AppShell userName={displayName}>
         <div className='space-y-4'>
            {/* Saludo dinámico + contexto del día */}
            <WelcomeCard name={displayName} state={state} />

            {/* Banner: configurar comidas (solo si nunca configuró) */}
            {needsMealsConfig ? (
               <Card className='border-primary/40 bg-primary/5'>
                  <CardContent className='space-y-3 pt-6 text-sm'>
                     <div className='flex items-start gap-3'>
                        <UtensilsCrossed className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                        <div className='space-y-1'>
                           <p className='font-medium text-foreground'>
                              ¿Cuántas comidas haces al día?
                           </p>
                           <p className='text-muted-foreground'>
                              Configúralo para que distribuyamos bien tus calorías y proteínas.
                           </p>
                        </div>
                     </div>
                     <Button type='button' size='sm' onClick={() => setDialogOpen(true)}>
                        Configurar mis comidas
                     </Button>
                  </CardContent>
               </Card>
            ) : null}

            {/* Sin plan: invitar a generar uno */}
            {!state.hasPlan ? (
               <Card
                  className='cursor-pointer transition-colors hover:bg-muted/40'
                  onClick={() => navigate('/plan')}
               >
                  <CardContent className='flex items-center justify-between gap-3 pt-6'>
                     <div className='flex items-start gap-3'>
                        <CalendarDays className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                        <div className='space-y-0.5'>
                           <p className='text-sm font-medium'>Generar plan de comidas</p>
                           <p className='text-xs text-muted-foreground'>
                              Una semana completa en una sola operación.
                           </p>
                        </div>
                     </div>
                     <ChevronRight className='h-4 w-4 text-muted-foreground' />
                  </CardContent>
               </Card>
            ) : null}

            {/* Comidas de hoy (scroll horizontal) */}
            <MealsRowCard meals={state.meals} onTapMeal={handleTapMeal} />

            {/* Progreso de macros del día */}
            <MacrosProgressCard state={state} />

            {/* Atajo a rutina */}
            <Card
               className='cursor-pointer transition-colors hover:bg-muted/40'
               onClick={() => navigate('/registrar')}
            >
               <CardContent className='flex items-center justify-between gap-3 pt-6'>
                  <div className='flex items-start gap-3'>
                     <Dumbbell className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                     <div className='space-y-0.5'>
                        <p className='text-sm font-medium'>Entrenar hoy</p>
                        <p className='text-xs text-muted-foreground'>
                           Tu rutina ajustada al tiempo y equipo que tengas.
                        </p>
                     </div>
                  </div>
                  <ChevronRight className='h-4 w-4 text-muted-foreground' />
               </CardContent>
            </Card>

            {/* Atajo a perfil */}
            <Card
               className='cursor-pointer transition-colors hover:bg-muted/40'
               onClick={() => navigate('/perfil')}
            >
               <CardContent className='flex items-center justify-between gap-3 pt-6'>
                  <div className='flex items-start gap-3'>
                     <div className='mt-0.5 h-5 w-5 shrink-0 text-primary text-xl leading-5'>
                        👤
                     </div>
                     <div className='space-y-0.5'>
                        <p className='text-sm font-medium'>Mi perfil</p>
                        <p className='text-xs text-muted-foreground'>
                           Edita tus objetivos, preferencias y patrón alimentario.
                        </p>
                     </div>
                  </div>
                  <ChevronRight className='h-4 w-4 text-muted-foreground' />
               </CardContent>
            </Card>
         </div>

         <MealsPerDayDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </AppShell>
   )
}

export default HomePage
