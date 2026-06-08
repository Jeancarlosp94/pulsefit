import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

/**
 * Placeholder del onboarding (Fase 4 lo reemplaza con los 7 pasos reales).
 * Mantiene la estética de la app y muestra la barra de progreso 0/7.
 */
const OnboardingShell = () => {
   return (
      <main className='mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10'>
         <Card>
            <CardHeader className='space-y-3 text-center'>
               <span className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary'>
                  <Sparkles className='h-7 w-7' aria-hidden='true' />
               </span>
               <CardTitle>Vamos a conocernos</CardTitle>
               <CardDescription>
                  Pronto te haremos algunas preguntas cortas. Sin presión, a tu ritmo.
               </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
               <Progress value={0} aria-label='Progreso del onboarding' />
               <p className='text-center text-xs text-muted-foreground'>Paso 0 de 7</p>
               <p className='rounded-md bg-muted/50 p-3 text-center text-sm text-muted-foreground'>
                  Próximamente — terminaremos esto en Fase 4 🌱
               </p>
            </CardContent>
         </Card>
      </main>
   )
}

export default OnboardingShell
