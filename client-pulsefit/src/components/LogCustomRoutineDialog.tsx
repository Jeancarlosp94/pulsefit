import { useMemo, useState } from 'react'
import { Loader2, Flame } from 'lucide-react'
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
import { useLogCustomRoutine } from '@/hooks/useWorkoutLogs'
import { useAuth } from '@/hooks/useAuth'
import {
   estimateKcal,
   INTENSITY_LABEL,
   PERCEIVED_EFFORT_LABEL,
   WORKOUT_SUBTYPE_EMOJI,
   WORKOUT_SUBTYPE_LABEL,
   type ItfWorkoutSubtype
} from '@/features/calorie-estimator'
import { cn } from '@/utils'

interface LogCustomRoutineDialogProps {
   open: boolean
   onOpenChange: (v: boolean) => void
}

const SUBTYPE_OPTIONS: ItfWorkoutSubtype[] = [
   'strength',
   'calistenia',
   'hiit',
   'crossfit',
   'yoga',
   'pilates',
   'barre',
   'cardio',
   'running',
   'cycling',
   'swimming',
   'dance',
   'sport',
   'mixed'
]

const INTENSITY_VALUES: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5]

export const LogCustomRoutineDialog = ({ open, onOpenChange }: LogCustomRoutineDialogProps) => {
   const logRoutine = useLogCustomRoutine()
   const { profile } = useAuth()
   const weightKg = (profile?.current_weight_kg as number | null) ?? null

   const [subtype, setSubtype] = useState<ItfWorkoutSubtype | null>(null)
   const [name, setName] = useState('')
   const [duration, setDuration] = useState('')
   const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3)
   const [notes, setNotes] = useState('')

   const close = (v: boolean) => {
      if (!v) {
         setSubtype(null)
         setName('')
         setDuration('')
         setIntensity(3)
         setNotes('')
      }
      onOpenChange(v)
   }

   /* Estimación de kcal en vivo. */
   const estimatedKcal = useMemo(() => {
      if (!subtype) return 0
      const min = Number(duration)
      if (!Number.isFinite(min) || min <= 0) return 0
      return estimateKcal({ subtype, durationMin: min, intensity, weightKg })
   }, [subtype, duration, intensity, weightKg])

   const canSubmit =
      subtype !== null && name.trim().length > 0 && Number(duration) > 0 && !logRoutine.isPending

   const handleSubmit = () => {
      if (!canSubmit || !subtype) return
      logRoutine.mutate(
         {
            activity_name: name.trim(),
            workout_subtype: subtype,
            duration_min: Number(duration),
            intensity,
            calories_burned: estimatedKcal,
            perceived_effort: PERCEIVED_EFFORT_LABEL[intensity],
            notes: notes.trim() || undefined
         },
         {
            onSuccess: () => close(false)
         }
      )
   }

   return (
      <Dialog open={open} onOpenChange={close}>
         <DialogContent className='sm:max-w-md'>
            <DialogHeader>
               <DialogTitle>Registrar mi rutina</DialogTitle>
               <DialogDescription>
                  Para cuando ya tenés tu propia rutina y solo querés contarla. Calculamos el gasto
                  calórico por vos 🔥
               </DialogDescription>
            </DialogHeader>

            {/* Paso 1 — Subtipo */}
            {!subtype ? (
               <div className='space-y-2'>
                  <Label className='text-xs'>¿Qué tipo de rutina hiciste?</Label>
                  <div className='grid grid-cols-2 gap-2'>
                     {SUBTYPE_OPTIONS.map((s) => (
                        <button
                           key={s}
                           type='button'
                           onClick={() => setSubtype(s)}
                           className='flex items-center gap-2 rounded-md border border-border bg-background p-2.5 text-left transition-colors hover:bg-muted'
                        >
                           <span className='text-lg'>{WORKOUT_SUBTYPE_EMOJI[s]}</span>
                           <span className='text-sm font-medium'>{WORKOUT_SUBTYPE_LABEL[s]}</span>
                        </button>
                     ))}
                  </div>
                  {!weightKg ? (
                     <p className='text-[10px] text-muted-foreground'>
                        ⚠️ Sin tu peso en perfil, usamos 70 kg para estimar.
                     </p>
                  ) : null}
               </div>
            ) : null}

            {/* Paso 2 — Detalles */}
            {subtype ? (
               <div className='space-y-3'>
                  <button
                     type='button'
                     onClick={() => setSubtype(null)}
                     className='text-xs text-muted-foreground hover:text-foreground'
                  >
                     ← Cambiar tipo ({WORKOUT_SUBTYPE_EMOJI[subtype]}{' '}
                     {WORKOUT_SUBTYPE_LABEL[subtype]})
                  </button>

                  {/* Nombre */}
                  <div className='space-y-1.5'>
                     <Label htmlFor='routine-name' className='text-xs'>
                        ¿Cómo le pones?
                     </Label>
                     <Input
                        id='routine-name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='Ej: Mi rutina del lunes, Sesión rápida…'
                        maxLength={60}
                     />
                  </div>

                  {/* Duración */}
                  <div className='space-y-1.5'>
                     <Label htmlFor='routine-duration' className='text-xs'>
                        Duración (minutos)
                     </Label>
                     <Input
                        id='routine-duration'
                        type='number'
                        inputMode='numeric'
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder='Ej: 45'
                        min={1}
                        max={300}
                     />
                  </div>

                  {/* Intensidad */}
                  <div className='space-y-1.5'>
                     <Label className='text-xs'>¿Qué tan intensa fue?</Label>
                     <div className='grid grid-cols-5 gap-1.5'>
                        {INTENSITY_VALUES.map((v) => (
                           <button
                              key={v}
                              type='button'
                              onClick={() => setIntensity(v)}
                              aria-pressed={intensity === v}
                              className={cn(
                                 'flex flex-col items-center gap-0.5 rounded-md border p-2 text-[10px] transition-colors',
                                 intensity === v
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border text-muted-foreground hover:bg-muted'
                              )}
                           >
                              <span className='text-base'>{'⚡'.repeat(v).slice(0, v) || '·'}</span>
                              {INTENSITY_LABEL[v]}
                           </button>
                        ))}
                     </div>
                     <p className='text-[10px] text-muted-foreground'>
                        {PERCEIVED_EFFORT_LABEL[intensity]}
                     </p>
                  </div>

                  {/* Preview de kcal */}
                  <div className='rounded-md border border-primary/30 bg-primary/5 p-3'>
                     <div className='flex items-center gap-2'>
                        <Flame className='h-4 w-4 text-primary' />
                        <span className='text-sm font-medium'>
                           {estimatedKcal > 0
                              ? `~${estimatedKcal} kcal`
                              : 'Completa duración para estimar'}
                        </span>
                     </div>
                     <p className='mt-1 text-[10px] text-muted-foreground'>
                        Estimación basada en MET ({WORKOUT_SUBTYPE_LABEL[subtype]} ·{' '}
                        {INTENSITY_LABEL[intensity]}
                        {weightKg ? ` · ${weightKg} kg` : ' · 70 kg default'}). Puede variar ±20%.
                     </p>
                  </div>

                  {/* Notas */}
                  <div className='space-y-1.5'>
                     <Label htmlFor='routine-notes' className='text-xs'>
                        Notas (opcional)
                     </Label>
                     <Input
                        id='routine-notes'
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder='Cómo te sentiste, qué hiciste exactamente…'
                        maxLength={150}
                     />
                  </div>

                  <Button onClick={handleSubmit} disabled={!canSubmit} className='w-full'>
                     {logRoutine.isPending ? (
                        <>
                           <Loader2 className='h-4 w-4 animate-spin' />
                           Guardando…
                        </>
                     ) : (
                        'Guardar mi rutina'
                     )}
                  </Button>

                  <p className='text-center text-[10px] text-muted-foreground'>
                     Cuenta para tu racha y tu balance calórico diario 🌿
                  </p>
               </div>
            ) : null}
         </DialogContent>
      </Dialog>
   )
}
