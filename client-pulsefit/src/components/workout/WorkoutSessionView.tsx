import { useMemo, useState } from 'react'
import { Check, Clock, PlayCircle, Save, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
   findVideoUrlForExercise,
   formatLastSession,
   suggestNextWeight
} from '@/features/routine-generator'
import type { ItfWorkoutGenerationResponse } from '@/interface/itfWorkouts'
import { useRecentLogsByExercise, useLogSet } from '@/hooks/useWorkoutLogs'
import { cn } from '@/utils'
import { RestTimer } from './RestTimer'
import { toast } from 'sonner'

interface WorkoutSessionViewProps {
   data: ItfWorkoutGenerationResponse
   /** Cuando el usuario tap'ea "Salir" o "Terminar". */
   onExit: () => void
}

/** Estado por serie (peso + reps logradas + done). */
interface SetState {
   weight: string
   reps: string
   done: boolean
}

/** Estado por ejercicio. */
interface ExerciseState {
   sets: SetState[]
   rpe: number
   saved: boolean
}

/** Estado del timer global. */
type TimerState = {
   blockIdx: number
   setIdx: number
   seconds: number
} | null

const parseRepsCount = (reps: string): number =>
   Number.parseInt(String(reps).match(/\d+/)?.[0] ?? '8', 10)

