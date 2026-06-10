import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogSet } from '@/hooks/useWorkoutLogs'
import { cn } from '@/utils'

interface LogSetDialogProps {
   open: boolean
   onOpenChange: (v: boolean) => void
   exerciseId: string
   exerciseName: string
   /** Reps prescritas para pre-rellenar. */
   prescribedSets: number
   prescribedReps: number
   /** Peso pre-rellenado por suggestNextWeight, o 0 si primera vez. */
   suggestedWeightKg: number
   /** Session ID opcional para linkear el log con la sesión. */
   sessionId?: string
}

export const LogSetDialog = ({
   open,
   onOpenChange,
   exerciseId,
   exerciseName,
   prescribedSets,
   prescribedReps,
   suggestedWeightKg,
   sessionId
}: LogSetDialogProps) => {
   const logSet = useLogSet()
   const [weight, setWeight] = useState(String(suggestedWeightKg || ''))
   const [reps, setReps] = useState(String(prescribedReps))
   const [sets, setSets] = useState(String(prescribedSets))
   const [rpe, setRpe] = useState(7)
   const [notes, setNotes] = useState('')

   /* Resync defaults cuando se abre el dialog. */
   useEffect(() => {
      if (open) {
         setWeight(String(suggestedWeightKg || ''))
         setReps(String(prescribedReps))
         setSets(String(prescribedSets))
         setRpe(7)
         setNotes('')
      }
   }, [open, suggestedWeightKg, prescribedReps, prescribedSets])

   const handleSubmit = () => {
      const w = Number(weight.replace(',', '.'))
      const r = Number(reps)
      const s = Number(sets)
      if (Number.isNaN(w) || Number.isNaN(r) || Number.isNaN(s)) return
      if (s < 1 || s > 10 || r < 1 || r > 50 || w < 0 || w > 500) return
      logSet.mutate(
         {
            exercise_id: exerciseId,
            exercise_name: exerciseName,
            sets_completed: s,
            reps_completed: r,
            weight_kg: w,
            rpe_actual: rpe,
            notes: notes.trim() || undefined,
            session_id: sessionId
         },
         {
            onSuccess: () => onOpenChange(false)
         }
      )
   }

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className='sm:max-w-md'>
            <DialogHeader>
               <DialogTitle>Registrar set 💪</DialogTitle>
               <DialogDescription>{exerciseName}</DialogDescription>
            </DialogHeader>

            <div className='grid grid-cols-3 gap-3'>
               <div className='space-y-1'>
                  <Label htmlFor='log-sets' className='text-xs'>
                     Series
                  </Label>
                  <Input
                     id='log-sets'
                     type='number'
                     inputMode='numeric'
                     value={sets}
                     min={1}
                     max={10}
                     onChange={(e) => setSets(e.target.value)}
                  />
               </div>
               <div className='space-y-1'>
                  <Label htmlFor='log-reps' className='text-xs'>
                     Reps
                  </Label>
                  <Input
                     id='log-reps'
                     type='number'
                     inputMode='numeric'
                     value={reps}
                     min={1}
                     max={50}
                     onChange={(e) => setReps(e.target.value)}
                  />
               </div>
               <div className='space-y-1'>
                  <Label htmlFor='log-weight' className='text-xs'>
                     Peso (kg)
                  </Label>
                  <Input
                     id='log-weight'
                     type='number'
                     inputMode='decimal'
                     value={weight}
                     step='0.25'
                     min={0}
                     max={500}
                     placeholder='0'
                     onChange={(e) => setWeight(e.target.value)}
                  />
               </div>
            </div>

            <div className='space-y-2'>
               <div className='flex items-center justify-between text-xs'>
                  <Label className='text-xs'>¿Qué tan duro lo sentiste? (RPE)</Label>
                  <span className='font-medium text-foreground'>{rpe}/10</span>
               </div>
               <div className='grid grid-cols-10 gap-1'>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                     <button
                        key={n}
                        type='button'
                        onClick={() => setRpe(n)}
                        aria-pressed={rpe === n}
                        className={cn(
                           'rounded-md border p-1.5 text-xs transition-colors',
                           rpe === n
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted'
                        )}
                     >
                        {n}
                     </button>
                  ))}
               </div>
               <p className='text-[10px] text-muted-foreground'>
                  RPE 7 = podías haber hecho 3 reps más · RPE 9 = solo 1 más · RPE 10 = ni una más
               </p>
            </div>

            <div className='space-y-1'>
               <Label htmlFor='log-notes' className='text-xs'>
                  Notas (opcional)
               </Label>
               <Input
                  id='log-notes'
                  type='text'
                  value={notes}
                  placeholder='Ej: rodilla molestó, se sintió liviano…'
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={200}
               />
            </div>

            <Button onClick={handleSubmit} disabled={logSet.isPending} className='w-full'>
               {logSet.isPending ? (
                  <>
                     <Loader2 className='h-4 w-4 animate-spin' />
                     Guardando…
                  </>
               ) : (
                  'Guardar set'
               )}
            </Button>
         </DialogContent>
      </Dialog>
   )
}
