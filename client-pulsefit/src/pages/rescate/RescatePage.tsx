import { Leaf } from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/hooks/useAuth'

const RescatePage = () => {
   const { profile } = useAuth()
   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI title='Tu día, tu ritmo' subtitle='Si hoy no se puede, ajustamos juntos.' />
         <EmptyState
            icon={Leaf}
            title='Sistema de rescates en Fase 8'
            description='Pronto podrás pulsar “hoy no puedo” y la app te dará alternativas amables.'
         />
      </AppShell>
   )
}
export default RescatePage
