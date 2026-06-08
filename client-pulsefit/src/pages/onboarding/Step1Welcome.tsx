import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage
} from '@/components/ui/form'
import { OnboardingFooter, OnboardingLayout } from '@/components/onboarding'
import { useOnboardingStore } from '@/store/onboarding'
import { step1Schema, type Step1Values } from '@/validations'

const Step1Welcome = () => {
   const navigate = useNavigate()
   const { data, update, next, setStep } = useOnboardingStore()

   const form = useForm<Step1Values>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
         acceptedTerms: data.acceptedTerms,
         acceptedPrivacy: data.acceptedPrivacy
      }
   })

   const onSubmit = (values: Step1Values) => {
      update(values)
      next()
      navigate('/onboarding/2')
   }

   return (
      <OnboardingLayout
         step={1}
         title='¡Bienvenido a PulseFit! 🌱'
         subtitle='Antes de empezar, dos cositas rápidas.'
      >
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
               <Card>
                  <CardContent className='space-y-4 pt-6'>
                     <FormField
                        control={form.control}
                        name='acceptedTerms'
                        render={({ field }) => (
                           <FormItem className='flex items-start gap-3 space-y-0'>
                              <FormControl>
                                 <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className='mt-0.5'
                                 />
                              </FormControl>
                              <div className='space-y-1 text-sm leading-tight'>
                                 <FormLabel className='font-medium'>
                                    Acepto los términos de uso
                                 </FormLabel>
                                 <p className='text-xs text-muted-foreground'>
                                    Vamos a acompañarte sin presiones, con info validada por nutris
                                    y coaches reales.
                                 </p>
                                 <FormMessage />
                              </div>
                           </FormItem>
                        )}
                     />

                     <FormField
                        control={form.control}
                        name='acceptedPrivacy'
                        render={({ field }) => (
                           <FormItem className='flex items-start gap-3 space-y-0'>
                              <FormControl>
                                 <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className='mt-0.5'
                                 />
                              </FormControl>
                              <div className='space-y-1 text-sm leading-tight'>
                                 <FormLabel className='font-medium'>
                                    Acepto la política de privacidad
                                 </FormLabel>
                                 <p className='text-xs text-muted-foreground'>
                                    Tus datos son tuyos. Puedes pedir borrarlos cuando quieras.
                                 </p>
                                 <FormMessage />
                              </div>
                           </FormItem>
                        )}
                     />
                  </CardContent>
               </Card>

               <p className='px-2 text-center text-xs text-muted-foreground'>
                  En los próximos pasos te haremos preguntas cortas para armar un plan a tu medida.
                  Sin juicios, sin números crueles.
               </p>

               <OnboardingFooter
                  isFirst
                  onBack={() => {
                     setStep(1)
                     navigate('/perfil')
                  }}
               />
            </form>
         </Form>
      </OnboardingLayout>
   )
}

export default Step1Welcome
