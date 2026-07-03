import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ProfessionalResourcesModal } from '@/components/safety'
import { useMoodAlert } from '@/hooks/useMoodAlert'
import {
   UtensilsCrossed,
   CalendarDays,
   Dumbbell,
   ChevronRight,
   Scale,
   LifeBuoy,
   Sparkles,
   Target
} from 'lucide-react'
import { useActiveProgram, useActivePhase } from '@/hooks/usePrograms'
import { MODALITY_EMOJI, MODALITY_LABEL } from '@/features/program-engine'
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
   MoodCheckCard,
   AdherenceAlertCard,
   KcalBurnedCard
} from '@/components/home'
import { useAdherenceAlert } from '@/hooks/useAdherenceAlert'
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
   const [moodAlertOpen, setMoodAlertOpen] = useState(false)
   const [adherenceDismissed, setAdherenceDismissed] = useState(false)
   const moodAlert = useMoodAlert()
   const adherenceAlert = useAdherenceAlert()
   const activeProgram = useActiveProgram()
   const activePhase = useActivePhase()

   /* Si detectamos mood persistente bajo, mostramos el modal una vez al cargar
    * el Home. Severity=high es de auto-show; medium se ofrece como sugerencia. */
   useEffect(() => {
      if (moodAlert.data?.severity === 'high' || moodAlert.data?.severity === 'medium') {
         setMoodAlertOpen(true)
      }
   }, [moodAlert.data?.severity])
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

            {/* Sprint 11.10: card de programa activo o CTA "Crear mi PulseFit" */}
            <motion.div {...fadeIn(next())} {...tapScale}>
               {activeProgram.data && activePhase ? (
                  <Card
                     className='cursor-pointer border-primary/40 bg-primary/5 transition-colors hover:bg-primary/10'
                     onClick={() => navigate('/programa')}
                  >
                     <CardContent className='space-y-2 pt-6'>
                        <div className='flex items-center justify-between gap-3'>
                           <div className='flex items-start gap-3'>
                              <Target className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                              <div className='space-y-0.5'>
                                 <p className='text-sm font-medium'>{activeProgram.data.name}</p>
                                 <p className='text-xs text-muted-foreground'>
                                    Semana {activePhase.week_in_program}/
                                    {activeProgram.data.total_weeks} · Fase{' '}
                                    {activePhase.phase.phase_order}
                                 </p>
                              </div>
                           </div>
                           <ChevronRight className='h-4 w-4 text-muted-foreground' />
                        </div>
                        <div className='flex items-center gap-2 rounded-md border border-primary/20 bg-background p-2 text-xs'>
                           <span aria-hidden='true' className='text-base'>
                              {MODALITY_EMOJI[activePhase.phase.modality]}
                           </span>
                           <span>
                              <strong>{activePhase.phase.phase_name}</strong> ·{' '}
                              {MODALITY_LABEL[activePhase.phase.modality]} ·{' '}
                              {activePhase.phase.sessions_per_week} sesiones/sem
                           </span>
                        </div>
                     </CardContent>
                  </Card>
               ) : !activeProgram.isLoading ? (
                  <Card
                     className='cursor-pointer border-2 border-dashed border-primary/40 bg-background transition-colors hover:bg-primary/5'
                     onClick={() => navigate('/programa/crear')}
                  >
                     <CardContent className='flex items-center justify-between gap-3 pt-6'>
                        <div className='flex items-start gap-3'>
                           <Sparkles className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                           <div className='space-y-0.5'>
                              <p className='text-sm font-medium'>Crear mi PulseFit ⚡</p>
                              <p className='text-xs text-muted-foreground'>
                                 Arma tu programa con fases (HIIT → Yoga → Gym). La app te acompaña
                                 paso a paso.
                              </p>
                           </div>
                        </div>
                        <ChevronRight className='h-4 w-4 text-muted-foreground' />
                     </CardContent>
                  </Card>
               ) : null}
            </motion.div>

            {/* Alerta de adherencia crítica (< 20% en 14 días). Sin juicio. */}
            {adherenceAlert.data?.critical && !adherenceDismissed ? (
               <motion.div {...fadeIn(next())}>
                  <AdherenceAlertCard
                     pct={adherenceAlert.data.pct}
                     message={adherenceAlert.data.suggestion ?? 'Probemos algo más realista 🌿'}
                     onDismiss={() => setAdherenceDismissed(true)}
                  />
               </motion.div>
            ) : null}

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

            {/* Sprint 11.13: kcal quemadas hoy (se auto-oculta si es 0). */}
            <motion.div {...fadeIn(next())}>
               <KcalBurnedCard consumedKcal={state.consumed.kcal} targetKcal={state.targetKcal} />
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

         <ProfessionalResourcesModal
            open={moodAlertOpen}
            onOpenChange={setMoodAlertOpen}
            countryCode={(profile?.country_code as string | null) ?? null}
            reason={moodAlert.data?.reason ?? null}
            severity={moodAlert.data?.severity ?? null}
         />

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
