import { LineChart } from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/hooks/useAuth'

const ProgresoPage = () => {
   const { profile } = useAuth()
   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI title='Tu progreso' subtitle='Cada paso cuenta, también los que cuestan.' />
         <EmptyState
            icon={LineChart}
            title='Gráficas en Fase 9'
            description='Llegarán peso, adherencia, hábitos y logros con tono cálido.'
         />
      </AppShell>
   )
}
export default ProgresoPage
