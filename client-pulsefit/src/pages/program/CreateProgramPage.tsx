import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Sparkles } from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useCreateProgram } from '@/hooks/usePrograms'
import {
   MODALITY_EMOJI,
   MODALITY_LABEL,
   PROGRAM_PRESETS,
   getPresetById,
   validatePhases
} from '@/features/program-engine'
import type { ItfModality } from '@/interface/itfPrograms'
import { cn } from '@/utils'

const CreateProgramPage = () => {
   const navigate = useNavigate()
   const { profile } = useAuth()
   const createProgram = useCreateProgram()

   const [step, setStep] = useState<'preset' | 'customize'>('preset')
   const [presetId, setPresetId] = useState<string | null>(null)
   const [name, setName] = useState('')
   const [targetWeight, setTargetWeight] = useState('')

   /* Build el preset seleccionado. */
   const preset = useMemo(() => {
      if (!presetId) return null
      const p = getPresetById(presetId)
      if (!p) return null
      return p.build({
         target_weight_kg: targetWeight ? Number(targetWeight) : null
      })
   }, [presetId, targetWeight])

   /* Validación de fases. */
   const validation = useMemo(() => {
      if (!preset) return { valid: true, message: null }
      return validatePhases(preset.phases, preset.total_weeks)
   }, [preset])

   const handleCreate = () => {
      if (!preset || !validation.valid) return
      createProgram.mutate(
         {
            ...preset,
            name: name.trim() || preset.name
         },
         {
            onSuccess: () => navigate('/programa')
         }
      )
   }

   if (step === 'preset') {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI
               title='Crear mi PulseFit ⚡'
               subtitle='Elige un programa base. Después lo personalizas.'
            />
            <button
               type='button'
               onClick={() => navigate(-1)}
               className='mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
            >
               <ChevronLeft className='h-3 w-3' />
               Volver
            </button>

            <div className='space-y-2'>
               {PROGRAM_PRESETS.map((p) => (
                  <button
                     key={p.id}
                     type='button'
                     onClick={() => {
                        setPresetId(p.id)
                        setName(p.build().name)
                        setStep('customize')
                     }}
                     className='flex w-full items-start gap-3 rounded-md border-2 border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted'
                  >
                     <span className='text-2xl' aria-hidden='true'>
                        {p.emoji}
                     </span>
                     <div className='space-y-0.5'>
                        <p className='text-sm font-medium'>{p.label}</p>
                        <p className='text-xs text-muted-foreground'>{p.description}</p>
                     </div>
                  </button>
               ))}
            </div>

            <p className='mt-4 text-center text-[10px] text-muted-foreground'>
               Cada programa se divide en fases con modalidades distintas. La app va ajustando tus
               sesiones según tu adherencia 🌿
            </p>
         </AppShell>
      )
   }

   /* Paso "customize" */
   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI title='Personaliza tu programa' subtitle='Revisa las fases y dale tu nombre.' />
         <button
            type='button'
            onClick={() => setStep('preset')}
            className='mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
         >
            <ChevronLeft className='h-3 w-3' />
            Cambiar preset
         </button>

         {/* Nombre */}
         <Card className='mb-3'>
            <CardContent className='space-y-3 pt-6'>
               <div className='space-y-1.5'>
                  <Label htmlFor='prog-name' className='text-xs'>
                     Nombre de tu programa
                  </Label>
                  <Input
                     id='prog-name'
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     placeholder='Mi PulseFit 2026'
                     maxLength={80}
                  />
               </div>
               {preset?.goal_type === 'lose_weight' || preset?.goal_type === 'gain_muscle' ? (
                  <div className='space-y-1.5'>
                     <Label htmlFor='prog-target' className='text-xs'>
                        Peso objetivo (opcional, kg)
                     </Label>
                     <Input
                        id='prog-target'
                        type='number'
                        inputMode='decimal'
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        placeholder='Ej: 65'
                        step={0.5}
                     />
                  </div>
               ) : null}
            </CardContent>
         </Card>

         {/* Timeline de fases */}
         {preset ? (
            <Card>
               <CardHeader className='pb-2'>
                  <CardTitle className='text-sm'>
                     {preset.total_weeks} semanas · {preset.phases.length} fases
                  </CardTitle>
               </CardHeader>
               <CardContent className='space-y-3 pt-2'>
                  {preset.phases.map((phase, idx) => (
                     <PhaseRow key={phase.phase_order} phase={phase} index={idx} />
                  ))}
                  {!validation.valid ? (
                     <p className='rounded-md border border-accent/30 bg-accent/5 p-2 text-xs text-accent-foreground'>
                        ⚠️ {validation.message}
                     </p>
                  ) : null}
               </CardContent>
            </Card>
         ) : null}

         <Button
            onClick={handleCreate}
            disabled={!validation.valid || createProgram.isPending}
            className='mt-4 w-full'
            size='lg'
         >
            {createProgram.isPending ? (
               <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Creando…
               </>
            ) : (
               <>
                  <Sparkles className='h-4 w-4' />
                  Crear mi PulseFit
               </>
            )}
         </Button>
      </AppShell>
   )
}

interface PhaseRowProps {
   phase: {
      phase_order: number
      phase_name: string
      modality: ItfModality
      weeks: number
      sessions_per_week: number
      description: string | null
   }
   index: number
}

const PhaseRow = ({ phase, index }: PhaseRowProps) => (
   <div
      className={cn(
         'flex items-start gap-3 rounded-md border border-border p-3 transition-colors',
         index === 0 && 'border-primary/40 bg-primary/5'
      )}
   >
      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium'>
         {phase.phase_order}
      </div>
      <div className='flex-1 space-y-1'>
         <p className='flex items-center gap-2 text-sm font-medium'>
            <span aria-hidden='true'>{MODALITY_EMOJI[phase.modality]}</span>
            {phase.phase_name}
            <span className='text-xs font-normal text-muted-foreground'>
               · {MODALITY_LABEL[phase.modality]}
            </span>
         </p>
         <p className='text-xs text-muted-foreground'>
            {phase.weeks} semanas · {phase.sessions_per_week} sesiones/sem
         </p>
         {phase.description ? (
            <p className='text-[10px] italic text-muted-foreground'>{phase.description}</p>
         ) : null}
      </div>
   </div>
)

export default CreateProgramPage
