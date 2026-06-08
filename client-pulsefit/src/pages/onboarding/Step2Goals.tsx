import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
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
import { step2Schema, type Step2Values } from '@/validations'
import { GOAL_OPTIONS } from '@/config'
import type { ItfGoal } from '@/features/nutrition-engine'

const Step2Goals = () => {
   const navigate = useNavigate()
   const { data, update, next, back } = useOnboardingStore()

   const form = useForm<Step2Values>({
      resolver: zodResolver(step2Schema),
      defaultValues: {
         goal: data.goal ?? undefined,
         targetWeightKg: data.targetWeightKg ?? undefined,
         targetDate: data.targetDate ?? undefined
      }
   })

   const watchGoal = form.watch('goal')
   const needsTarget = watchGoal === 'lose' || watchGoal === 'gain'

   /* Cuando cambia el goal a maintain/feel_better limpiamos los campos opcionales. */
   useEffect(() => {
      if (!needsTarget) {
         form.setValue('targetWeightKg', undefined)
         form.setValue('targetDate', undefined)
      }
   }, [needsTarget, form])

   const onSubmit = (values: Step2Values) => {
      update({
         goal: values.goal,
         targetWeightKg: values.targetWeightKg ?? null,
         targetDate: values.targetDate ?? null
      })
      next()
      navigate('/onboarding/3')
   }

   const goal = form.watch('goal') as ItfGoal | undefined

   /* Fecha mínima: 2 semanas desde hoy (regla de safety). */
   const minDate = new Date()
   minDate.setDate(minDate.getDate() + 14)
   const minDateIso = minDate.toISOString().slice(0, 10)

   return (
      <OnboardingLayout
         step={2}
         title='¿Qué te gustaría lograr?'
         subtitle='Elige el ritmo que mejor te encaje. Podrás cambiarlo cuando quieras.'
      >
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
               <FormField
                  control={form.control}
                  name='goal'
                  render={({ field }) => (
                     <FormItem className='space-y-3'>
                        <div className='space-y-2'>
                           {GOAL_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 selected={field.value === opt.value}
                                 onSelect={() => field.onChange(opt.value)}
                                 label={opt.label}
                                 description={opt.description}
                                 emoji={opt.emoji}
                              />
                           ))}
                        </div>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               {needsTarget ? (
                  <Card>
                     <CardContent className='space-y-4 pt-6'>
                        <FormField
                           control={form.control}
                           name='targetWeightKg'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>
                                    {goal === 'lose'
                                       ? '¿A qué peso quieres llegar?'
                                       : '¿Hasta qué peso quieres subir?'}
                                 </FormLabel>
                                 <FormControl>
                                    <Input
                                       type='number'
                                       inputMode='decimal'
                                       step='0.1'
                                       placeholder='Kg'
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
                           name='targetDate'
                           render={({ field }) => (
                              <FormItem>
                                 <FormLabel>¿Para cuándo te gustaría?</FormLabel>
                                 <FormControl>
                                    <Input type='date' min={minDateIso} {...field} />
                                 </FormControl>
                                 <p className='text-xs text-muted-foreground'>
                                    Mínimo 2 semanas. Tranqui, vamos sin prisa.
                                 </p>
                                 <FormMessage />
                              </FormItem>
                           )}
                        />
                     </CardContent>
                  </Card>
               ) : null}

               <OnboardingFooter
                  onBack={() => {
                     back()
                     navigate('/onboarding/1')
                  }}
               />
            </form>
         </Form>
      </OnboardingLayout>
   )
}

export default Step2Goals
