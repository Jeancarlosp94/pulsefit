import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'
import { loaderMessages } from '@/themes'

interface LoaderUIProps {
   className?: string
   /** Mensaje fijo. Si no se pasa, rotamos uno cada 2.5s entre los compasivos. */
   message?: string
   fullscreen?: boolean
}

/**
 * Spinner compasivo. Lleva mensaje rotativo "Preparando tu día…" y similares.
 * Sin emojis estresantes, sin "Cargando…" seco.
 */
export const LoaderUI = ({ className, message, fullscreen = false }: LoaderUIProps) => {
   const [index, setIndex] = useState(0)

   useEffect(() => {
      if (message) return
      const id = window.setInterval(() => setIndex((i) => (i + 1) % loaderMessages.length), 2500)
      return () => window.clearInterval(id)
   }, [message])

   const text = message ?? loaderMessages[index]

   return (
      <div
         role='status'
         aria-live='polite'
         className={cn(
            'flex flex-col items-center justify-center gap-4 text-muted-foreground',
            fullscreen ? 'min-h-dvh' : 'py-12',
            className
         )}
      >
         <Loader2 className='h-8 w-8 animate-spin text-primary' />
         <p className='text-sm font-medium'>{text}</p>
      </div>
   )
}
