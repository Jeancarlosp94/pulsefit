import { useEffect, useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLogMood, useTodayMood } from '@/hooks/useMoodLogs'
import type { ItfMoodLevel } from '@/interface/itfMeals'
import { cn } from '@/utils'

const EMOJI_BY_LEVEL: Record<ItfMoodLevel, string> = {
   1: '😟',
   2: '😕',
   3: '😐',
   4: '🙂',
   5: '😄'
}

const LEVELS: ItfMoodLevel[] = [1, 2, 3, 4, 5]

interface LevelPickerProps {
   value: ItfMoodLevel | null
   onChange: (v: ItfMoodLevel) => void
   ariaLabel: string
}

const LevelPicker = ({ value, onChange, ariaLabel }: LevelPickerProps) => (
   <div role='radiogroup' aria-label={ariaLabel} className='grid grid-cols-5 gap-1.5'>
      {LEVELS.map((n) => {
         const active = value === n
         return (
            <button
               key={n}
               type='button'
               role='radio'
               aria-checked={active}
               onClick={() => onChange(n)}
               className={cn(
                  'flex flex-col items-center gap-0.5 rounded-md border p-2 transition-colors',
                  active
                     ? 'border-primary bg-primary/10'
                     : 'border-border text-muted-foreground hover:bg-muted'
               )}
            >
               <span className='text-lg' aria-hidden='true'>
                  {EMOJI_BY_LEVEL[n]}
               </span>
               <span className='text-[10px] font-medium'>{n}</span>
            </button>
         )
      })}
   </div>
)

/**
 * Card de check-in diario de energía y ánimo. Aparece SOLO si el usuario
 * todavía no registró el día. Una vez que guarda, se reemplaza por una
 * card colapsada de "ya respondido hoy" para mantener feedback.
 */
export const MoodCheckCard = () => {
   const moodQuery = useTodayMood()
   const logMood = useLogMood()
   const today = moodQuery.data

   const [energy, setEnergy] = useState<ItfMoodLevel | null>(null)
   const [mood, setMood] = useState<ItfMoodLevel | null>(null)

   /* Resync cuando llega el dato del día. */
   useEffect(() => {
      if (today) {
         setEnergy(today.energy_level)
         setMood(today.mood_level)
      } else {
         setEnergy(null)
         setMood(null)
      }
   }, [today?.id])

   if (moodQuery.isLoading) return null

   /* Si ya respondió hoy, mostrar versión colapsada compacta. */
   if (today) {
      return (
         <Card>
            <CardContent className='flex items-center justify-between gap-3 pt-6 text-sm'>
               <div className='flex items-center gap-2'>
                  <Heart className='h-4 w-4 text-primary' />
                  <span className='text-muted-foreground'>Tu día hoy</span>
               </div>
               <div className='flex items-center gap-2 text-base'>
                  <span aria-label={`Energía ${today.energy_level}/5`}>
                     {EMOJI_BY_LEVEL[today.energy_level as ItfMoodLevel]}
                  </span>
                  <span className='text-xs text-muted-foreground'>·</span>
                  <span aria-label={`Ánimo ${today.mood_level}/5`}>
                     {EMOJI_BY_LEVEL[today.mood_level as ItfMoodLevel]}
                  </span>
               </div>
            </CardContent>
         </Card>
      )
   }

   const canSubmit = energy !== null && mood !== null && !logMood.isPending

   const handleSubmit = () => {
      if (!energy || !mood) return
      logMood.mutate({ energy_level: energy, mood_level: mood })
   }

   return (
      <Card>
         <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm'>
               <Heart className='h-4 w-4 text-primary' />
               ¿Cómo estás hoy?
            </CardTitle>
         </CardHeader>
         <CardContent className='space-y-3 text-sm'>
            <div className='space-y-1.5'>
               <p className='text-xs text-muted-foreground'>Energía</p>
               <LevelPicker value={energy} onChange={setEnergy} ariaLabel='Energía 1-5' />
            </div>

            <div className='space-y-1.5'>
               <p className='text-xs text-muted-foreground'>Ánimo</p>
               <LevelPicker value={mood} onChange={setMood} ariaLabel='Ánimo 1-5' />
            </div>

            <Button onClick={handleSubmit} disabled={!canSubmit} size='sm' className='w-full'>
               {logMood.isPending ? (
                  <>
                     <Loader2 className='h-3.5 w-3.5 animate-spin' />
                     Guardando…
                  </>
               ) : (
                  'Guardar'
               )}
            </Button>
            <p className='text-center text-[10px] text-muted-foreground'>
               Solo te lo preguntamos una vez al día 🌿
            </p>
         </CardContent>
      </Card>
   )
}
