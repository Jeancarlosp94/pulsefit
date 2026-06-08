import { Link } from 'react-router-dom'
import { Heart, Sparkles, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Página pública `/` para usuarios sin sesión. Mensaje cálido + CTAs. */
const LandingPage = () => {
   return (
      <main className='mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10'>
         <div className='flex flex-1 flex-col items-center justify-center gap-8 text-center'>
            <span className='flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary'>
               <Heart className='h-8 w-8' aria-hidden='true' />
            </span>
            <div className='space-y-3'>
               <h1 className='font-display text-4xl text-foreground'>PulseFit</h1>
               <p className='text-base text-muted-foreground'>
                  Tu coach compasivo de salud y movimiento. A tu ritmo, sin juicios.
               </p>
            </div>

            <ul className='space-y-3 text-left text-sm text-muted-foreground'>
               <li className='flex items-start gap-3'>
                  <Sparkles className='mt-0.5 h-4 w-4 text-secondary' aria-hidden='true' />
                  Plan de comidas y entrenos hechos para ti.
               </li>
               <li className='flex items-start gap-3'>
                  <Leaf className='mt-0.5 h-4 w-4 text-primary' aria-hidden='true' />
                  Si hoy no se puede, te damos alternativas amables.
               </li>
               <li className='flex items-start gap-3'>
                  <Heart className='mt-0.5 h-4 w-4 text-accent' aria-hidden='true' />
                  Cero culpa, mucha calma, gratis para siempre.
               </li>
            </ul>
         </div>

         <div className='mt-8 flex flex-col gap-3'>
            <Button asChild size='lg'>
               <Link to='/register'>Empezar mi PulseFit</Link>
            </Button>
            <Button asChild variant='ghost' size='lg'>
               <Link to='/login'>Ya tengo cuenta</Link>
            </Button>
         </div>
      </main>
   )
}

export default LandingPage
