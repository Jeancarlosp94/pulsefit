import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { OnboardingFooter, OnboardingLayout, OptionCard } from '@/components/onboarding'
import { ProfessionalResourcesModal } from '@/components/safety'
import { useOnboardingStore } from '@/store/onboarding'
import { step3Schema, type Step3Values } from '@/validations'
import { SEX_OPTIONS, MEDICAL_CONDITIONS } from '@/config'
import { checkImcVsGoal, checkMinimumAge } from '@/features/safety-guards'
import { cn } from '@/utils'

const Step3Body = () => {
   const navigate = useNavigate()
   const { data, update, next, back } = useOnboardingStore()
   const [dob, setDob] = useState(data.dateOfBirth ?? '')
   const [eatingDisorderHistory, setEatingDisorderHistory] = useState(
      data.eatingDisorderHistory ?? false
   )
   const [resourcesOpen, setResourcesOpen] = useState(false)
   const [resourcesReason, setResourcesReason] = useState<string | null>(null)
   const [blockMsg, setBlockMsg] = useState<string | null>(null)
   const [adviceMsg, setAdviceMsg] = useState<string | null>(null)

   const form = useForm<Step3Values>({
      resolver: zodResolver(step3Schema),
      defaultValues: {
         age: data.age ?? undefined,
         sex: data.sex ?? undefined,
         heightCm: data.heightCm ?? undefined,
         currentWeightKg: data.currentWeightKg ?? undefined,
         medicalConditions: data.medicalConditions ?? []
      }
   })

   const onSubmit = (values: Step3Values) => {
      /* Validación 1: edad mínima 18. */
      const ageCheck = checkMinimumAge(dob)
      if (!ageCheck.ok) {
         setBlockMsg(ageCheck.message)
         return
      }

      /* Validación 2: IMC vs goal. */
      const imcCheck = checkImcVsGoal(values.currentWeightKg, values.heightCm, data.goal)
      if (!imcCheck.ok) {
         setBlockMsg(imcCheck.blockMessage)
         /* Sugerir recursos profesionales para casos de bajo peso. */
         if (imcCheck.category === 'underweight') {
            setResourcesReason(imcCheck.blockMessage)
            setResourcesOpen(true)
         }
         return
      }
      setBlockMsg(null)
      setAdviceMsg(imcCheck.adviceMessage)

      update({
         age: ageCheck.age ?? values.age,
         dateOfBirth: dob,
         sex: values.sex,
         heightCm: values.heightCm,
         currentWeightKg: values.currentWeightKg,
         medicalConditions: values.medicalConditions,
         eatingDisorderHistory
      })
      next()
      navigate('/onboarding/4')
   }

   const toggleCondition = (val: string) => {
      const current = form.getValues('medicalConditions') ?? []
      if (val === 'none') {
         form.setValue('medicalConditions', current.includes('none') ? [] : ['none'])
         return
      }
      const next = current.includes(val)
         ? current.filter((c) => c !== val)
         : [...current.filter((c) => c !== 'none'), val]
      form.setValue('medicalConditions', next)
   }

   const selectedConditions = form.watch('medicalConditions') ?? []

   return (
      <OnboardingLayout
         step={3}
         title='Cuéntanos de ti'
         subtitle='Esto nos ayuda a calcular tu plan con precisión.'
      >
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
               <Card>
                  <CardContent className='space-y-4 pt-6'>
                     {/* Fecha de nacimiento — fuente de verdad de la edad. */}
                     <FormItem>
                        <FormLabel>Fecha de nacimiento</FormLabel>
                        <FormControl>
                           <Input
                              type='date'
                              value={dob}
                              max={new Date().toISOString().slice(0, 10)}
                              onChange={(e) => setDob(e.target.value)}
                           />
                        </FormControl>
                        <p className='text-[10px] text-muted-foreground'>
                           PulseFit es para personas mayores de 18 años.
                        </p>
                     </FormItem>

                     <div className='grid grid-cols-2 gap-3'>
                        <FormField
                           control={form.control}
                           name='age'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Edad (auto)</FormLabel>
                                 <FormControl>
                                    <Input
                                       type='number'
                                       inputMode='numeric'
                                       placeholder='años'
                                       value={field.value ?? ''}
                                       onChange={(e) =>
                                          field.onChange(
                                             e.target.value === ''
                                                ? undefined
                                                : Number(e.target.value)
                                          )
                                       }
                                    />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />

                        <FormField
                           control={form.control}
                           name='heightCm'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Altura</FormLabel>
                                 <FormControl>
                                    <Input
                                       type='number'
                                       inputMode='numeric'
                                       placeholder='cm'
                                       value={field.value ?? ''}
                                       onChange={(e) =>
                                          field.onChange(
                                             e.target.value === ''
                                                ? undefined
                                                : Number(e.target.value)
                                          )
                                       }
                                    />
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </div>

                     <FormField
                        control={form.control}
                        name='currentWeightKg'
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Peso actual</FormLabel>
                              <FormControl>
                                 <Input
                                    type='number'
                                    inputMode='decimal'
                                    step='0.1'
                                    placeholder='kg'
                                    value={field.value ?? ''}
                                    onChange={(e) =>
                                       field.onChange(
                                          e.target.value === '' ? undefined : Number(e.target.value)
                                       )
                                    }
                                 />
                              </FormControl>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </CardContent>
               </Card>

               <FormField
                  control={form.control}
                  name='sex'
                  render={({ field }) => (
                     <FormItem className='space-y-3'>
                        <FormLabel>Sexo biológico</FormLabel>
                        <div className='space-y-2'>
                           {SEX_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 selected={field.value === opt.value}
                                 onSelect={() => field.onChange(opt.value)}
                                 label={opt.label}
                                 compact
                              />
                           ))}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                           Solo lo usamos para el cálculo del metabolismo basal.
                        </p>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name='medicalConditions'
                  render={() => (
                     <FormItem className='space-y-3'>
                        <FormLabel>¿Alguna condición de salud?</FormLabel>
                        <div className='grid grid-cols-2 gap-2'>
                           {MEDICAL_CONDITIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 selected={selectedConditions.includes(opt.value)}
                                 onSelect={() => toggleCondition(opt.value)}
                                 label={opt.label}
                                 compact
                              />
                           ))}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                           Si elegiste alguna, agregaremos un disclaimer en tu plan y te sugeriremos
                           consultar con un profesional.
                        </p>
                     </FormItem>
                  )}
               />

               {/* Sprint 11.8A — disclaimer médico específico para diabetes/hipertensión */}
               {selectedConditions.includes('diabetes') ||
               selectedConditions.includes('hypertension') ? (
                  <Card className='border-accent/30 bg-accent/5'>
                     <CardContent className='flex items-start gap-3 pt-6 text-sm'>
                        <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-accent' />
                        <div className='space-y-1.5'>
                           <p className='font-medium'>Importante: tu plan se ajustará</p>
                           {selectedConditions.includes('hypertension') ? (
                              <p className='text-xs text-muted-foreground'>
                                 🩺 <strong>Hipertensión:</strong> filtramos ingredientes altos en
                                 sodio (atún en lata, embutidos). Aun así, consulta con tu médico
                                 antes de cambios importantes en la dieta.
                              </p>
                           ) : null}
                           {selectedConditions.includes('diabetes') ? (
                              <p className='text-xs text-muted-foreground'>
                                 🩺 <strong>Diabetes:</strong> priorizamos carbohidratos complejos
                                 (camote, lentejas, avena) y evitamos índice glucémico alto. NO
                                 sustituye a tu endocrinólogo ni a tu plan personalizado.
                              </p>
                           ) : null}
                           <p className='text-[10px] italic text-muted-foreground'>
                              PulseFit no reemplaza atención médica profesional 🌿
                           </p>
                        </div>
                     </CardContent>
                  </Card>
               ) : null}

               {/* Checkbox de historial de TCA — activa modo intuitivo. */}
               <Card className='border-primary/30 bg-primary/5'>
                  <CardContent className='space-y-2 pt-6 text-sm'>
                     <label className='flex cursor-pointer items-start gap-3'>
                        <input
                           type='checkbox'
                           className='mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-primary'
                           checked={eatingDisorderHistory}
                           onChange={(e) => setEatingDisorderHistory(e.target.checked)}
                        />
                        <span className='space-y-1'>
                           <span className='flex items-center gap-1.5 font-medium'>
                              <Heart className='h-3.5 w-3.5 text-primary' />
                              He vivido con trastornos de alimentación
                           </span>
                           <span className='block text-xs text-muted-foreground'>
                              Si marcas esto, ocultamos métricas calóricas y nunca te sugerimos
                              déficit. Tu acompañamiento clínico siempre va primero 🌿
                           </span>
                        </span>
                     </label>
                  </CardContent>
               </Card>

               {/* Mensajes de bloqueo o advisor. */}
               {blockMsg ? (
                  <Card className='border-accent/40 bg-accent/10'>
                     <CardContent className='flex items-start gap-3 pt-6 text-sm'>
                        <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-accent' />
                        <p>{blockMsg}</p>
                     </CardContent>
                  </Card>
               ) : null}
               {adviceMsg ? (
                  <Card className='border-secondary/30 bg-secondary/5'>
                     <CardContent className={cn('pt-6 text-xs text-muted-foreground')}>
                        {adviceMsg}
                     </CardContent>
                  </Card>
               ) : null}

               <OnboardingFooter
                  onBack={() => {
                     back()
                     navigate('/onboarding/2')
                  }}
               />
            </form>
         </Form>

         <ProfessionalResourcesModal
            open={resourcesOpen}
            onOpenChange={setResourcesOpen}
            reason={resourcesReason}
            severity='medium'
         />
      </OnboardingLayout>
   )
}

export default Step3Body
