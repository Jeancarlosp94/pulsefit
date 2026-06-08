import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Leaf, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
   children: ReactNode
   fallback?: ReactNode
}

interface State {
   hasError: boolean
   error: Error | null
}

/**
 * ErrorBoundary global. Captura cualquier error de renderizado de React y
 * muestra una pantalla compasiva con botón "Recargar". Nunca muestra stack
 * trace ni mensajes punitivos.
 */
export class ErrorBoundary extends Component<Props, State> {
   override state: State = { hasError: false, error: null }

   static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error }
   }

   override componentDidCatch(error: Error, info: ErrorInfo): void {
      /* En producción aquí enviaríamos a Sentry. Por ahora solo console. */
      console.error('[ErrorBoundary]', error, info.componentStack)
   }

   handleRetry = (): void => {
      this.setState({ hasError: false, error: null })
      window.location.reload()
   }

   override render(): ReactNode {
      if (this.state.hasError) {
         if (this.props.fallback) return this.props.fallback
         return (
            <div className='flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center'>
               <span className='flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary'>
                  <Leaf className='h-8 w-8' aria-hidden='true' />
               </span>
               <div className='space-y-2'>
                  <h1 className='font-display text-2xl text-foreground'>
                     Algo no salió como esperábamos
                  </h1>
                  <p className='max-w-sm text-sm text-muted-foreground'>
                     Pasa, no te preocupes. Recargamos juntos y seguimos.
                  </p>
               </div>
               <Button onClick={this.handleRetry} variant='accent'>
                  <RotateCcw className='h-4 w-4' />
                  Recargar
               </Button>
            </div>
         )
      }
      return this.props.children
   }
}
