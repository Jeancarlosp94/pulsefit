import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** 404 con mensaje compasivo. Sin "página no encontrada" seco. */
const NotFoundPage = () => {
   return (
      <main className='mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center'>
         <span className='flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary'>
            <Compass className='h-8 w-8' aria-hidden='true' />
         </span>
         <div className='space-y-2'>
            <h1 className='font-display text-3xl text-foreground'>No encontramos esto</h1>
            <p className='max-w-sm text-sm text-muted-foreground'>
               Tal vez quitamos el camino o tu enlace ya pasó. Te llevamos a casa.
            </p>
         </div>
         <Button asChild>
            <Link to='/home'>Volver al inicio</Link>
         </Button>
      </main>
   )
}

export default NotFoundPage
