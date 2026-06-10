import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, CalendarDays, Dumbbell, ChevronRight, Scale } from 'lucide-react'
import { AppShell } from '@/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MealsPerDayDialog, MealLogDialog, WeightLogDialog, QuickActionFAB } from '@/components'
import { WelcomeCard, MealsRowCard, MacrosProgressCard, WaterTrackerCard } from '@/components/home'
import { useAuth } from '@/hooks/useAuth'
import { useTodayState } from '@/hooks/useTodayState'
import { useMealPlan } from '@/hooks/useMealPlan'
import type { ItfMealOfToday } from '@/interface/itfMeals'

const HomePage = () => {
   const { profile, user } = useAuth()
   const navigate = useNavigate()
   const [dialogOpen, setDialogOpen] = useState(false)
   const [logTarget, setLogTarget] = useState<ItfMealOfToday | null>(null)
   const [weightOpen, setWeightOpen] = useState(false)
   const { state } = useTodayState()
   const planQuery = useMealPlan()
   const plan = planQuery.data ?? null

   const displayName = profile?.name ?? user?.email?.split('@')[0] ?? null
   const mealsPerDay = (profile?.meals_per_day as number | null) ?? null
   const needsMealsConfig = !mealsPerDay

   /* Vasos objetivo = peso × 35 ml ÷ 250 ml/vaso. Default 8 si no hay peso. */
   const currentWeight = (profile?.current_weight_kg as number | null) ?? null
   const targetGlasses = currentWeight ? Math.max(6, Math.round((currentWeight * 35) / 250)) : 8

   /* Tap en card de comida: abre el dialog de 3 opciones.
    * Si ya está registrada, navegamos al Plan para ver el detalle. */
   const handleTapMeal = (meal: ItfMealOfToday) => {
      if (meal.status !== 'pending') {
         navigate('/plan')
         return
      }
      setLogTarget(meal)
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

            {/* Hidratación del día */}
            <WaterTrackerCard targetGlasses={targetGlasses} />

            {/* Registrar peso (quick action) */}
            <Card
               className='cursor-pointer transition-colors hover:bg-muted/40'
               onClick={() => setWeightOpen(true)}
            >
               <CardContent className='flex items-center justify-between gap-3 pt-6'>
                  <div className='flex items-start gap-3'>
                     <Scale className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                     <div className='space-y-0.5'>
                        <p className='text-sm font-medium'>Registrar peso</p>
                        <p className='text-xs text-muted-foreground'>
                           Una entrada por día. Sin presión.
                        </p>
                     </div>
                  </div>
                  <ChevronRight className='h-4 w-4 text-muted-foreground' />
               </CardContent>
            </Card>

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
         <WeightLogDialog open={weightOpen} onOpenChange={setWeightOpen} />

         <QuickActionFAB />

         {logTarget && plan && state.dayIndex !== null ? (
            <MealLogDialog
               open={true}
               onOpenChange={(v) => {
                  if (!v) setLogTarget(null)
               }}
               meal={logTarget}
               plan={plan}
               dayIndex={state.dayIndex}
            />
         ) : null}
      </AppShell>
   )
}

export default HomePage
