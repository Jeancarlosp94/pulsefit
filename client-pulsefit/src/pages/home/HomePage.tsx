import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, CalendarDays, Dumbbell, ChevronRight } from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MealsPerDayDialog } from '@/components'
import { useAuth } from '@/hooks/useAuth'
import { useMealPlan } from '@/hooks/useMealPlan'

const HomePage = () => {
   const { profile, user } = useAuth()
   const navigate = useNavigate()
   const [dialogOpen, setDialogOpen] = useState(false)
   const planQuery = useMealPlan()
   const plan = planQuery.data ?? null

   const displayName = profile?.name ?? user?.email?.split('@')[0]
   const mealsPerDay = (profile?.meals_per_day as number | null) ?? null
   /* Solo mostramos el banner cuando NUNCA configuró meals_per_day.
    * Si eligió 3 conscientemente en el onboarding, NO molestar más. */
   const needsMealsConfig = !mealsPerDay

   return (
      <AppShell userName={displayName}>
         <TitleUI
            title={`Hola${displayName ? `, ${displayName}` : ''} 👋`}
            subtitle='Tu coach personal. Empezá por donde quieras.'
         />

         <div className='space-y-4'>
            {needsMealsConfig ? (
               <Card className='border-primary/40 bg-primary/5'>
                  <CardContent className='space-y-3 pt-6 text-sm'>
                     <div className='flex items-start gap-3'>
                        <UtensilsCrossed
                           className='mt-0.5 h-5 w-5 shrink-0 text-primary'
                           aria-hidden='true'
                        />
                        <div className='space-y-1'>
                           <p className='font-medium text-foreground'>
                              ¿Cuántas comidas haces al día?
                           </p>
                           <p className='text-muted-foreground'>
                              Configuralo para que distribuyamos bien tus calorías y proteínas.
                           </p>
                        </div>
                     </div>
                     <Button type='button' size='sm' onClick={() => setDialogOpen(true)}>
                        Configurar mis comidas
                     </Button>
                  </CardContent>
               </Card>
            ) : null}

            {/* Atajo: plan de comidas */}
            <Card
               className='cursor-pointer transition-colors hover:bg-muted/40'
               onClick={() => navigate('/plan')}
            >
               <CardContent className='flex items-center justify-between gap-3 pt-6'>
                  <div className='flex items-start gap-3'>
                     <CalendarDays className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                     <div className='space-y-0.5'>
                        <p className='text-sm font-medium'>
                           {plan
                              ? `Tu plan de ${plan.days} ${plan.days === 1 ? 'día' : 'días'}`
                              : 'Generar plan de comidas'}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                           {plan
                              ? `${plan.target_kcal} kcal/día · ${plan.meals_per_day} comidas`
                              : 'Una semana completa en una sola operación.'}
                        </p>
                     </div>
                  </div>
                  <ChevronRight className='h-4 w-4 text-muted-foreground' />
               </CardContent>
            </Card>

            {/* Atajo: rutina */}
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

            {/* Atajo: perfil */}
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
                           Editá tus objetivos, preferencias y patrón alimentario.
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