export const WorkoutSessionView = ({ data, onExit }: WorkoutSessionViewProps) => {
   const session = data.session
   const blocks = session.blocks

   /* Lookup batch de logs recientes para sugerencia de progresión. */
   const exerciseIds = useMemo(() => blocks.map((b) => b.exercise_id), [blocks])
   const recentLogsQuery = useRecentLogsByExercise(exerciseIds)
   const logsByExercise = recentLogsQuery.data ?? {}

   const logSet = useLogSet()

   /* Inicializar estado de ejercicios con peso sugerido por bloque. */
   const [byExercise, setByExercise] = useState<Record<string, ExerciseState>>(() => {
      const init: Record<string, ExerciseState> = {}
      for (const b of blocks) {
         const reps = parseRepsCount(b.reps)
         const recent = logsByExercise[b.exercise_id] ?? []
         const suggestion = suggestNextWeight({
            recentLogs: recent,
            targetRpe: data.prescribedRpe,
            isCompound: true,
            prescribedReps: reps,
            isDeloadWeek: data.isDeloadWeek
         })
         init[b.exercise_id] = {
            sets: Array.from({ length: b.sets }, () => ({
               weight: suggestion.weightKg > 0 ? String(suggestion.weightKg) : '',
               reps: String(reps),
               done: false
            })),
            rpe: data.prescribedRpe,
            saved: false
         }
      }
      return init
   })

   const [timer, setTimer] = useState<TimerState>(null)
   const [confirmExit, setConfirmExit] = useState(false)

   const totalBlocks = blocks.length
   const completedBlocks = blocks.filter((b) => byExercise[b.exercise_id]?.saved).length
   const allDone = completedBlocks === totalBlocks && totalBlocks > 0

   const updateSet = (exerciseId: string, setIdx: number, patch: Partial<SetState>) => {
      setByExercise((prev) => {
         const exState = prev[exerciseId]
         if (!exState) return prev
         const newSets = exState.sets.map((s, i) => (i === setIdx ? { ...s, ...patch } : s))
         return { ...prev, [exerciseId]: { ...exState, sets: newSets } }
      })
   }

   const updateRpe = (exerciseId: string, rpe: number) => {
      setByExercise((prev) => {
         const exState = prev[exerciseId]
         if (!exState) return prev
         return { ...prev, [exerciseId]: { ...exState, rpe } }
      })
   }

   const handleSetDone = (blockIdx: number, setIdx: number) => {
      const b = blocks[blockIdx]
      updateSet(b.exercise_id, setIdx, { done: true })
      /* Activar timer si NO es la última serie del ejercicio. */
      const ex = byExercise[b.exercise_id]
      const isLastSetOfBlock = setIdx === (ex?.sets.length ?? 1) - 1
      if (!isLastSetOfBlock) {
         setTimer({ blockIdx, setIdx, seconds: b.rest_sec })
      }
   }

   const handleSaveExercise = (blockIdx: number) => {
      const b = blocks[blockIdx]
      const ex = byExercise[b.exercise_id]
      if (!ex) return
      const doneSets = ex.sets.filter((s) => s.done)
      if (doneSets.length === 0) {
         toast('Marca al menos una serie como hecha 🌿')
         return
      }
      /* Tomamos el promedio de las reps logradas + el peso máximo usado. */
      const avgReps = Math.round(
         doneSets.reduce((sum, s) => sum + Number.parseInt(s.reps || '0', 10) || 0, 0) /
            doneSets.length
      )
      const maxWeight = Math.max(...doneSets.map((s) => Number(s.weight.replace(',', '.')) || 0))
      logSet.mutate(
         {
            exercise_id: b.exercise_id,
            exercise_name: b.name,
            sets_completed: doneSets.length,
            reps_completed: Math.max(1, avgReps),
            weight_kg: maxWeight,
            rpe_actual: ex.rpe
         },
         {
            onSuccess: () => {
               setByExercise((prev) => ({
                  ...prev,
                  [b.exercise_id]: { ...ex, saved: true }
               }))
            }
         }
      )
   }

   return (
      <div className='space-y-4'>
         {/* Header: progreso + salir */}
         <Card className='border-primary/30 bg-primary/5'>
            <CardContent className='flex items-center justify-between gap-3 pt-6'>
               <div className='space-y-0.5'>
                  <p className='text-xs text-muted-foreground'>Sesión activa</p>
                  <p className='text-sm font-medium capitalize'>
                     {data.focus.replace('_', ' ')} · {completedBlocks}/{totalBlocks} ejercicios
                  </p>
               </div>
               <Button variant='outline' size='sm' onClick={() => setConfirmExit(true)}>
                  <X className='h-3.5 w-3.5' />
                  Salir
               </Button>
            </CardContent>
         </Card>

         {/* Warmup (informativo) */}
         {session.warmup ? (
            <Card>
               <CardHeader className='pb-2'>
                  <CardTitle className='text-sm'>
                     Calentamiento · {session.warmup.duration_min} min
                  </CardTitle>
               </CardHeader>
               <CardContent className='space-y-1 text-xs text-muted-foreground'>
                  {session.warmup.movements.map((m, i) => (
                     <p key={i}>• {m}</p>
                  ))}
               </CardContent>
            </Card>
         ) : null}

         {/* Bloques de ejercicio */}
         {blocks.map((b, blockIdx) => {
            const ex = byExercise[b.exercise_id]
            if (!ex) return null
            const videoUrl = findVideoUrlForExercise(b.name)
            const allSetsDone = ex.sets.every((s) => s.done)
            const recent = logsByExercise[b.exercise_id] ?? []
            const lastLog = recent[0]

            return (
               <Card
                  key={b.exercise_id}
                  className={cn('transition-colors', ex.saved && 'border-primary/40 bg-primary/5')}
               >
                  <CardHeader className='pb-2'>
                     <CardTitle className='flex items-center justify-between text-base'>
                        <span className='flex items-center gap-2'>
                           {ex.saved ? (
                              <Check className='h-4 w-4 text-primary' />
                           ) : (
                              <span className='inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium'>
                                 {blockIdx + 1}
                              </span>
                           )}
                           {b.name}
                        </span>
                        <span className='text-xs font-normal text-muted-foreground'>
                           {b.sets} × {b.reps}
                        </span>
                     </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3 text-sm'>
                     <p className='italic text-muted-foreground'>"{b.tip}"</p>
                     {videoUrl ? (
                        <a
                           href={videoUrl}
                           target='_blank'
                           rel='noopener noreferrer'
                           className='inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline'
                        >
                           <PlayCircle className='h-3.5 w-3.5' />
                           Ver técnica
                        </a>
                     ) : null}
                     {lastLog ? (
                        <p className='text-xs text-muted-foreground'>
                           Última vez: {formatLastSession(lastLog)}
                        </p>
                     ) : null}

                     <Separator />

                     {/* Filas de serie */}
                     <div className='space-y-2'>
                        {ex.sets.map((set, setIdx) => (
                           <SetRow
                              key={setIdx}
                              setNumber={setIdx + 1}
                              weight={set.weight}
                              reps={set.reps}
                              done={set.done}
                              disabled={ex.saved}
                              onChangeWeight={(v) =>
                                 updateSet(b.exercise_id, setIdx, { weight: v })
                              }
                              onChangeReps={(v) => updateSet(b.exercise_id, setIdx, { reps: v })}
                              onDone={() => handleSetDone(blockIdx, setIdx)}
                           />
                        ))}
                     </div>

                     {/* RPE + Guardar */}
                     {allSetsDone && !ex.saved ? (
                        <>
                           <Separator />
                           <div className='space-y-2'>
                              <div className='flex items-center justify-between'>
                                 <span className='text-xs text-muted-foreground'>
                                    ¿Qué tan duro? RPE
                                 </span>
                                 <span className='text-xs font-medium'>{ex.rpe}/10</span>
                              </div>
                              <div className='grid grid-cols-10 gap-1'>
                                 {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                    <button
                                       key={n}
                                       type='button'
                                       onClick={() => updateRpe(b.exercise_id, n)}
                                       aria-pressed={ex.rpe === n}
                                       className={cn(
                                          'rounded-md border p-1 text-[10px] transition-colors',
                                          ex.rpe === n
                                             ? 'border-primary bg-primary/10 text-primary'
                                             : 'border-border text-muted-foreground hover:bg-muted'
                                       )}
                                    >
                                       {n}
                                    </button>
                                 ))}
                              </div>
                              <Button
                                 size='sm'
                                 onClick={() => handleSaveExercise(blockIdx)}
                                 disabled={logSet.isPending}
                                 className='w-full'
                              >
                                 <Save className='h-3.5 w-3.5' />
                                 Guardar ejercicio
                              </Button>
                           </div>
                        </>
                     ) : null}
                  </CardContent>
               </Card>
            )
         })}

         {/* Terminar sesión */}
         {allDone ? (
            <Card className='border-primary/40 bg-primary/5'>
               <CardContent className='space-y-2 pt-6 text-center'>
                  <p className='text-sm font-medium'>¡Sesión completa! 💪</p>
                  <p className='text-xs text-muted-foreground'>
                     Bien hecho. Cada repetición cuenta.
                  </p>
                  <Button onClick={onExit} className='w-full'>
                     Terminar
                  </Button>
               </CardContent>
            </Card>
         ) : null}

         {/* Cooldown (informativo) */}
         {session.cooldown ? (
            <Card>
               <CardHeader className='pb-2'>
                  <CardTitle className='text-sm'>
                     Cool-down · {session.cooldown.duration_min} min
                  </CardTitle>
               </CardHeader>
               <CardContent className='space-y-1 text-xs text-muted-foreground'>
                  {session.cooldown.movements.map((m, i) => (
                     <p key={i}>• {m}</p>
                  ))}
               </CardContent>
            </Card>
         ) : null}

         {/* Timer flotante */}
         {timer ? (
            <RestTimer
               seconds={timer.seconds}
               onClose={() => setTimer(null)}
               onComplete={() => {
                  toast('¡A la siguiente serie! 💪')
                  setTimer(null)
               }}
            />
         ) : null}

         {/* Confirm salir */}
         {confirmExit ? (
            <div className='fixed inset-0 z-40 flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center'>
               <Card className='w-full max-w-md'>
                  <CardContent className='space-y-3 pt-6 text-sm'>
                     <p className='font-medium'>¿Salir de la sesión?</p>
                     <p className='text-xs text-muted-foreground'>
                        Los ejercicios que ya guardaste quedan registrados. Lo demás no se pierde —
                        vuelves cuando quieras.
                     </p>
                     <div className='grid grid-cols-2 gap-2'>
                        <Button variant='outline' size='sm' onClick={() => setConfirmExit(false)}>
                           Volver
                        </Button>
                        <Button size='sm' onClick={onExit}>
                           Sí, salir
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            </div>
         ) : null}
      </div>
   )
}

