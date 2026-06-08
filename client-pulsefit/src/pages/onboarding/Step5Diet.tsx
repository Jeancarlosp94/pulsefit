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
import { step5Schema, type Step5Values } from '@/validations'
import { BUDGET_OPTIONS, COOKS_AT_HOME_OPTIONS, DIETARY_RESTRICTIONS } from '@/config'

const Step5Diet = () => {
   const navigate = useNavigate()
   const { data, update, next, back } = useOnboardingStore()

   const form = useForm<Step5Values>({
      resolver: zodResolver(step5Schema),
      defaultValues: {
         cooksAtHome: data.cooksAtHome ?? undefined,
         dietaryRestrictions: data.dietaryRestrictions ?? [],
         allergies: data.allergies ?? '',
         dislikedFoods: data.dislikedFoods ?? [],
         budgetLevel: data.budgetLevel ?? undefined
      }
   })

   const onSubmit = (values: Step5Values) => {
      update({
         cooksAtHome: values.cooksAtHome,
         dietaryRestrictions: values.dietaryRestrictions,
         allergies: values.allergies ?? '',
         dislikedFoods: values.dislikedFoods,
         budgetLevel: values.budgetLevel
      })
      next()
      navigate('/onboarding/6')
   }

   const toggleRestriction = (val: string) => {
      const current = form.getValues('dietaryRestrictions') ?? []
      const next = current.includes(val) ? current.filter((c) => c !== val) : [...current, val]
      form.setValue('dietaryRestrictions', next)
   }

   const selectedRestrictions = form.watch('dietaryRestrictions') ?? []

   return (
      <OnboardingLayout
         step={5}
         title='Vamos a la cocina 🥗'
         subtitle='Para que las recetas que te propongamos sean realistas.'
      >
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
               <FormField
                  control={form.control}
                  name='cooksAtHome'
                  render={({ field }) => (
                     <FormItem className='space-y-3'>
                        <FormLabel>¿Cocinas en casa?</FormLabel>
                        <div className='space-y-2'>
                           {COOKS_AT_HOME_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 selected={field.value === opt.value}
                                 onSelect={() => field.onChange(opt.value)}
                                 label={opt.label}
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
                  name='dietaryRestrictions'
                  render={() => (
                     <FormItem className='space-y-3'>
                        <FormLabel>Restricciones dietarias (opcional)</FormLabel>
                        <div className='grid grid-cols-2 gap-2'>
                           {DIETARY_RESTRICTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 selected={selectedRestrictions.includes(opt.value)}
                                 onSelect={() => toggleRestriction(opt.value)}
                                 label={opt.label}
                                 compact
                              />
                           ))}
                        </div>
                     </FormItem>
                  )}
               />

               <Card>
                  <CardContent className='space-y-4 pt-6'>
                     <FormField
                        control={form.control}
                        name='allergies'
                        render={({ field }) => (
                           <FormItem>
                              <FormLabel>Alergias (opcional)</FormLabel>
                              <FormControl>
                                 <Input
                                    placeholder='Ej: nueces, mariscos…'
                                    {...field}
                                    value={field.value ?? ''}
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
                  name='budgetLevel'
                  render={({ field }) => (
                     <FormItem className='space-y-3'>
                        <FormLabel>Presupuesto para el mercado</FormLabel>
                        <div className='space-y-2'>
                           {BUDGET_OPTIONS.map((opt) => (
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
                     navigate('/onboarding/4')
                  }}
               />
            </form>
         </Form>
      </OnboardingLayout>
   )
}

export default Step5Diet
