import type { ReactNode } from 'react'
import { StepProgress } from './StepProgress'

interface OnboardingLayoutProps {
   step: number
   title: string
   subtitle?: string
   children: ReactNode
}

/**
 * Layout común de cada step: barra de progreso arriba, título compasivo
 * con DM Serif Display, subtítulo opcional, y el slot del formulario.
 * Sin AppShell (no queremos BottomNav durante el onboarding inmersivo).
 */
export const OnboardingLayout = ({ step, title, subtitle, children }: OnboardingLayoutProps) => {
   return (
      <main className='mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 pt-8'>
         <StepProgress step={step} />
         <div className='mb-6 text-center'>
            <h1 className='font-display text-3xl leading-tight text-foreground'>{title}</h1>
            {subtitle ? <p className='mt-2 text-sm text-muted-foreground'>{subtitle}</p> : null}
         </div>
         <div className='flex-1'>{children}</div>
      </main>
   )
}
