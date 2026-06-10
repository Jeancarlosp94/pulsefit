import { useState } from 'react'
import { Plus, Scale, Droplet, Dumbbell, X } from 'lucide-react'
import { cn } from '@/utils'
import { useNavigate } from 'react-router-dom'
import { WeightLogDialog } from './WeightLogDialog'
import { useAddWater } from '@/hooks/useWaterLogs'

/**
 * Floating Action Button con bottom sheet de acciones rápidas.
 *
 * Visible en el HomePage. Tap → muestra un menú radial sobre el FAB con
 * 3 acciones que se completan en 1-2 taps:
 *   - 💧 Agua: +1 vaso al instante (optimistic update).
 *   - ⚖️ Peso: abre WeightLogDialog (1 input + guardar).
 *   - 🏋️ Entrenar: navega a /registrar para generar/empezar sesión.
 *
 * NO incluye "registrar comida extra" intencionalmente — el flujo
 * principal de comidas vive en las MealsRowCard del Home con su dialog.
 */
export const QuickActionFAB = () => {
   const navigate = useNavigate()
   const [open, setOpen] = useState(false)
   const [weightOpen, setWeightOpen] = useState(false)
   const addWater = useAddWater()

   const handleWater = () => {
      addWater.mutate(1)
      setOpen(false)
   }

   const handleWeight = () => {
      setOpen(false)
      setWeightOpen(true)
   }

   const handleWorkout = () => {
      setOpen(false)
      navigate('/registrar')
   }

   return (
      <>
         {/* Backdrop cuando está abierto */}
         {open ? (
            <div
               className='fixed inset-0 z-30 bg-background/40 backdrop-blur-sm'
               onClick={() => setOpen(false)}
               aria-hidden='true'
            />
         ) : null}

         {/* Acciones expandidas */}
         {open ? (
            <div className='fixed bottom-28 right-5 z-40 flex flex-col items-end gap-2'>
               <ActionItem icon={Dumbbell} label='Entrenar' onClick={handleWorkout} />
               <ActionItem icon={Scale} label='Peso' onClick={handleWeight} />
               <ActionItem icon={Droplet} label='+ Agua' onClick={handleWater} />
            </div>
         ) : null}

         {/* FAB principal */}
         <button
            type='button'
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar acciones rápidas' : 'Abrir acciones rápidas'}
            aria-expanded={open}
            className={cn(
               'fixed bottom-24 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105',
               open && 'rotate-45'
            )}
         >
            {open ? <X className='h-5 w-5' /> : <Plus className='h-5 w-5' />}
         </button>

         <WeightLogDialog open={weightOpen} onOpenChange={setWeightOpen} />
      </>
   )
}

interface ActionItemProps {
   icon: React.ComponentType<{ className?: string }>
   label: string
   onClick: () => void
}

const ActionItem = ({ icon: Icon, label, onClick }: ActionItemProps) => (
   <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium shadow-md transition-colors hover:bg-muted'
   >
      <Icon className='h-4 w-4 text-primary' />
      {label}
   </button>
)
