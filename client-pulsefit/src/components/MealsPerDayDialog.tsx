import { useState } from 'react'
import { Loader2, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { OptionCard } from '@/components/onboarding'
import { MEALS_PER_DAY_OPTIONS } from '@/config'
import { useAuth } from '@/hooks/useAuth'
import { useErrorHandling } from '@/hooks/useErrorHandling'
import type { ItfMealsPerDay } from '@/features/meal-generator'
import type { ReactNode } from 'react'

interface MealsPerDayDialogProps {
   /** Botón / disparador. Si no se pasa, no se renderiza nada (modo controlado). */
   trigger?: ReactNode
   /** Modo controlado: abrir/cerrar desde fuera. */
   open?: boolean
   onOpenChange?: (open: boolean) => void
}

/**
 * Diálogo que permite al usuario elegir cuántas comidas por día. Se reusa
 * tanto en el banner del Home (legacy users sin config) como en la sección
 * de ajustes del perfil.
 *
 * Persiste el cambio en `profiles.meals_per_day` vía `useAuth().updateProfile`.
 */
export const MealsPerDayDialog = ({ trigger, open, onOpenChange }: MealsPerDayDialogProps) => {
   const { profile, updateProfile } = useAuth()
   const { handleApiError } = useErrorHandling()
   const [selected, setSelected] = useState<ItfMealsPerDay>(
      (profile?.meals_per_day as ItfMealsPerDay) ?? 3
   )
   const [submitting, setSubmitting] = useState(false)

   const handleSave = async () => {
      setSubmitting(true)
      /* Timeout de 10s para evitar quedar en spinner si Supabase no responde
       * (típico cuando falta una migración y el UPDATE queda esperando). */
      const timeoutPromise = new Promise<never>((_, reject) =>
         setTimeout(
            () =>
               reject(
                  new Error(
                     'Tardamos más de lo esperado. ¿Tu base ya tiene la columna meals_per_day? 🌿'
                  )
               ),
            10_000
         )
      )
      try {
         await Promise.race([updateProfile({ meals_per_day: selected }), timeoutPromise])
         toast.success('Listo, te distribuimos así desde ahora 🌱')
         onOpenChange?.(false)
      } catch (e) {
         handleApiError(e)
      } finally {
         setSubmitting(false)
      }
   }

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
         <DialogContent>
            <DialogHeader>
               <DialogTitle className='flex items-center gap-2'>
                  <UtensilsCrossed className='h-5 w-5 text-primary' aria-hidden='true' />
                  ¿Cuántas comidas haces al día?
               </DialogTitle>
               <DialogDescription>
                  Distribuimos tus calorías y proteínas entre estas comidas. Lo puedes cambiar
                  cuando quieras.
               </DialogDescription>
            </DialogHeader>

            <div className='space-y-2 py-2'>
               {MEALS_PER_DAY_OPTIONS.map((opt) => {
                  const n = Number.parseInt(opt.value, 10) as ItfMealsPerDay
                  return (
                     <OptionCard
                        key={opt.value}
                        selected={selected === n}
                        onSelect={() => setSelected(n)}
                        label={opt.label}
                        description={opt.description}
                        emoji={opt.emoji}
                        compact
                     />
                  )
               })}
            </div>

            <DialogFooter>
               <Button
                  type='button'
                  variant='ghost'
                  onClick={() => onOpenChange?.(false)}
                  disabled={submitting}
               >
                  Mejor no
               </Button>
               <Button type='button' onClick={handleSave} disabled={submitting}>
                  {submitting ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Guardar'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   )
}
