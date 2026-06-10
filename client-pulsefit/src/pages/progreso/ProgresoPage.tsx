import { useState } from 'react'
import { Award, Scale, Heart, Dumbbell, Calendar } from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdherenceCard, StrengthChart, WeightChart, WellbeingChart } from '@/components/charts'
import { useAuth } from '@/hooks/useAuth'
import {
   useAdherenceSummary,
   useStrengthProgress,
   useWeightHistory,
   useWellbeingHistory
} from '@/hooks/useProgress'
import {
   useUserAchievements,
   useAllAchievements,
   useDetectNewAchievements
} from '@/hooks/useAchievements'
import { cn } from '@/utils'

type Tab = 'peso' | 'bienestar' | 'fuerza' | 'logros'

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
   { id: 'peso', label: 'Peso', icon: Scale },
   { id: 'bienestar', label: 'Bienestar', icon: Heart },
   { id: 'fuerza', label: 'Fuerza', icon: Dumbbell },
   { id: 'logros', label: 'Logros', icon: Award }
]

const ProgresoPage = () => {
   const { profile, onboardingCompleted } = useAuth()
   const [tab, setTab] = useState<Tab>('peso')

   /* Dispara detección de logros al cargar la página. */
   useDetectNewAchievements()

   const adherenceQuery = useAdherenceSummary()
   const weightQuery = useWeightHistory(90)
   const wellbeingQuery = useWellbeingHistory(30)
   const strengthQuery = useStrengthProgress()
   const userAchievements = useUserAchievements()
   const allAchievements = useAllAchievements()

   if (!onboardingCompleted) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI title='Tu progreso' subtitle='Necesitamos terminar tu onboarding antes.' />
            <EmptyState
               icon={Calendar}
               title='Falta tu onboarding'
               description='Termina los 7 pasos y vuelve aquí para ver tu progreso.'
            />
         </AppShell>
      )
   }

   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI title='Tu progreso' subtitle='Cada paso cuenta, también los que cuestan.' />

         {/* Adherencia siempre visible arriba */}
         {adherenceQuery.data ? (
            <div className='mb-4'>
               <AdherenceCard data={adherenceQuery.data} />
            </div>
         ) : null}

         {/* Tabs */}
         <div className='mb-3 grid grid-cols-4 gap-1'>
            {TABS.map(({ id, label, icon: Icon }) => (
               <button
                  key={id}
                  type='button'
                  onClick={() => setTab(id)}
                  aria-pressed={tab === id}
                  className={cn(
                     'flex flex-col items-center gap-0.5 rounded-md border p-2 text-xs transition-colors',
                     tab === id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                  )}
               >
                  <Icon className='h-3.5 w-3.5' />
                  {label}
               </button>
            ))}
         </div>

         <div className='space-y-4'>
            {tab === 'peso' ? (
               <Card>
                  <CardHeader className='pb-2'>
                     <CardTitle className='text-base'>Tu peso (90 días)</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <WeightChart data={weightQuery.data ?? []} />
                     {(weightQuery.data?.length ?? 0) >= 2 ? (
                        <WeightComparison data={weightQuery.data!} />
                     ) : null}
                  </CardContent>
               </Card>
            ) : null}

            {tab === 'bienestar' ? (
               <Card>
                  <CardHeader className='pb-2'>
                     <CardTitle className='text-base'>Energía y ánimo (30 días)</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <WellbeingChart data={wellbeingQuery.data ?? []} />
                  </CardContent>
               </Card>
            ) : null}

            {tab === 'fuerza' ? (
               <>
                  {(strengthQuery.data ?? []).length === 0 ? (
                     <EmptyState
                        icon={Dumbbell}
                        title='Aún sin registros de fuerza'
                        description='Cuando registres sets en Registrar, verás tu progresión aquí.'
                     />
                  ) : (
                     (strengthQuery.data ?? []).map((ex) => (
                        <Card key={ex.exercise_id}>
                           <CardHeader className='pb-2'>
                              <CardTitle className='flex items-center justify-between text-sm'>
                                 <span className='capitalize'>{ex.exercise_name}</span>
                                 <span className='text-xs font-normal text-muted-foreground'>
                                    PR: {ex.pr_kg} kg {ex.delta_kg > 0 ? `(+${ex.delta_kg})` : ''}
                                 </span>
                              </CardTitle>
                           </CardHeader>
                           <CardContent>
                              <StrengthChart exercise={ex} />
                           </CardContent>
                        </Card>
                     ))
                  )}
               </>
            ) : null}

            {tab === 'logros' ? (
               <AchievementsTab
                  unlocked={userAchievements.data ?? []}
                  catalog={allAchievements.data ?? []}
               />
            ) : null}
         </div>
      </AppShell>
   )
}

