import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/hooks/useAuth'

const HomePage = () => {
   const { profile, user } = useAuth()
   const navigate = useNavigate()
   const displayName = profile?.name ?? user?.email?.split('@')[0]

   return (
      <AppShell userName={displayName}>
         <TitleUI
            title={`Hola${displayName ? `, ${displayName}` : ''}`}
            subtitle='Hoy hacemos lo que podamos. Mañana seguimos.'
         />
         <EmptyState
            title='Tu plan llegará pronto'
            description='Estamos terminando esto en Fase 4. Por ahora puedes pasear por tu perfil y probar el modo oscuro.'
            action={{
               label: 'Ir a mi perfil',
               onClick: () => navigate('/perfil')
            }}
         />
      </AppShell>
   )
}

export default HomePage
