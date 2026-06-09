import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MealsPerDayDialog } from '@/components'
import { useAuth } from '@/hooks/useAuth'

const HomePage = () => {
   const { profile, user } = useAuth()
   const navigate = useNavigate()
   const [dialogOpen, setDialogOpen] = useState(false)

   const displayName = profile?.name ?? user?.email?.split('@')[0]
   const mealsPerDay = (profile?.meals_per_day as number | null) ?? null
   /* Mostrar banner si el usuario nunca configuró (legacy) o quedó con el
    * default 3 sin haber confirmado explícitamente desde el onboarding. */
   const needsMealsConfig = !mealsPerDay || mealsPerDay === 3

   return (
      <AppShell userName={displayName}>
         <TitleUI
            title={`Hola${displayName ? `, ${displayName}` : ''}`}
            subtitle='Hoy hacemos lo que podamos. Mañana seguimos.'
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
                              {mealsPerDay
                                 ? `Por ahora distribuimos entre ${mealsPerDay} comidas. Ajustalo si tu rutina es distinta.`
                                 : 'Configúralo para que distribuyamos bien tus calorías y proteínas.'}
                           </p>
                        </div>
                     </div>
                     <Button type='button' size='sm' onClick={() => setDialogOpen(true)}>
                        Configurar mis comidas
                     </Button>
                  </CardContent>
               </Card>
            ) : null}

            <EmptyState
               title='Tu plan llegará pronto'
               description='Estamos terminando esto en Fase 7. Por ahora puedes generar comidas o entrenos desde Plan y Registrar.'
               action={{
                  label: 'Ir a mi perfil',
                  onClick: () => navigate('/perfil')
               }}
            />
         </div>

         <MealsPerDayDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </AppShell>
   )
}

export default HomePage
