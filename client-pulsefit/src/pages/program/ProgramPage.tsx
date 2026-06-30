import { useNavigate } from 'react-router-dom'
import { Sparkles, Calendar, Target, Loader2, Trash2 } from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useActiveProgram, useActivePhase, useCancelActiveProgram } from '@/hooks/usePrograms'
import { MODALITY_EMOJI, MODALITY_LABEL, FOCUS_LABEL } from '@/features/program-engine'
import { cn } from '@/utils'

const GOAL_LABEL: Record<string, string> = {
   lose_weight: '🌱 Bajar peso',
   gain_muscle: '💪 Ganar músculo',
   feel_better: '🌿 Sentirme mejor',
   event: '🏃 Preparar evento',
   maintenance: '⚖️ Mantenimiento'
}

const ProgramPage = () => {
   const navigate = useNavigate()
   const { profile } = useAuth()
   const query = useActiveProgram()
   const activePhase = useActivePhase()
   const cancel = useCancelActiveProgram()

   if (query.isLoading) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI title='Mi PulseFit' subtitle='Cargando tu programa…' />
            <div className='flex items-center justify-center py-12 text-muted-foreground'>
               <Loader2 className='h-5 w-5 animate-spin' />
            </div>
         </AppShell>
      )
   }

   const program = query.data
   if (!program) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI title='Mi PulseFit' subtitle='Arma tu programa multi-fase con meta clara.' />
            <EmptyState
               icon={Sparkles}
               title='Aún sin programa activo'
               description='Crea un programa con fases (ej: HIIT → Yoga → Gym) y la app te acompaña paso a paso.'
            />
            <Button onClick={() => navigate('/programa/crear')} className='mt-4 w-full' size='lg'>
               <Sparkles className='h-4 w-4' />
               Crear mi PulseFit
            </Button>
         </AppShell>
      )
   }

   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI
            title={program.name}
            subtitle={GOAL_LABEL[program.goal_type] ?? program.goal_type}
         />

         {/* Resumen header */}
         <Card className='mb-3 border-primary/30 bg-primary/5'>
            <CardContent className='space-y-2 pt-6 text-sm'>
               <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-primary' />
                  <span>
                     {program.total_weeks} semanas · empezó el {program.start_date.slice(0, 10)}
                  </span>
               </div>
               {program.target_weight_kg ? (
                  <div className='flex items-center gap-2'>
                     <Target className='h-4 w-4 text-primary' />
                     <span>Meta: {program.target_weight_kg} kg</span>
                  </div>
               ) : null}
            </CardContent>
         </Card>

         {/* Fase actual destacada */}
         {activePhase ? (
            <Card className='mb-3 border-2 border-primary'>
               <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2 text-base'>
                     <span aria-hidden='true' className='text-xl'>
                        {MODALITY_EMOJI[activePhase.phase.modality]}
                     </span>
                     Fase {activePhase.phase.phase_order}: {activePhase.phase.phase_name}
                  </CardTitle>
               </CardHeader>
               <CardContent className='space-y-2 text-sm'>
                  <p>
                     Semana {activePhase.week_in_phase} de {activePhase.phase.weeks} en esta fase ·
                     Semana {activePhase.week_in_program}/{program.total_weeks} total
                  </p>
                  <div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
                     <span>📅 {activePhase.phase.sessions_per_week} sesiones/sem</span>
                     <span>🎯 {FOCUS_LABEL[activePhase.phase.focus]}</span>
                     <span>⚡ Intensidad {activePhase.phase.intensity_target}</span>
                     <span>🏷️ {MODALITY_LABEL[activePhase.phase.modality]}</span>
                  </div>
                  {activePhase.phase.description ? (
                     <p className='border-t border-border pt-2 text-xs italic'>
                        "{activePhase.phase.description}"
                     </p>
                  ) : null}
               </CardContent>
            </Card>
         ) : (
            <Card className='mb-3 border-secondary/30 bg-secondary/5'>
               <CardContent className='pt-6 text-sm'>
                  <p>🎉 Programa terminado. ¡Bien hecho!</p>
                  <Button
                     onClick={() => navigate('/programa/crear')}
                     className='mt-3 w-full'
                     size='sm'
                  >
                     Crear nuevo programa
                  </Button>
               </CardContent>
            </Card>
         )}

         {/* Timeline de fases */}
         <Card className='mb-3'>
            <CardHeader className='pb-2'>
               <CardTitle className='text-sm'>Tus fases</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
               {[...program.phases]
                  .sort((a, b) => a.phase_order - b.phase_order)
                  .map((phase) => {
                     const isCurrent = activePhase?.phase.phase_order === phase.phase_order
                     return (
                        <div
                           key={phase.id}
                           className={cn(
                              'flex items-start gap-3 rounded-md border p-3 text-sm',
                              isCurrent
                                 ? 'border-primary bg-primary/5'
                                 : 'border-border bg-background'
                           )}
                        >
                           <span className='text-lg' aria-hidden='true'>
                              {MODALITY_EMOJI[phase.modality]}
                           </span>
                           <div className='flex-1 space-y-0.5'>
                              <p className='font-medium'>
                                 Fase {phase.phase_order}: {phase.phase_name}
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                 {MODALITY_LABEL[phase.modality]} · {phase.weeks} sem ·{' '}
                                 {phase.sessions_per_week}/sem
                              </p>
                           </div>
                           {isCurrent ? (
                              <span className='rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground'>
                                 Hoy
                              </span>
                           ) : null}
                        </div>
                     )
                  })}
            </CardContent>
         </Card>

         {/* Cancelar */}
         <Button
            variant='outline'
            size='sm'
            onClick={() => {
               if (window.confirm('¿Cancelar este programa? Tu historial se conserva.')) {
                  cancel.mutate()
               }
            }}
            className='w-full text-muted-foreground'
         >
            <Trash2 className='h-3.5 w-3.5' />
            Cancelar programa
         </Button>
      </AppShell>
   )
}

export default ProgramPage
