import { PlusCircle } from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/hooks/useAuth'

const RegistrarPage = () => {
   const { profile } = useAuth()
   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI title='Registrar' subtitle='Anota una comida, un entreno o tu día.' />
         <EmptyState
            icon={PlusCircle}
            title='Registro rápido en Fase 7'
            description='Llegará el flujo de 3 taps para que registrar nunca cueste.'
         />
      </AppShell>
   )
}
export default RegistrarPage
