import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Lightbulb, Loader2, Sparkles } from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useInsights } from '@/hooks/useInsights'
import type { ItfRecommendation } from '@/features/pattern-engine'
import { cn } from '@/utils'

const SEVERITY_CLASS: Record<ItfRecommendation['severity'], string> = {
   high: 'border-primary/50 bg-primary/10',
   medium: 'border-secondary/40 bg-secondary/5',
   low: 'border-border bg-background'
}

const SEVERITY_LABEL: Record<ItfRecommendation['severity'], string> = {
   high: 'Importante',
   medium: 'Sugerido',
   low: 'Preferencia'
}

const InsightsPage = () => {
   const navigate = useNavigate()
   const { profile, onboardingCompleted } = useAuth()
   const query = useInsights()

   if (!onboardingCompleted) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI
               title='Lo que sabemos sobre ti'
               subtitle='Necesitamos terminar tu onboarding.'
            />
            <EmptyState
               icon={Lightbulb}
               title='Falta tu onboarding'
               description='Termina los 7 pasos y vuelve para ver lo que aprendamos juntos.'
            />
         </AppShell>
      )
   }

   if (query.isLoading) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI title='Lo que sabemos sobre ti' subtitle='Analizando tu actividad…' />
            <div className='flex items-center justify-center py-12 text-muted-foreground'>
               <Loader2 className='h-5 w-5 animate-spin' />
            </div>
         </AppShell>
      )
   }

   const data = query.data
   const recommendations = data?.recommendations ?? []
   const patterns = data?.patterns ?? []

   if (recommendations.length === 0) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI
               title='Lo que sabemos sobre ti'
               subtitle='Todavía sin patrones claros — sigue registrando.'
            />
            <EmptyState
               icon={Sparkles}
               title='Aún estamos aprendiendo'
               description='Cuando lleves 2-3 semanas de registros, vas a ver aquí tus preferencias y patrones detectados.'
            />
            <Button variant='outline' onClick={() => navigate('/perfil')} className='mt-4 w-full'>
               <ChevronLeft className='h-4 w-4' />
               Volver al perfil
            </Button>
         </AppShell>
      )
   }

   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI
            title='Lo que sabemos sobre ti'
            subtitle='Todo lo que detectamos a partir de tu actividad. Transparencia total.'
         />

         {/* Disclaimer de transparencia */}
         <Card className='mb-4 border-primary/30 bg-primary/5'>
            <CardContent className='pt-6 text-xs text-muted-foreground'>
               <p>
                  Estos insights vienen del análisis de tus últimos 60 días. Si no quieres que
                  detectemos patrones, puedes desactivarlo en Perfil 🌿
               </p>
            </CardContent>
         </Card>

         {/* Recomendaciones priorizadas */}
         <div className='space-y-2'>
            {recommendations.map((rec) => (
               <Card key={rec.id} className={cn('border-2', SEVERITY_CLASS[rec.severity])}>
                  <CardHeader className='pb-2'>
                     <CardTitle className='flex items-center justify-between gap-2 text-sm'>
                        <span className='flex items-center gap-2'>
                           <span className='text-xl' aria-hidden='true'>
                              {rec.icon}
                           </span>
                           {rec.title}
                        </span>
                        <span className='rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-muted-foreground'>
                           {SEVERITY_LABEL[rec.severity]}
                        </span>
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className='text-sm leading-relaxed text-foreground'>{rec.message}</p>
                  </CardContent>
               </Card>
            ))}
         </div>

         {/* Sección "Patrones detectados" — datos crudos para transparencia */}
         <Card className='mt-4'>
            <CardHeader className='pb-2'>
               <CardTitle className='text-sm text-muted-foreground'>
                  Datos crudos detectados ({patterns.length})
               </CardTitle>
            </CardHeader>
            <CardContent>
               <ul className='space-y-1 text-xs text-muted-foreground'>
                  {patterns.map((p, i) => (
                     <li key={i}>
                        • <code>{p.type}</code>{' '}
                        {Object.entries(p.data)
                           .map(([k, v]) => `${k}=${v}`)
                           .join(' · ')}
                     </li>
                  ))}
               </ul>
            </CardContent>
         </Card>
      </AppShell>
   )
}

export default InsightsPage
