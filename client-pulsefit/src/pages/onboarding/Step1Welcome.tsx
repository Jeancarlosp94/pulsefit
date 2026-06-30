import { useState } from 'react'
import { Zap, ListChecks } from 'lucide-react'
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
import { cn } from '@/utils'

const Step1Welcome = () => {
   const navigate = useNavigate()
   const { data, update, next, setStep } = useOnboardingStore()
   /* Sprint 11.8B: modo rápido — defaults inteligentes para los Steps 4/5/6. */
   const [fastTrack, setFastTrack] = useState(data.fastTrack)

   const form = useForm<Step1Values>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
         acceptedTerms: data.acceptedTerms,
         acceptedPrivacy: data.acceptedPrivacy
      }
   })

   const onSubmit = (values: Step1Values) => {
      update({ ...values, fastTrack })
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

               {/* Sprint 11.8B — selector de modo */}
               <div className='space-y-2'>
                  <p className='text-xs font-medium text-muted-foreground'>
                     ¿Cómo prefieres empezar?
                  </p>
                  <button
                     type='button'
                     onClick={() => setFastTrack(false)}
                     className={cn(
                        'flex w-full items-start gap-3 rounded-md border-2 p-3 text-left transition-colors',
                        !fastTrack
                           ? 'border-primary bg-primary/5'
                           : 'border-border bg-background hover:bg-muted'
                     )}
                  >
                     <ListChecks className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                     <div className='space-y-0.5'>
                        <p className='text-sm font-medium'>Configuración completa (7 pasos)</p>
                        <p className='text-xs text-muted-foreground'>
                           Te preguntamos sobre actividad, comida, horarios y equipo. Plan más
                           preciso desde el día 1.
                        </p>
                     </div>
                  </button>
                  <button
                     type='button'
                     onClick={() => setFastTrack(true)}
                     className={cn(
                        'flex w-full items-start gap-3 rounded-md border-2 p-3 text-left transition-colors',
                        fastTrack
                           ? 'border-primary bg-primary/5'
                           : 'border-border bg-background hover:bg-muted'
                     )}
                  >
                     <Zap className='mt-0.5 h-5 w-5 shrink-0 text-primary' />
                     <div className='space-y-0.5'>
                        <p className='text-sm font-medium'>Configuración rápida (3 pasos) ⚡</p>
                        <p className='text-xs text-muted-foreground'>
                           Solo objetivo, datos básicos y revisión. El resto lo dejas como default y
                           lo ajustas después en Perfil.
                        </p>
                     </div>
                  </button>
               </div>

               <p className='px-2 text-center text-xs text-muted-foreground'>
                  {fastTrack
                     ? 'Plan listo en menos de 1 minuto. Sin juicios, sin números crueles.'
                     : 'En los próximos pasos te haremos preguntas cortas para armar un plan a tu medida. Sin juicios, sin números crueles.'}
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
