import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Check, ChevronLeft, Loader2, ScrollText, Sparkles } from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApplyReview, useComposeWeeklyReview } from '@/hooks/useWeeklyReview'
import { useAuth } from '@/hooks/useAuth'
import type { ItfAdjustment } from '@/features/review-engine'
import { cn } from '@/utils'

const PRIORITY_LABEL: Record<ItfAdjustment['priority'], string> = {
   high: 'Importante',
   medium: 'Sugerido',
   low: 'Opcional'
}

const PRIORITY_CLASS: Record<ItfAdjustment['priority'], string> = {
   high: 'border-primary/40 bg-primary/5',
   medium: 'border-secondary/30 bg-secondary/5',
   low: 'border-border bg-background'
}

const WeeklyReviewPage = () => {
   const navigate = useNavigate()
   const { profile, onboardingCompleted } = useAuth()
   const query = useComposeWeeklyReview()
   const applyReview = useApplyReview()
   const [accepted, setAccepted] = useState<Set<string>>(new Set())

   /* Por default pre-aceptamos los high-priority. */
   const data = query.data
   useMemo(() => {
      if (data && accepted.size === 0) {
         setAccepted(
            new Set(data.adjustments.filter((a) => a.priority === 'high').map((a) => a.id))
         )
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [data?.adjustments.length])

   if (!onboardingCompleted) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI title='Tu semana' subtitle='Necesitamos tu onboarding antes.' />
            <EmptyState
               icon={Calendar}
               title='Falta tu onboarding'
               description='Termina los 7 pasos y vuelve para tu primera revisión.'
            />
         </AppShell>
      )
   }

   if (query.isLoading) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI title='Tu semana' subtitle='Calculando tu resumen…' />
            <div className='flex items-center justify-center py-12 text-muted-foreground'>
               <Loader2 className='h-5 w-5 animate-spin' />
            </div>
         </AppShell>
      )
   }

   if (query.isError || !data) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI title='Tu semana' subtitle='No pudimos generar tu revisión.' />
            <EmptyState
               icon={ScrollText}
               title='Algo no salió como esperábamos'
               description='Inténtalo de nuevo en unos minutos 🌿'
            />
            <Button onClick={() => navigate('/home')} variant='outline' className='mt-4 w-full'>
               <ChevronLeft className='h-4 w-4' />
               Volver al inicio
            </Button>
         </AppShell>
      )
   }

   const toggleAdjustment = (id: string) => {
      setAccepted((prev) => {
         const next = new Set(prev)
         if (next.has(id)) next.delete(id)
         else next.add(id)
         return next
      })
   }

   const acceptAll = () => setAccepted(new Set(data.adjustments.map((a) => a.id)))

   const rejectAll = () => setAccepted(new Set())

   const handleApply = () => {
      const acceptedItems = data.adjustments.filter((a) => accepted.has(a.id))
      applyReview.mutate(
         { review: data, accepted: acceptedItems },
         { onSuccess: () => navigate('/home') }
      )
   }

   const { metrics, adjustments, summary } = data

   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI title='Tu semana' subtitle={`${metrics.week_start} → ${metrics.week_end}`} />

         <div className='space-y-4'>
            {/* === Resumen narrativo === */}
            <Card>
               <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                     <Sparkles className='h-4 w-4 text-primary' />
                     {summary.greeting}
                  </CardTitle>
               </CardHeader>
               <CardContent className='space-y-3 text-sm'>
                  <p className='text-foreground'>{summary.summary}</p>

                  {summary.highlights.length > 0 ? (
                     <div className='flex flex-wrap gap-1.5'>
                        {summary.highlights.map((h, i) => (
                           <span
                              key={i}
                              className='rounded-full border border-primary/30 bg-primary/5 px-2 py-1 text-xs text-foreground'
                           >
                              {h}
                           </span>
                        ))}
                     </div>
                  ) : null}

                  {summary.source === 'fallback' ? (
                     <p className='text-[10px] italic text-muted-foreground'>
                        Resumen generado sin IA en este momento.
                     </p>
                  ) : null}
               </CardContent>
            </Card>

            {/* === Métricas === */}
            <Card>
               <CardHeader className='pb-2'>
                  <CardTitle className='text-sm'>Tu semana en números</CardTitle>
               </CardHeader>
               <CardContent>
                  <div className='grid grid-cols-2 gap-2 text-center text-xs'>
                     <Metric label='Adherencia comidas' value={`${metrics.meal_adherence_pct}%`} />
                     <Metric label='Entrenamientos' value={metrics.workouts_count} />
                     <Metric
                        label='RPE promedio'
                        value={metrics.rpe_average !== null ? `${metrics.rpe_average}` : '—'}
                     />
                     <Metric
                        label='Cambio peso'
                        value={
                           metrics.weight_change_kg !== null
                              ? `${metrics.weight_change_kg > 0 ? '+' : ''}${metrics.weight_change_kg} kg`
                              : '—'
                        }
                     />
                     <Metric
                        label='Energía promedio'
                        value={
                           metrics.energy_average !== null ? `${metrics.energy_average}/5` : '—'
                        }
                     />
                     <Metric
                        label='Ánimo promedio'
                        value={metrics.mood_average !== null ? `${metrics.mood_average}/5` : '—'}
                     />
                     <Metric label='Vasos agua/día' value={metrics.water_avg_glasses} />
                     <Metric label='Rescates usados' value={metrics.rescues_used} />
                  </div>
               </CardContent>
            </Card>

            {/* === Ajustes propuestos === */}
            <Card>
               <CardHeader className='pb-2'>
                  <CardTitle className='text-sm'>{summary.adjustments_intro}</CardTitle>
               </CardHeader>
               <CardContent className='space-y-2'>
                  {adjustments.length === 0 ? (
                     <p className='py-2 text-xs text-muted-foreground'>
                        Sin ajustes esta semana. Vamos a seguir con el plan tal como está.
                     </p>
                  ) : (
                     <>
                        {adjustments.map((adj) => {
                           const isAccepted = accepted.has(adj.id)
                           return (
                              <button
                                 key={adj.id}
                                 type='button'
                                 onClick={() => toggleAdjustment(adj.id)}
                                 className={cn(
                                    'flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors',
                                    PRIORITY_CLASS[adj.priority],
                                    isAccepted && 'ring-2 ring-primary/40'
                                 )}
                              >
                                 <div
                                    className={cn(
                                       'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                                       isAccepted
                                          ? 'border-primary bg-primary text-primary-foreground'
                                          : 'border-border bg-background'
                                    )}
                                 >
                                    {isAccepted ? <Check className='h-3 w-3' /> : null}
                                 </div>
                                 <div className='space-y-1'>
                                    <p className='flex items-center gap-2 text-sm font-medium'>
                                       {adj.title}
                                       <span className='rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-muted-foreground'>
                                          {PRIORITY_LABEL[adj.priority]}
                                       </span>
                                    </p>
                                    <p className='text-xs text-muted-foreground'>{adj.reason}</p>
                                 </div>
                              </button>
                           )
                        })}

                        <div className='grid grid-cols-2 gap-2 pt-1'>
                           <Button variant='outline' size='sm' onClick={rejectAll}>
                              Mantener plan
                           </Button>
                           <Button variant='outline' size='sm' onClick={acceptAll}>
                              Aceptar todo
                           </Button>
                        </div>
                     </>
                  )}
               </CardContent>
            </Card>

            {/* === Closing === */}
            <Card className='border-primary/30 bg-primary/5'>
               <CardContent className='pt-6 text-center text-sm'>
                  <p>{summary.closing}</p>
               </CardContent>
            </Card>

            {/* === CTA === */}
            <Button
               onClick={handleApply}
               disabled={applyReview.isPending}
               size='lg'
               className='w-full'
            >
               {applyReview.isPending ? (
                  <>
                     <Loader2 className='h-4 w-4 animate-spin' />
                     Aplicando…
                  </>
               ) : (
                  'Aplicar y empezar nueva semana'
               )}
            </Button>
         </div>
      </AppShell>
   )
}

interface MetricProps {
   label: string
   value: string | number
}

const Metric = ({ label, value }: MetricProps) => (
   <div className='space-y-1 rounded-md border border-border bg-background p-2'>
      <p className='text-base font-medium tabular-nums'>{value}</p>
      <p className='text-[10px] text-muted-foreground'>{label}</p>
   </div>
)

export default WeeklyReviewPage
