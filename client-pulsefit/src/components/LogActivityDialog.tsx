import { useState } from 'react'
import { Loader2, Activity, Trophy, Music, Footprints } from 'lucide-react'
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
import { useLogActivity } from '@/hooks/useWorkoutLogs'
import type { ItfLogActivityInput } from '@/interface/itfWorkouts'
import { cn } from '@/utils'

interface LogActivityDialogProps {
   open: boolean
   onOpenChange: (v: boolean) => void
}

const ACTIVITY_TYPES: Array<{
   id: ItfLogActivityInput['activity_type']
   label: string
   description: string
   icon: React.ComponentType<{ className?: string }>
   suggestions: string[]
}> = [
   {
      id: 'sport',
      label: 'Deporte',
      description: 'Fútbol, vóley, tenis, básquet…',
      icon: Trophy,
      suggestions: ['Fútbol', 'Vóley', 'Tenis', 'Básquet', 'Pádel']
   },
   {
      id: 'dance',
      label: 'Baile',
      description: 'Bachata, zumba, ballet, kpop…',
      icon: Music,
      suggestions: ['Bachata', 'Zumba', 'Salsa', 'Kpop', 'Reguetón']
   },
   {
      id: 'cardio',
      label: 'Cardio',
      description: 'Correr, bici, elíptica, natación…',
      icon: Activity,
      suggestions: ['Correr', 'Bici estática', 'Natación', 'Elíptica']
   },
   {
      id: 'movement',
      label: 'Movimiento',
      description: 'Caminar, yoga, estiramiento…',
      icon: Footprints,
      suggestions: ['Caminata', 'Yoga', 'Estiramiento', 'Subir escaleras']
   }
]

const INTENSITIES: Array<{
   value: 1 | 2 | 3 | 4 | 5
   label: string
   emoji: string
}> = [
   { value: 1, label: 'Muy suave', emoji: '🌱' },
   { value: 2, label: 'Suave', emoji: '🚶' },
   { value: 3, label: 'Moderada', emoji: '💪' },
   { value: 4, label: 'Fuerte', emoji: '🔥' },
   { value: 5, label: 'Máxima', emoji: '⚡' }
]

export const LogActivityDialog = ({ open, onOpenChange }: LogActivityDialogProps) => {
   const logActivity = useLogActivity()
   const [type, setType] = useState<ItfLogActivityInput['activity_type'] | null>(null)
   const [name, setName] = useState('')
   const [duration, setDuration] = useState('')
   const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3)
   const [notes, setNotes] = useState('')

   const close = (v: boolean) => {
      if (!v) {
         setType(null)
         setName('')
         setDuration('')
         setIntensity(3)
         setNotes('')
      }
      onOpenChange(v)
   }

   const canSubmit =
      type !== null && name.trim().length > 0 && Number(duration) > 0 && !logActivity.isPending

   const handleSubmit = () => {
      if (!canSubmit || !type) return
      logActivity.mutate(
         {
            activity_type: type,
            activity_name: name.trim(),
            duration_min: Number(duration),
            intensity,
            notes: notes.trim() || undefined
         },
         {
            onSuccess: () => close(false)
         }
      )
   }

   const selectedType = ACTIVITY_TYPES.find((t) => t.id === type)

   return (
      <Dialog open={open} onOpenChange={close}>
         <DialogContent className='sm:max-w-md'>
            <DialogHeader>
               <DialogTitle>Registrar actividad</DialogTitle>
               <DialogDescription>
                  {type
                     ? 'Cuéntanos qué hiciste hoy. Cuenta como entrenamiento 🌱'
                     : 'Esto es para deporte, baile, cardio o movimiento. Si fue de pesas, usa "Empezar entrenamiento".'}
               </DialogDescription>
            </DialogHeader>

            {/* Paso 1 — Tipo de actividad */}
            {!type ? (
               <div className='space-y-2'>
                  {ACTIVITY_TYPES.map(({ id, label, description, icon: Icon }) => (
                     <button
                        key={id}
                        type='button'
                        onClick={() => setType(id)}
                        className='flex w-full items-start gap-3 rounded-md border border-border bg-background p-3 text-left transition-colors hover:bg-muted'
                     >
                        <Icon className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                        <div className='space-y-0.5'>
                           <p className='text-sm font-medium'>{label}</p>
                           <p className='text-xs text-muted-foreground'>{description}</p>
                        </div>
                     </button>
                  ))}
               </div>
            ) : null}

            {/* Paso 2 — Detalles */}
            {type ? (
               <div className='space-y-3'>
                  <button
                     type='button'
                     onClick={() => setType(null)}
                     className='text-xs text-muted-foreground hover:text-foreground'
                  >
                     ← Cambiar tipo
                  </button>

                  {/* Nombre con sugerencias */}
                  <div className='space-y-1.5'>
                     <Label htmlFor='activity-name' className='text-xs'>
                        ¿Qué hiciste?
                     </Label>
                     <Input
                        id='activity-name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='Ej: Fútbol, Bachata, Caminata…'
                        maxLength={50}
                     />
                     <div className='flex flex-wrap gap-1'>
                        {selectedType?.suggestions.map((s) => (
                           <button
                              key={s}
                              type='button'
                              onClick={() => setName(s)}
                              className='rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted'
                           >
                              {s}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Duración */}
                  <div className='space-y-1.5'>
                     <Label htmlFor='activity-duration' className='text-xs'>
                        Duración (minutos)
                     </Label>
                     <Input
                        id='activity-duration'
                        type='number'
                        inputMode='numeric'
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder='Ej: 60'
                        min={1}
                        max={600}
                     />
                  </div>

                  {/* Intensidad */}
                  <div className='space-y-1.5'>
                     <Label className='text-xs'>Intensidad</Label>
                     <div className='grid grid-cols-5 gap-1.5'>
                        {INTENSITIES.map((opt) => (
                           <button
                              key={opt.value}
                              type='button'
                              onClick={() => setIntensity(opt.value)}
                              aria-pressed={intensity === opt.value}
                              className={cn(
                                 'flex flex-col items-center gap-0.5 rounded-md border p-2 text-[10px] transition-colors',
                                 intensity === opt.value
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border text-muted-foreground hover:bg-muted'
                              )}
                           >
                              <span className='text-base'>{opt.emoji}</span>
                              {opt.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Notas */}
                  <div className='space-y-1.5'>
                     <Label htmlFor='activity-notes' className='text-xs'>
                        Notas (opcional)
                     </Label>
                     <Input
                        id='activity-notes'
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder='Con quién, lugar, cómo te sentiste…'
                        maxLength={120}
                     />
                  </div>

                  <Button onClick={handleSubmit} disabled={!canSubmit} className='w-full'>
                     {logActivity.isPending ? (
                        <>
                           <Loader2 className='h-4 w-4 animate-spin' />
                           Guardando…
                        </>
                     ) : (
                        'Guardar actividad'
                     )}
                  </Button>

                  <p className='text-center text-[10px] text-muted-foreground'>
                     Tu actividad cuenta como entrenamiento en tu adherencia 🌿
                  </p>
               </div>
            ) : null}
         </DialogContent>
      </Dialog>
   )
}
