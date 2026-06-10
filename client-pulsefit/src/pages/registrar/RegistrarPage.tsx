import { useMemo, useState } from 'react'
import {
   Dumbbell,
   Loader2,
   Clock,
   Timer,
   Activity,
   AlertCircle,
   Sparkles,
   Heart
} from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { InfoTooltip } from '@/components/InfoTooltip'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useGenerateWorkout } from '@/hooks/useGenerateWorkout'
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
   const mutation = useGenerateWorkout()

   const today = useMemo(() => new Date().getDay(), [])

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
               description='Termina los 7 pasos y volvé acá para tu primera rutina personalizada.'
            />
         </AppShell>
      )
   }

   const data = mutation.data
   const session = data?.session

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
                  {session.blocks.map((b, i) => (
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
                        </CardContent>
                     </Card>
                  ))}

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
      </AppShell>
   )
}

export default RegistrarPage
