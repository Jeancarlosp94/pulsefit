import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { fntResetAllData, fntResetOnboardingOnly } from '@/api/fntResetAccount'
import { useAuth } from '@/hooks/useAuth'
import { useErrorHandling } from '@/hooks/useErrorHandling'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface ResetAccountDialogProps {
   open: boolean
   onOpenChange: (v: boolean) => void
}

type Mode = 'soft' | 'hard'

export const ResetAccountDialog = ({ open, onOpenChange }: ResetAccountDialogProps) => {
   const navigate = useNavigate()
   const { loadProfile } = useAuth()
   const { handleApiError } = useErrorHandling()
   const queryClient = useQueryClient()
   const [mode, setMode] = useState<Mode | null>(null)
   const [confirming, setConfirming] = useState(false)
   const [working, setWorking] = useState(false)

   const reset = (next: Mode | null) => {
      setMode(next)
      setConfirming(false)
   }

   const handleClose = (v: boolean) => {
      if (!v && !working) {
         reset(null)
      }
      onOpenChange(v)
   }

   const handleConfirm = async () => {
      if (!mode || working) return
      setWorking(true)
      try {
         if (mode === 'soft') {
            await fntResetOnboardingOnly()
         } else {
            await fntResetAllData()
         }
         /* Invalidar todas las queries en cache + recargar profile. */
         queryClient.clear()
         await loadProfile()
         toast.success(
            mode === 'soft'
               ? 'Listo, rehagamos el cuestionario 🌱'
               : 'Cuenta reiniciada. Empezamos de cero 🌱'
         )
         onOpenChange(false)
         navigate('/onboarding/1', { replace: true })
      } catch (e) {
         handleApiError(e)
      } finally {
         setWorking(false)
         reset(null)
      }
   }

   return (
      <Dialog open={open} onOpenChange={handleClose}>
         <DialogContent className='sm:max-w-md'>
            <DialogHeader>
               <DialogTitle>Empezar desde cero</DialogTitle>
               <DialogDescription>
                  Elige cómo quieres reiniciar tu cuenta. Tu correo y contraseña se mantienen.
               </DialogDescription>
            </DialogHeader>

            {!mode ? (
               <div className='space-y-3'>
                  <button
                     type='button'
                     onClick={() => reset('soft')}
                     className='w-full rounded-md border border-border bg-background p-3 text-left text-sm hover:bg-muted'
                  >
                     <div className='flex items-start gap-3'>
                        <RotateCcw className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                        <div className='space-y-0.5'>
                           <p className='font-medium'>Solo rehacer el cuestionario</p>
                           <p className='text-xs text-muted-foreground'>
                              Conserva tus planes anteriores y tu historial de entrenamientos. Solo
                              vuelves a contestar las preguntas iniciales.
                           </p>
                        </div>
                     </div>
                  </button>

                  <button
                     type='button'
                     onClick={() => reset('hard')}
                     className='w-full rounded-md border border-destructive/30 bg-destructive/5 p-3 text-left text-sm hover:bg-destructive/10'
                  >
                     <div className='flex items-start gap-3'>
                        <Trash2 className='mt-0.5 h-4 w-4 shrink-0 text-destructive' />
                        <div className='space-y-0.5'>
                           <p className='font-medium text-destructive'>
                              Borrar todo y empezar de cero
                           </p>
                           <p className='text-xs text-muted-foreground'>
                              Elimina planes de comidas, logs de entrenamiento y preferencias
                              guardadas. Acción no reversible.
                           </p>
                        </div>
                     </div>
                  </button>
               </div>
            ) : null}

            {mode && !confirming ? (
               <div className='space-y-3'>
                  <div className='flex items-start gap-2 rounded-md border border-secondary/30 bg-secondary/5 p-3 text-xs'>
                     <AlertTriangle className='mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary' />
                     <p>
                        {mode === 'soft'
                           ? 'Vamos a marcar tu onboarding como pendiente. Lo que tenías en tu plan vigente y tus logs quedan guardados — los podrás ver después.'
                           : 'Vamos a BORRAR tus planes de comidas, todos tus logs de entrenamiento y tus preferencias. Quedan solo tu correo y datos de cuenta.'}
                     </p>
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                     <Button
                        variant='outline'
                        size='sm'
                        onClick={() => reset(null)}
                        disabled={working}
                     >
                        Volver
                     </Button>
                     <Button
                        size='sm'
                        variant={mode === 'hard' ? 'destructive' : 'default'}
                        onClick={() => setConfirming(true)}
                        disabled={working}
                     >
                        Continuar
                     </Button>
                  </div>
               </div>
            ) : null}

            {confirming ? (
               <div className='space-y-3'>
                  <p className='text-sm'>¿Confirmas? Esta acción se aplica al instante.</p>
                  <div className='grid grid-cols-2 gap-2'>
                     <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setConfirming(false)}
                        disabled={working}
                     >
                        Cancelar
                     </Button>
                     <Button
                        size='sm'
                        variant={mode === 'hard' ? 'destructive' : 'default'}
                        onClick={handleConfirm}
                        disabled={working}
                     >
                        {working ? (
                           <>
                              <Loader2 className='h-3.5 w-3.5 animate-spin' />
                              Aplicando…
                           </>
                        ) : (
                           'Sí, aplicar'
                        )}
                     </Button>
                  </div>
               </div>
            ) : null}
         </DialogContent>
      </Dialog>
   )
}
