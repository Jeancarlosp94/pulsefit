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
import { Slider } from '@/components/ui/slider'
import { OnboardingFooter, OnboardingLayout, OptionCard } from '@/components/onboarding'
import { useOnboardingStore } from '@/store/onboarding'
import { step6Schema, type Step6Values } from '@/validations'
import { EQUIPMENT_OPTIONS, WEEK_DAYS } from '@/config'
import { cn } from '@/utils'

const Step6Schedule = () => {
   const navigate = useNavigate()
   const { data, update, next, back } = useOnboardingStore()

   const form = useForm<Step6Values>({
      resolver: zodResolver(step6Schema),
      defaultValues: {
         availableDays: data.availableDays ?? [],
         availableMinutes: data.availableMinutes ?? 30,
         equipment: data.equipment ?? []
      }
   })

   const onSubmit = (values: Step6Values) => {
      update(values)
      next()
      navigate('/onboarding/7')
   }

   const selectedDays = form.watch('availableDays') ?? []
   const selectedEquipment = form.watch('equipment') ?? []
   const minutes = form.watch('availableMinutes') ?? 30

   const toggleDay = (val: number) => {
      const next = selectedDays.includes(val)
         ? selectedDays.filter((d) => d !== val)
         : [...selectedDays, val].sort((a, b) => a - b)
      form.setValue('availableDays', next, { shouldValidate: true })
   }

   const toggleEquip = (val: string) => {
      const current = selectedEquipment
      let next: string[]
      if (val === 'none') {
         next = current.includes('none') ? [] : ['none']
      } else if (val === 'gym_full') {
         next = current.includes('gym_full') ? [] : ['gym_full']
      } else {
         const cleaned = current.filter((c) => c !== 'none' && c !== 'gym_full')
         next = cleaned.includes(val) ? cleaned.filter((c) => c !== val) : [...cleaned, val]
      }
      form.setValue('equipment', next)
   }

   return (
      <OnboardingLayout
         step={6}
         title='¿Cuándo te queda mejor?'
         subtitle='Sin presiones. Marca solo los días que puedas, los demás son descanso.'
      >
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
               <FormField
                  control={form.control}
                  name='availableDays'
                  render={() => (
                     <FormItem>
                        <FormLabel>Días disponibles</FormLabel>
                        <div className='mt-2 flex flex-wrap justify-between gap-2'>
                           {WEEK_DAYS.map((d) => {
                              const active = selectedDays.includes(d.value)
                              return (
                                 <button
                                    key={d.value}
                                    type='button'
                                    onClick={() => toggleDay(d.value)}
                                    aria-pressed={active}
                                    aria-label={d.long}
                                    className={cn(
                                       'flex h-12 w-12 items-center justify-center rounded-full border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                       active
                                          ? 'border-primary bg-primary text-primary-foreground'
                                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                                    )}
                                 >
                                    {d.short}
                                 </button>
                              )
                           })}
                        </div>
                        <FormMessage />
                     </FormItem>
                  )}
               />

               <Card>
                  <CardContent className='space-y-3 pt-6'>
                     <FormField
                        control={form.control}
                        name='availableMinutes'
                        render={({ field }) => (
                           <FormItem>
                              <div className='flex items-center justify-between'>
                                 <FormLabel>Tiempo por sesión</FormLabel>
                                 <span className='text-sm font-medium text-primary'>
                                    {minutes} min
                                 </span>
                              </div>
                              <FormControl>
                                 <Slider
                                    value={[field.value ?? 30]}
                                    onValueChange={(v) => field.onChange(v[0])}
                                    min={10}
                                    max={120}
                                    step={5}
                                    aria-label='Minutos por sesión'
                                 />
                              </FormControl>
                              <p className='text-xs text-muted-foreground'>
                                 Adaptamos la rutina al tiempo real que tengas.
                              </p>
                              <FormMessage />
                           </FormItem>
                        )}
                     />
                  </CardContent>
               </Card>

               <FormField
                  control={form.control}
                  name='equipment'
                  render={() => (
                     <FormItem className='space-y-3'>
                        <FormLabel>Equipamiento</FormLabel>
                        <div className='grid grid-cols-2 gap-2'>
                           {EQUIPMENT_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 selected={selectedEquipment.includes(opt.value)}
                                 onSelect={() => toggleEquip(opt.value)}
                                 label={opt.label}
                                 compact
                              />
                           ))}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                           Si vas al gym completo o no tienes nada, elige esa opción y se desmarca
                           el resto.
                        </p>
                     </FormItem>
                  )}
               />

               <OnboardingFooter
                  onBack={() => {
                     back()
                     navigate('/onboarding/5')
                  }}
               />
            </form>
         </Form>
      </OnboardingLayout>
   )
}

export default Step6Schedule
