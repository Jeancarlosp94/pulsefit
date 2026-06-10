import { useMemo, useState } from 'react'
import {
   Dumbbell,
   Loader2,
   Clock,
   Timer,
   Activity,
   AlertCircle,
   Sparkles,
   Heart,
   PlayCircle,
   ClipboardCheck,
   TrendingUp,
   Play
} from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { InfoTooltip } from '@/components/InfoTooltip'
import { LogSetDialog } from '@/components/LogSetDialog'
import { WorkoutSessionView } from '@/components/workout'
import {
   findVideoUrlForExercise,
   suggestNextWeight,
   formatLastSession
} from '@/features/routine-generator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useGenerateWorkout } from '@/hooks/useGenerateWorkout'
import { useRecentLogsByExercise } from '@/hooks/useWorkoutLogs'
import type { ItfSessionFocus } from '@/features/routine-generator'
import { cn } from '@/utils'

interface FocusOption {
   value: ItfSessionFocus
   label: string
}

const FOCUS_OPTIONS: FocusOption[] = [
   { value: 'full_body', label: 'Cuerpo completo' },
   { value: 'upper', label: 'Tren superior' },
   { value: 'lower', label: 'Tren inferior' },
   { value: 'core', label: 'Solo core' }
]

const RegistrarPage = () => {
   const { profile, onboardingCompleted } = useAuth()
   const [override, setOverride] = useState<ItfSessionFocus | undefined>(undefined)
   const [logTarget, setLogTarget] = useState<{
      exerciseId: string
      exerciseName: string
      sets: number
      reps: number
      suggestedWeight: number
   } | null>(null)
   const [executing, setExecuting] = useState(false)
   const mutation = useGenerateWorkout()

   const today = useMemo(() => new Date().getDay(), [])

   const data = mutation.data
   const session = data?.session

   /* Lookup batch de logs recientes para los ejercicios de la sesión actual. */
   const exerciseIds = useMemo(() => session?.blocks.map((b) => b.exercise_id) ?? [], [session])
   const recentLogsQuery = useRecentLogsByExercise(exerciseIds)
   const logsByExercise = recentLogsQuery.data ?? {}

   const handleGenerate = () => {
      mutation.mutate({ day_of_week: today, override_focus: override })
   }

   if (!onboardingCompleted) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI title='Hoy entrenamos' subtitle='Necesitamos terminar tu onboarding antes.' />
            <EmptyState
               icon={Sparkles}
               title='Falta tu onboarding'
               description='Termina los 7 pasos y vuelve aquí para tu primera rutina personalizada.'
            />
         </AppShell>
      )
   }

   /* Modo "ejecutando sesión": muestra la vista de ejecución y oculta
    * el generador. El usuario sale con onExit y vuelve al generador. */
   if (executing && data && session) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI
               title='En sesión 💪'
               subtitle='Marca cada serie como hecha. El cronómetro se activa solo.'
            />
            <WorkoutSessionView data={data} onExit={() => setExecuting(false)} />
         </AppShell>
      )
   }

   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI
            title='Hoy entrenamos 💪'
            subtitle='Te armamos una sesión que respeta tu nivel y tu tiempo.'
         />

         <div className='space-y-4'>
            {/* Selector de focus override */}
            <Card>
               <CardContent className='pt-6'>
                  <p className='mb-2 text-xs text-muted-foreground'>
                     Opcional: forzar el foco de hoy.
                  </p>
                  <div className='grid grid-cols-4 gap-2'>
                     <button
                        type='button'
                        onClick={() => setOverride(undefined)}
                        aria-pressed={override === undefined}
                        className={cn(
                           'rounded-md border p-2 text-xs transition-colors',
                           override === undefined
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted'
                        )}
                     >
                        Auto
                     </button>
                     {FOCUS_OPTIONS.map(({ value, label }) => (
                        <button
                           key={value}
                           type='button'
                           onClick={() => setOverride(value)}
                           aria-pressed={override === value}
                           className={cn(
                              'rounded-md border p-2 text-xs transition-colors',
                              override === value
                                 ? 'border-primary bg-primary/10 text-primary'
                                 : 'border-border text-muted-foreground hover:bg-muted'
                           )}
                        >
                           {label}
                        </button>
                     ))}
                  </div>
                  <Button
                     onClick={handleGenerate}
                     disabled={mutation.isPending}
                     className='mt-4 w-full'
                  >
                     {mutation.isPending ? (
                        <>
                           <Loader2 className='h-4 w-4 animate-spin' />
                           Preparando rutina…
                        </>
                     ) : (
                        <>
                           <Dumbbell className='h-4 w-4' />
                           Generar mi rutina
                        </>
                     )}
                  </Button>
               </CardContent>
            </Card>

            {!data && !mutation.isPending ? (
               <EmptyState
                  icon={Dumbbell}
                  title='Aún no generamos rutina'
                  description='Dale a "Generar mi rutina". Te armamos una sesión con calentamiento, ejercicios y cool-down.'
               />
            ) : null}

            {data && session ? (
               <>
                  {data.source === 'fallback' ? (
                     <Card className='border-secondary/40 bg-secondary/5'>
                        <CardContent className='flex items-start gap-3 pt-6 text-sm'>
                           <AlertCircle
                              className='mt-0.5 h-4 w-4 shrink-0 text-secondary'
                              aria-hidden='true'
                           />
                           <p>
                              Te traemos una rutina simple por ahora. Mañana volveremos con la
                              creatividad de siempre 🌿.
                           </p>
                        </CardContent>
                     </Card>
                  ) : null}

                  {data.isDeloadWeek ? (
                     <Card className='border-primary/40 bg-primary/5'>
                        <CardContent className='flex items-start gap-3 pt-6 text-sm'>
                           <Heart className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                           <p>
                              Esta es semana de descarga. Bajamos un poco la intensidad para que tu
                              cuerpo absorba lo trabajado 🌊.
                           </p>
                        </CardContent>
                     </Card>
                  ) : null}

                  {/* Resumen */}
                  <Card>
                     <CardContent className='grid grid-cols-3 gap-3 pt-6 text-center text-sm'>
                        <div>
                           <p className='text-xs text-muted-foreground'>Foco</p>
                           <p className='font-medium capitalize'>{data.focus.replace('_', ' ')}</p>
                        </div>
                        <div>
                           <p className='text-xs text-muted-foreground'>Duración</p>
                           <p className='font-medium'>{session.estimated_total_min} min</p>
                        </div>
                        <div>
                           <p className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                              RPE objetivo
                              <InfoTooltip topic='rpe' />
                           </p>
                           <p className='font-medium'>{data.prescribedRpe}/10</p>
                        </div>
                     </CardContent>
                  </Card>

                  {/* Empezar entrenamiento */}
                  <Button onClick={() => setExecuting(true)} className='w-full' size='lg'>
                     <Play className='h-4 w-4' />
                     Empezar entrenamiento
                  </Button>

                  {/* Warmup */}
                  <Card>
                     <CardHeader className='pb-3'>
                        <CardTitle className='flex items-center gap-2 text-base'>
                           <Activity className='h-4 w-4 text-primary' />
                           Calentamiento · {session.warmup.duration_min} min
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <ul className='space-y-1 text-sm text-muted-foreground'>
                           {session.warmup.movements.map((m, i) => (
                              <li key={i}>• {m}</li>
                           ))}
                        </ul>
                     </CardContent>
                  </Card>

                  {/* Bloques */}
                  {session.blocks.map((b, i) => {
                     const videoUrl = findVideoUrlForExercise(b.name)
                     const recentLogs = logsByExercise[b.exercise_id] ?? []
                     const lastLog = recentLogs[0]
                     /* b.reps puede venir como "8" o "8-12". Parseamos el primer número. */
                     const repsNumber = Number.parseInt(String(b.reps).match(/\d+/)?.[0] ?? '8', 10)
                     const suggestion = suggestNextWeight({
                        recentLogs,
                        targetRpe: data.prescribedRpe,
                        isCompound: true /* asumimos compound por default; el motor no lo expone aún */,
                        prescribedReps: repsNumber,
                        isDeloadWeek: data.isDeloadWeek
                     })
                     return (
                        <Card key={b.exercise_id}>
                           <CardHeader className='pb-3'>
                              <CardTitle className='flex items-center justify-between text-base'>
                                 <span>
                                    {i + 1}. {b.name}
                                 </span>
                                 <span className='text-xs font-normal text-muted-foreground'>
                                    {b.sets} × {b.reps}
                                 </span>
                              </CardTitle>
                           </CardHeader>
                           <CardContent className='space-y-2 text-sm'>
                              <p className='italic text-muted-foreground'>"{b.tip}"</p>
                              {videoUrl ? (
                                 <a
                                    href={videoUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline'
                                 >
                                    <PlayCircle className='h-3.5 w-3.5' />
                                    Ver técnica en YouTube
                                 </a>
                              ) : null}

                              {/* Última vez + sugerencia de progresión */}
                              {lastLog ? (
                                 <div className='rounded-md border border-border bg-muted/30 p-2 text-xs'>
                                    <div className='flex items-center gap-1.5 text-muted-foreground'>
                                       <ClipboardCheck className='h-3 w-3' />
                                       <span>
                                          Última vez:{' '}
                                          <span className='font-medium text-foreground'>
                                             {formatLastSession(lastLog)}
                                          </span>
                                       </span>
                                    </div>
                                    {suggestion.kind === 'progress' ? (
                                       <div className='mt-1 flex items-start gap-1.5 text-primary'>
                                          <TrendingUp className='mt-0.5 h-3 w-3 shrink-0' />
                                          <span>{suggestion.reason}</span>
                                       </div>
                                    ) : (
                                       <p className='mt-1 text-muted-foreground'>
                                          {suggestion.reason}
                                       </p>
                                    )}
                                 </div>
                              ) : null}

                              <Separator />
                              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                                 <span className='flex items-center gap-1'>
                                    <Timer className='h-3.5 w-3.5' />
                                    Descanso {b.rest_sec}s
                                 </span>
                                 <span className='flex items-center gap-1'>
                                    <Clock className='h-3.5 w-3.5' />
                                    {b.sets * 30}s aprox.
                                 </span>
                              </div>

                              <Button
                                 type='button'
                                 variant='outline'
                                 size='sm'
                                 onClick={() =>
                                    setLogTarget({
                                       exerciseId: b.exercise_id,
                                       exerciseName: b.name,
                                       sets: b.sets,
                                       reps: repsNumber,
                                       suggestedWeight: suggestion.weightKg
                                    })
                                 }
                                 className='w-full'
                              >
                                 <ClipboardCheck className='h-3.5 w-3.5' />
                                 Registrar set
                              </Button>
                           </CardContent>
                        </Card>
                     )
                  })}

                  {/* Cooldown */}
                  <Card>
                     <CardHeader className='pb-3'>
                        <CardTitle className='flex items-center gap-2 text-base'>
                           <Heart className='h-4 w-4 text-accent' />
                           Cool-down · {session.cooldown.duration_min} min
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <ul className='space-y-1 text-sm text-muted-foreground'>
                           {session.cooldown.movements.map((m, i) => (
                              <li key={i}>• {m}</li>
                           ))}
                        </ul>
                     </CardContent>
                  </Card>
               </>
            ) : null}
         </div>

         {logTarget ? (
            <LogSetDialog
               open={true}
               onOpenChange={(v) => {
                  if (!v) setLogTarget(null)
               }}
               exerciseId={logTarget.exerciseId}
               exerciseName={logTarget.exerciseName}
               prescribedSets={logTarget.sets}
               prescribedReps={logTarget.reps}
               suggestedWeightKg={logTarget.suggestedWeight}
            />
         ) : null}
      </AppShell>
   )
}

export default RegistrarPage