/* ============================================================
 *  Tab Logros
 * ============================================================ */
interface AchievementsTabProps {
   unlocked: Array<{
      id: string
      unlocked_at: string
      achievement: { id: string; code: string; name: string; description: string; icon: string }
   }>
   catalog: Array<{ id: string; code: string; name: string; description: string; icon: string }>
}

const AchievementsTab = ({ unlocked, catalog }: AchievementsTabProps) => {
   const unlockedCodes = new Set(unlocked.map((u) => u.achievement.code))
   const locked = catalog.filter((a) => !unlockedCodes.has(a.code))

   return (
      <>
         {unlocked.length > 0 ? (
            <Card>
               <CardHeader className='pb-2'>
                  <CardTitle className='text-sm'>Desbloqueados ({unlocked.length})</CardTitle>
               </CardHeader>
               <CardContent>
                  <div className='grid grid-cols-2 gap-2'>
                     {unlocked.map((u) => (
                        <AchievementBadge
                           key={u.id}
                           icon={u.achievement.icon}
                           name={u.achievement.name}
                           description={u.achievement.description}
                           unlockedAt={u.unlocked_at}
                        />
                     ))}
                  </div>
               </CardContent>
            </Card>
         ) : (
            <EmptyState
               icon={Award}
               title='Aún sin logros'
               description='Sigue registrando tu día y vamos a celebrar lo que vayas logrando.'
            />
         )}

         {locked.length > 0 ? (
            <Card>
               <CardHeader className='pb-2'>
                  <CardTitle className='text-sm text-muted-foreground'>Por desbloquear</CardTitle>
               </CardHeader>
               <CardContent>
                  <div className='grid grid-cols-2 gap-2'>
                     {locked.map((a) => (
                        <AchievementBadge
                           key={a.id}
                           icon={a.icon}
                           name={a.name}
                           description={a.description}
                           dimmed
                        />
                     ))}
                  </div>
               </CardContent>
            </Card>
         ) : null}
      </>
   )
}

interface BadgeProps {
   icon: string
   name: string
   description: string
   unlockedAt?: string
   dimmed?: boolean
}

const AchievementBadge = ({ icon, name, description, unlockedAt, dimmed }: BadgeProps) => (
   <div
      className={cn(
         'space-y-1 rounded-md border p-3 text-center text-xs',
         dimmed
            ? 'border-border bg-muted/30 text-muted-foreground'
            : 'border-primary/40 bg-primary/5'
      )}
   >
      <div className='text-2xl'>{icon}</div>
      <p className={cn('font-medium', dimmed ? 'text-muted-foreground' : 'text-foreground')}>
         {name}
      </p>
      <p className='text-[10px] leading-tight text-muted-foreground'>{description}</p>
      {unlockedAt ? (
         <p className='text-[10px] text-muted-foreground'>{unlockedAt.slice(0, 10)}</p>
      ) : null}
   </div>
)

/* ============================================================
 *  Comparativa "hace 30 días"
 * ============================================================ */
interface WeightComparisonProps {
   data: Array<{ date: string; weight_kg: number }>
}

const WeightComparison = ({ data }: WeightComparisonProps) => {
   const now = data[data.length - 1]
   const past = (() => {
      const target = new Date()
      target.setDate(target.getDate() - 30)
      const targetIso = target.toISOString().slice(0, 10)
      /* Buscar el registro más cercano a hace 30 días. */
      for (let i = data.length - 1; i >= 0; i--) {
         if (data[i].date <= targetIso) return data[i]
      }
      return data[0]
   })()

   if (!past || past.date === now.date) return null
   const delta = +(now.weight_kg - past.weight_kg).toFixed(1)
   const sign = delta > 0 ? '+' : ''
   return (
      <div className='mt-3 grid grid-cols-3 gap-2 rounded-md border border-border bg-muted/20 p-3 text-center text-xs'>
         <div>
            <p className='text-muted-foreground'>Hace 30d</p>
            <p className='font-medium'>{past.weight_kg} kg</p>
         </div>
         <div>
            <p className='text-muted-foreground'>Hoy</p>
            <p className='font-medium'>{now.weight_kg} kg</p>
         </div>
         <div>
            <p className='text-muted-foreground'>Δ</p>
            <p
               className={cn(
                  'font-medium',
                  Math.abs(delta) < 0.3 ? 'text-foreground' : 'text-primary'
               )}
            >
               {sign}
               {delta} kg
            </p>
         </div>
      </div>
   )
}

export default ProgresoPage
