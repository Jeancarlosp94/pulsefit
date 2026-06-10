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
import {
   BUDGET_OPTIONS,
   COOKS_AT_HOME_OPTIONS,
   CUISINE_OPTIONS,
   DIETARY_RESTRICTIONS,
   FAVORITE_INGREDIENT_SUGGESTIONS,
   MEALS_PER_DAY_OPTIONS
} from '@/config'
import { cn } from '@/utils'
import type { ItfMealsPerDay } from '@/features/meal-generator'

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
         budgetLevel: data.budgetLevel ?? undefined,
         mealsPerDay: data.mealsPerDay ?? 3,
         favoriteCuisines: data.favoriteCuisines ?? [],
         favoriteIngredientIds: data.favoriteIngredientIds ?? []
      }
   })

   const onSubmit = (values: Step5Values) => {
      update({
         cooksAtHome: values.cooksAtHome,
         dietaryRestrictions: values.dietaryRestrictions,
         allergies: values.allergies ?? '',
         dislikedFoods: values.dislikedFoods,
         budgetLevel: values.budgetLevel,
         mealsPerDay: values.mealsPerDay as ItfMealsPerDay,
         favoriteCuisines: values.favoriteCuisines ?? [],
         favoriteIngredientIds: values.favoriteIngredientIds ?? []
      })
      next()
      navigate('/onboarding/6')
   }

   const toggleRestriction = (val: string) => {
      const current = form.getValues('dietaryRestrictions') ?? []
      const next = current.includes(val) ? current.filter((c) => c !== val) : [...current, val]
      form.setValue('dietaryRestrictions', next)
   }

   const toggleArrayValue = (field: 'favoriteCuisines' | 'favoriteIngredientIds', val: string) => {
      const current = form.getValues(field) ?? []
      const next = current.includes(val) ? current.filter((c) => c !== val) : [...current, val]
      form.setValue(field, next)
   }

   const selectedRestrictions = form.watch('dietaryRestrictions') ?? []
   const selectedMeals = form.watch('mealsPerDay') ?? 3
   const selectedCuisines = form.watch('favoriteCuisines') ?? []
   const selectedFavIng = form.watch('favoriteIngredientIds') ?? []

   return (
      <OnboardingLayout
         step={5}
         title='Vamos a la cocina 🥗'
         subtitle='Para que las recetas que te propongamos sean realistas.'
      >
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
               {/* NUEVO: cuántas comidas hace por día */}
               <FormField
                  control={form.control}
                  name='mealsPerDay'
                  render={({ field }) => (
                     <FormItem className='space-y-3'>
                        <FormLabel>¿Cuántas comidas haces al día?</FormLabel>
                        <div className='space-y-2'>
                           {MEALS_PER_DAY_OPTIONS.map((opt) => {
                              const n = Number.parseInt(opt.value, 10)
                              return (
                                 <OptionCard
                                    key={opt.value}
                                    selected={selectedMeals === n}
                                    onSelect={() => field.onChange(n)}
                                    label={opt.label}
                                    description={opt.description}
                                    emoji={opt.emoji}
                                    compact
                                 />
                              )
                           })}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                           Distribuimos tus calorías y proteínas entre estas comidas. Lo puedes
                           cambiar después.
                        </p>
                        <FormMessage />
                     </FormItem>
                  )}
               />

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

               {/* Gustos personales — cocinas favoritas */}
               <FormField
                  control={form.control}
                  name='favoriteCuisines'
                  render={() => (
                     <FormItem className='space-y-3'>
                        <FormLabel>¿Qué cocinas te gustan? (opcional)</FormLabel>
                        <p className='text-xs text-muted-foreground'>
                           Marcá las que quieras. Te vamos a priorizar recetas de esas tradiciones.
                        </p>
                        <div className='grid grid-cols-2 gap-2'>
                           {CUISINE_OPTIONS.map((opt) => (
                              <OptionCard
                                 key={opt.value}
                                 selected={selectedCuisines.includes(opt.value)}
                                 onSelect={() => toggleArrayValue('favoriteCuisines', opt.value)}
                                 label={opt.label}
                                 description={opt.description}
                                 emoji={opt.emoji}
                                 compact
                              />
                           ))}
                        </div>
                     </FormItem>
                  )}
               />

               {/* Gustos personales — ingredientes favoritos (chips) */}
               <FormField
                  control={form.control}
                  name='favoriteIngredientIds'
                  render={() => (
                     <FormItem className='space-y-3'>
                        <FormLabel>¿Qué ingredientes te encantan? (opcional)</FormLabel>
                        <p className='text-xs text-muted-foreground'>
                           Marcá los que sí o sí querés que aparezcan seguido.
                        </p>
                        <div className='flex flex-wrap gap-2'>
                           {FAVORITE_INGREDIENT_SUGGESTIONS.map((ing) => {
                              const isSelected = selectedFavIng.includes(ing.id)
                              return (
                                 <button
                                    key={ing.id}
                                    type='button'
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                       toggleArrayValue('favoriteIngredientIds', ing.id)
                                    }
                                    className={cn(
                                       'rounded-full border px-3 py-1.5 text-xs transition-colors',
                                       isSelected
                                          ? 'border-primary bg-primary/10 text-primary'
                                          : 'border-border text-muted-foreground hover:bg-muted'
                                    )}
                                 >
                                    {ing.label}
                                 </button>
                              )
                           })}
                        </div>
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
