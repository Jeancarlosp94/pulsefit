import { ClipboardList } from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/hooks/useAuth'

const PlanPage = () => {
   const { profile } = useAuth()
   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI title='Tu plan' subtitle='Aquí verás tu semana cuando esté lista.' />
         <EmptyState
            icon={ClipboardList}
            title='Tu plan llegará en Fase 5'
            description='Estamos preparando comidas y entrenamientos a tu medida.'
         />
      </AppShell>
   )
}
export default PlanPage
