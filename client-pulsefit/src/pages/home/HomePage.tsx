import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
   UtensilsCrossed,
   CalendarDays,
   Dumbbell,
   ChevronRight,
   Scale,
   LifeBuoy,
   Sparkles
} from 'lucide-react'
import { AppShell } from '@/layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
   MealsPerDayDialog,
   MealLogDialog,
   WeightLogDialog,
   QuickActionFAB,
   RescueDialog
} from '@/components'
import {
   WelcomeCard,
   MealsRowCard,
   MacrosProgressCard,
   WaterTrackerCard,
   MoodCheckCard
} from '@/components/home'
import { useAuth } from '@/hooks/useAuth'
import { useTodayState } from '@/hooks/useTodayState'
import { useMealPlan } from '@/hooks/useMealPlan'
import type { ItfMealOfToday } from '@/interface/itfMeals'

/** Stagger sutil: cada card aparece 50 ms después de la anterior. */
const STAGGER_DELAY = 0.05

const HomePage = () => {
   const { profile, user } = useAuth()
   const navigate = useNavigate()
   const [dialogOpen, setDialogOpen] = useState(false)
   const [logTarget, setLogTarget] = useState<ItfMealOfToday | null>(null)
   const [weightOpen, setWeightOpen] = useState(false)
   const [rescueOpen, setRescueOpen] = useState(false)
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

   /* Microinteracciones — respetan prefers-reduced-motion. */
   const reduceMotion = useReducedMotion()
   const fadeIn = (idx: number) =>
      reduceMotion
         ? {}
         : {
              initial: { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.25, delay: idx * STAGGER_DELAY, ease: 'easeOut' as const }
           }
   const tapScale = reduceMotion ? {} : { whileTap: { scale: 0.97 } }

   /* Generamos un index incremental para el stagger. */
   let stagger = 0
   const next = () => stagger++

   return (
      <AppShell userName={displayName}>
         <div className='space-y-4'>
            {/* Saludo dinámico + contexto del día */}
            <motion.div {...fadeIn(next())}>
               <WelcomeCard name={displayName} state={state} />
            </motion.div>

            {/* Mood check-in del día (aparece solo si no respondió hoy) */}
            <motion.div {...fadeIn(next())}>
               <MoodCheckCard />
            </motion.div>

            {/* Banner: configurar comidas (solo si nunca configuró) */}
            {needsMealsConfig ? (
               <motion.div {...fadeIn(next())}>
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
               </motion.div>
            ) : null}

            {/* Sin plan: invitar a generar uno */}
            {!state.hasPlan ? (
               <motion.div {...fadeIn(next())} {...tapScale}>
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
               </motion.div>
            ) : null}

            {/* Comidas de hoy (scroll horizontal) */}
            <motion.div {...fadeIn(next())}>
               <MealsRowCard meals={state.meals} onTapMeal={handleTapMeal} />
            </motion.div>

            {/* Progreso de macros del día */}
            <motion.div {...fadeIn(next())}>
               <MacrosProgressCard state={state} />
            </motion.div>

            {/* "Hoy no puedo" — abre el flujo de rescates adaptativos */}
            <motion.div {...fadeIn(next())} {...tapScale}>
               <Card
                  className='cursor-pointer border-secondary/30 bg-secondary/5 transition-colors hover:bg-secondary/10'
                  onClick={() => setRescueOpen(true)}
               >
                  <CardContent className='flex items-center justify-between gap-3 pt-6'>
                     <div className='flex items-start gap-3'>
                        <LifeBuoy className='mt-0.5 h-5 w-5 shrink-0 text-secondary' />
                        <div className='space-y-0.5'>
                           <p className='text-sm font-medium'>Hoy no puedo</p>
                           <p className='text-xs text-muted-foreground'>
                              Sin tiempo, sin energía, sin ingredientes… te damos 3 opciones que sí.
                           </p>
                        </div>
                     </div>
                     <ChevronRight className='h-4 w-4 text-muted-foreground' />
                  </CardContent>
               </Card>
            </motion.div>

            {/* Hidratación del día */}
            <motion.div {...fadeIn(next())}>
               <WaterTrackerCard targetGlasses={targetGlasses} />
            </motion.div>

            {/* Registrar peso (quick action) */}
            <motion.div {...fadeIn(next())} {...tapScale}>
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
            </motion.div>

            {/* Atajo a rutina */}
            <motion.div {...fadeIn(next())} {...tapScale}>
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
            </motion.div>

            {/* Revisión semanal */}
            <motion.div {...fadeIn(next())} {...tapScale}>
               <Card
                  className='cursor-pointer border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10'
                  onClick={() => navigate('/revision')}
               >
                  <CardContent className='flex items-center justify-between gap-3 pt-6'>
                     <div className='flex items-start gap-3'>
                        <Sparkles className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                        <div className='space-y-0.5'>
                           <p className='text-sm font-medium'>Revisar mi semana</p>
                           <p className='text-xs text-muted-foreground'>
                              Tu resumen con IA + ajustes propuestos al plan.
                           </p>
                        </div>
                     </div>
                     <ChevronRight className='h-4 w-4 text-muted-foreground' />
                  </CardContent>
               </Card>
            </motion.div>

            {/* Atajo a perfil */}
            <motion.div {...fadeIn(next())} {...tapScale}>
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
            </motion.div>
         </div>

         <MealsPerDayDialog open={dialogOpen} onOpenChange={setDialogOpen} />
         <WeightLogDialog open={weightOpen} onOpenChange={setWeightOpen} />
         <RescueDialog open={rescueOpen} onOpenChange={setRescueOpen} />

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
