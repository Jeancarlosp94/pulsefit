import { useEffect, useState } from 'react'
import { Loader2, Scale } from 'lucide-react'
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
import { useLogWeight, useRecentWeights } from '@/hooks/useWeightLogs'

interface WeightLogDialogProps {
   open: boolean
   onOpenChange: (v: boolean) => void
}

export const WeightLogDialog = ({ open, onOpenChange }: WeightLogDialogProps) => {
   const logWeight = useLogWeight()
   const recentQuery = useRecentWeights(5)
   const [weight, setWeight] = useState('')
   const [notes, setNotes] = useState('')

   const todayIso = new Date().toISOString().slice(0, 10)
   const todayEntry = (recentQuery.data ?? []).find((w) => w.log_date === todayIso)
   const lastEntry = (recentQuery.data ?? []).find((w) => w.log_date !== todayIso)

   useEffect(() => {
      if (open) {
         setWeight(todayEntry?.weight_kg ? String(todayEntry.weight_kg) : '')
         setNotes(todayEntry?.notes ?? '')
      }
   }, [open, todayEntry?.weight_kg, todayEntry?.notes])

   const handleSubmit = () => {
      const w = Number(weight.replace(',', '.'))
      if (Number.isNaN(w) || w < 20 || w > 300) return
      logWeight.mutate(
         { weight_kg: w, notes: notes.trim() || undefined },
         {
            onSuccess: () => onOpenChange(false)
         }
      )
   }

   const delta = (() => {
      const w = Number(weight.replace(',', '.'))
      if (Number.isNaN(w) || !lastEntry) return null
      const d = w - lastEntry.weight_kg
      return d
   })()

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className='sm:max-w-md'>
            <DialogHeader>
               <DialogTitle className='flex items-center gap-2'>
                  <Scale className='h-4 w-4 text-primary' />
                  Registrar peso
               </DialogTitle>
               <DialogDescription>
                  {todayEntry
                     ? 'Ya tienes un registro hoy. Lo actualizamos si pesas distinto.'
                     : 'Una entrada por día. Sin obsesionarte: la consistencia importa más que el número.'}
               </DialogDescription>
            </DialogHeader>

            <div className='space-y-3'>
               <div className='space-y-1'>
                  <Label htmlFor='w-input' className='text-xs'>
                     Peso (kg)
                  </Label>
                  <Input
                     id='w-input'
                     type='number'
                     inputMode='decimal'
                     value={weight}
                     step='0.1'
                     min={20}
                     max={300}
                     onChange={(e) => setWeight(e.target.value)}
                     placeholder='Ej: 72.4'
                  />
                  {delta !== null ? (
                     <p className='text-[10px] text-muted-foreground'>
                        {delta === 0
                           ? 'Mismo peso que la última vez 🌿'
                           : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg vs ${lastEntry?.log_date}`}
                     </p>
                  ) : null}
               </div>

               <div className='space-y-1'>
                  <Label htmlFor='w-notes' className='text-xs'>
                     Notas (opcional)
                  </Label>
                  <Input
                     id='w-notes'
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder='Ej: en ayunas, después del baño…'
                     maxLength={120}
                  />
               </div>

               <Button
                  onClick={handleSubmit}
                  disabled={!weight || logWeight.isPending}
                  className='w-full'
               >
                  {logWeight.isPending ? (
                     <>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        Guardando…
                     </>
                  ) : (
                     'Guardar'
                  )}
               </Button>

               <p className='text-center text-[10px] text-muted-foreground'>
                  El peso fluctúa día a día por agua y digestión. Mira la tendencia, no un solo
                  número 🌿
               </p>
            </div>
         </DialogContent>
      </Dialog>
   )
}