/* ============================================================
 *  SetRow — una fila por serie individual
 * ============================================================ */
interface SetRowProps {
   setNumber: number
   weight: string
   reps: string
   done: boolean
   disabled: boolean
   onChangeWeight: (v: string) => void
   onChangeReps: (v: string) => void
   onDone: () => void
}

const SetRow = ({
   setNumber,
   weight,
   reps,
   done,
   disabled,
   onChangeWeight,
   onChangeReps,
   onDone
}: SetRowProps) => (
   <div
      className={cn(
         'flex items-center gap-2 rounded-md border p-2',
         done ? 'border-primary/40 bg-primary/5' : 'border-border'
      )}
   >
      <span className='w-6 text-xs font-medium text-muted-foreground'>#{setNumber}</span>
      <div className='flex-1 space-y-0.5'>
         <p className='text-[10px] text-muted-foreground'>Peso (kg)</p>
         <Input
            type='number'
            inputMode='decimal'
            value={weight}
            onChange={(e) => onChangeWeight(e.target.value)}
            step='0.25'
            disabled={done || disabled}
            placeholder='0'
            className='h-8 text-sm'
         />
      </div>
      <div className='flex-1 space-y-0.5'>
         <p className='text-[10px] text-muted-foreground'>Reps</p>
         <Input
            type='number'
            inputMode='numeric'
            value={reps}
            onChange={(e) => onChangeReps(e.target.value)}
            disabled={done || disabled}
            placeholder='0'
            className='h-8 text-sm'
         />
      </div>
      <button
         type='button'
         onClick={onDone}
         disabled={done || disabled}
         aria-label={done ? 'Serie completada' : 'Marcar serie como hecha'}
         className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
            done
               ? 'bg-primary text-primary-foreground'
               : 'border border-border text-muted-foreground hover:bg-muted'
         )}
      >
         {done ? <Check className='h-4 w-4' /> : <Clock className='h-4 w-4' />}
      </button>
   </div>
)
