import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
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
import { useOnboardingStore } from '@/store/onboarding'
import { step3Schema, type Step3Values } from '@/validations'
import { SEX_OPTIONS, MEDICAL_CONDITIONS } from '@/config'

const Step3Body = () => {
   const navigate = useNavigate()
   const { data, update, next, back } = useOnboardingStore()

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
      update({
         age: values.age,
         sex: values.sex,
         heightCm: values.heightCm,
         currentWeightKg: values.currentWeightKg,
         medicalConditions: values.medicalConditions
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
                     <div className='grid grid-cols-2 gap-3'>
                        <FormField
                           control={form.control}
                           name='age'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>Edad</FormLabel>
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

               <OnboardingFooter
                  onBack={() => {
                     back()
                     navigate('/onboarding/2')
                  }}
               />
            </form>
         </Form>
      </OnboardingLayout>
   )
}

export default Step3Body
