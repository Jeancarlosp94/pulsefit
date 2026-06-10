import { useState } from 'react'
import { ArrowLeft, Dumbbell, Salad, Heart, X } from 'lucide-react'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
   generateRescue,
   type ItfRescueDomain,
   type ItfRescueResponse,
   type ItfRescueTrigger
} from '@/features/rescue-engine'
import { useLogRescue } from '@/hooks/useRescue'
import { cn } from '@/utils'

interface RescueDialogProps {
   open: boolean
   onOpenChange: (v: boolean) => void
   /** Si se abre con un dominio preseleccionado (ej: desde MealCard). */
   defaultDomain?: ItfRescueDomain
}

const DOMAINS: Array<{
   id: ItfRescueDomain
   label: string
   icon: React.ComponentType<{ className?: string }>
}> = [
   { id: 'workout', label: 'Entrenamiento', icon: Dumbbell },
   { id: 'meal', label: 'Comida', icon: Salad },
   { id: 'emotional', label: 'Ánimo', icon: Heart }
]

const TRIGGERS_BY_DOMAIN: Record<
   ItfRescueDomain,
   Array<{ id: ItfRescueTrigger; label: string }>
> = {
   workout: [
      { id: 'no_time', label: 'Sin tiempo' },
      { id: 'no_energy', label: 'Sin energía' },
      { id: 'low_mood', label: 'No me siento bien' },
      { id: 'away_from_home', label: 'Fuera de casa' },
      { id: 'injury', label: 'Me duele algo' }
   ],
   meal: [
      { id: 'no_cooking', label: 'No quiero cocinar' },
      { id: 'no_ingredients', label: 'No tengo ingredientes' },
      { id: 'eating_out', label: 'Como fuera' },
      { id: 'craving', label: 'Tengo antojo' },
      { id: 'low_budget_today', label: 'Bolsillo apretado' }
   ],
   emotional: [
      { id: 'overwhelmed', label: 'Estoy abrumada/o' },
      { id: 'binge', label: 'Me pasé con la comida' },
      { id: 'low_mood_streak', label: 'Llevo días bajos' }
   ]
}

type Step = 'domain' | 'trigger' | 'options'

export const RescueDialog = ({ open, onOpenChange, defaultDomain }: RescueDialogProps) => {
   const [domain, setDomain] = useState<ItfRescueDomain | null>(defaultDomain ?? null)
   const [response, setResponse] = useState<ItfRescueResponse | null>(null)
   const logRescue = useLogRescue()

   const step: Step = response ? 'options' : domain ? 'trigger' : 'domain'

   const close = (v: boolean) => {
      if (!v) {
         setDomain(defaultDomain ?? null)
         setResponse(null)
      }
      onOpenChange(v)
   }

   const handleTrigger = (trigger: ItfRescueTrigger) => {
      if (!domain) return
      const res = generateRescue({ domain, trigger })
      setResponse(res)
   }

   const handleChoose = (altId: string) => {
      if (!response) return
      const chosen = response.alternatives.find((a) => a.id === altId) ?? null
      logRescue.mutate(
         {
            domain: response.domain,
            trigger: response.trigger,
            alternatives_offered: response.alternatives,
            alternative_chosen: chosen
         },
         {
            onSuccess: () => close(false)
         }
      )
   }

   const handleSkip = () => {
      if (!response) return
      logRescue.mutate(
         {
            domain: response.domain,
            trigger: response.trigger,
            alternatives_offered: response.alternatives,
            alternative_chosen: null
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
               <DialogTitle>
                  {step === 'domain' && 'Hoy no puedo'}
                  {step === 'trigger' && '¿Con qué te ayudamos?'}
                  {step === 'options' && 'Tres opciones para ti'}
               </DialogTitle>
               <DialogDescription>
                  {step === 'domain' &&
                     'Sin juicio. Elige el área y te damos alternativas que funcionan.'}
                  {step === 'trigger' && 'Cuanto más específico, mejor te ayudamos.'}
                  {step === 'options' && response?.intro}
               </DialogDescription>
            </DialogHeader>

            {/* PASO 1 — Dominio */}
            {step === 'domain' ? (
               <div className='space-y-2'>
                  {DOMAINS.map(({ id, label, icon: Icon }) => (
                     <button
                        key={id}
                        type='button'
                        onClick={() => setDomain(id)}
                        className='flex w-full items-center gap-3 rounded-md border border-border bg-background p-4 text-left transition-colors hover:bg-muted'
                     >
                        <Icon className='h-5 w-5 shrink-0 text-primary' />
                        <span className='text-sm font-medium'>{label}</span>
                     </button>
                  ))}
               </div>
            ) : null}

            {/* PASO 2 — Trigger */}
            {step === 'trigger' && domain ? (
               <div className='space-y-2'>
                  <button
                     type='button'
                     onClick={() => setDomain(null)}
                     className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
                  >
                     <ArrowLeft className='h-3 w-3' />
                     Volver
                  </button>
                  {TRIGGERS_BY_DOMAIN[domain].map((t) => (
                     <button
                        key={t.id}
                        type='button'
                        onClick={() => handleTrigger(t.id)}
                        className='w-full rounded-md border border-border bg-background p-3 text-left text-sm transition-colors hover:bg-muted'
                     >
                        {t.label}
                     </button>
                  ))}
               </div>
            ) : null}

            {/* PASO 3 — Opciones */}
            {step === 'options' && response ? (
               <div className='space-y-2'>
                  <button
                     type='button'
                     onClick={() => setResponse(null)}
                     className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
                  >
                     <ArrowLeft className='h-3 w-3' />
                     Volver
                  </button>

                  {response.severity === 'warn' ? (
                     <div className='rounded-md border border-secondary/40 bg-secondary/5 p-3 text-xs text-secondary-foreground'>
                        Notamos algo que vale la pena revisar con un profesional. Buscar ayuda es
                        valentía 🌿
                     </div>
                  ) : null}

                  {response.alternatives.map((alt) => (
                     <button
                        key={alt.id}
                        type='button'
                        disabled={logRescue.isPending}
                        onClick={() => handleChoose(alt.id)}
                        className={cn(
                           'flex w-full items-start gap-3 rounded-md border border-border bg-background p-3 text-left transition-colors hover:bg-muted disabled:opacity-50'
                        )}
                     >
                        <span className='text-2xl' aria-hidden='true'>
                           {alt.icon}
                        </span>
                        <div className='space-y-0.5'>
                           <p className='text-sm font-medium'>{alt.title}</p>
                           <p className='text-xs text-muted-foreground'>{alt.description}</p>
                        </div>
                     </button>
                  ))}

                  <Button
                     variant='ghost'
                     size='sm'
                     onClick={handleSkip}
                     disabled={logRescue.isPending}
                     className='w-full text-muted-foreground'
                  >
                     <X className='h-3.5 w-3.5' />
                     Ninguna me sirve hoy
                  </Button>
               </div>
            ) : null}
         </DialogContent>
      </Dialog>
   )
}
