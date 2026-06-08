import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { OnboardingFooter, OnboardingLayout, OptionCard } from '@/components/onboarding'
import { useOnboardingStore } from '@/store/onboarding'
import { step4Schema, type Step4Values } from '@/validations'
import { ACTIVITY_OPTIONS, FITNESS_LEVEL_OPTIONS } from '@/config'

const Step4Activity = () => {
   const navigate = useNavigate()
   const { data, update, next, back } = useOnboardingStore()

   const form = useForm<Step4Values>({
      resolver: zodResolver(step4Schema),
      defaultValues: {
         activityLevel: data.activityLevel ?? undefined,
         fitnessLevel: data.fitnessLevel ?? undefined
      }
   })

   const onSubmit = (values: Step4Values) => {
      update(values)
      next()
      navigate('/onboarding/5')
   }

   return (
      <OnboardingLayout
         step={4}
         title='¿Cuánto te mueves?'
         subtitle='Esto define cuántas calorías quemas un día normal.'
      >
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
               <FormField
                  control={form.control}
                  name='activityLevel'
                  render={({ field }) => (
                     <FormItem className='space-y-3'>
                        <FormLabel>Nivel de actividad diaria</FormLabel>
                        <div className='space-y-2'>
                           {ACTIVITY_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 selected={field.value === opt.value}
                                 onSelect={() => field.onChange(opt.value)}
                                 label={opt.label}
                                 description={opt.description}
                                 compact
                              />
                           ))}
                        </div>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <FormField
                  control={form.control}
                  name='fitnessLevel'
                  render={({ field }) => (
                     <FormItem className='space-y-3'>
                        <FormLabel>Experiencia entrenando</FormLabel>
                        <div className='space-y-2'>
                           {FITNESS_LEVEL_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 selected={field.value === opt.value}
                                 onSelect={() => field.onChange(opt.value)}
                                 label={opt.label}
                                 description={opt.description}
                                 compact
                              />
                           ))}
                        </div>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <OnboardingFooter
                  onBack={() => {
                     back()
                     navigate('/onboarding/3')
                  }}
               />
            </form>
         </Form>
      </OnboardingLayout>
   )
}

export default Step4Activity
