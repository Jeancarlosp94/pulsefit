import { useState } from 'react'
import {
   Clock,
   Flame,
   Sparkles,
   ChefHat,
   Salad,
   Coffee,
   Moon,
   Loader2,
   AlertCircle
} from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useGenerateMeal } from '@/hooks/useGenerateMeal'
import type { ItfMealType, ItfPlateOption } from '@/features/meal-generator'
import { cn } from '@/utils'

interface MealTypeOption {
   value: ItfMealType
   label: string
   icon: React.ComponentType<{ className?: string }>
}

const MEAL_TYPES: MealTypeOption[] = [
   { value: 'breakfast', label: 'Desayuno', icon: Coffee },
   { value: 'lunch', label: 'Almuerzo', icon: Salad },
   { value: 'dinner', label: 'Cena', icon: Moon },
   { value: 'snack_pm', label: 'Snack', icon: Sparkles }
]

const PlanPage = () => {
   const { profile, onboardingCompleted } = useAuth()
   const [mealType, setMealType] = useState<ItfMealType>('lunch')
   const [selected, setSelected] = useState<number>(0)
   const mutation = useGenerateMeal()

   const handleGenerate = () => {
      setSelected(0)
      mutation.mutate({ meal_type: mealType })
   }

   if (!onboardingCompleted) {
      return (
         <AppShell userName={profile?.name ?? null}>
            <TitleUI title='Tu plan' subtitle='Necesitamos terminar tu onboarding antes.' />
            <EmptyState
               icon={Sparkles}
               title='Falta tu onboarding'
               description='Termina los 7 pasos y volvé acá para tu primer plan personalizado.'
            />
         </AppShell>
      )
   }

   const data = mutation.data
   const options = data?.options ?? []
   const selectedOption: ItfPlateOption | undefined = options[selected]

   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI title='Tu plan' subtitle='Elige una comida y mirá las 3 opciones que armamos.' />

         <div className='space-y-4'>
            {/* Selector de meal_type */}
            <Card>
               <CardContent className='pt-6'>
                  <div className='grid grid-cols-4 gap-2'>
                     {MEAL_TYPES.map(({ value, label, icon: Icon }) => {
                        const active = mealType === value
                        return (
                           <button
                              key={value}
                              type='button'
                              onClick={() => setMealType(value)}
                              aria-pressed={active}
                              className={cn(
                                 'flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                 active
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground hover:bg-muted'
                              )}
                           >
                              <Icon className='h-5 w-5' />
                              <span>{label}</span>
                           </button>
                        )
                     })}
                  </div>
                  <Button
                     onClick={handleGenerate}
                     disabled={mutation.isPending}
                     className='mt-4 w-full'
                  >
                     {mutation.isPending ? (
                        <>
                           <Loader2 className='h-4 w-4 animate-spin' />
                           Preparando opciones…
                        </>
                     ) : (
                        <>
                           <ChefHat className='h-4 w-4' />
                           Generar 3 opciones
                        </>
                     )}
                  </Button>
               </CardContent>
            </Card>

            {/* Resultado */}
            {!data && !mutation.isPending ? (
               <EmptyState
                  icon={ChefHat}
                  title='Aún no generamos nada'
                  description='Elige una comida arriba y dale a "Generar 3 opciones". Te armamos un plato con tus macros y tus restricciones.'
               />
            ) : null}

            {data ? (
               <>
                  {data.source === 'fallback' ? (
                     <Card className='border-secondary/40 bg-secondary/5'>
                        <CardContent className='flex items-start gap-3 pt-6 text-sm'>
                           <AlertCircle
                              className='mt-0.5 h-4 w-4 shrink-0 text-secondary'
                              aria-hidden='true'
                           />
                           <p>
                              Te traemos plantillas simples por ahora. Mañana volveremos con la
                              creatividad de siempre 🌿.
                           </p>
                        </CardContent>
                     </Card>
                  ) : null}

                  {/* Macros target */}
                  <Card>
                     <CardHeader>
                        <CardTitle className='text-base'>Esta comida apunta a</CardTitle>
                     </CardHeader>
                     <CardContent className='grid grid-cols-4 gap-2 text-center text-sm'>
                        <div>
                           <p className='text-xs text-muted-foreground'>Kcal</p>
                           <p className='font-medium text-foreground'>{data.target.kcal}</p>
                        </div>
                        <div>
                           <p className='text-xs text-muted-foreground'>Prot</p>
                           <p className='font-medium text-foreground'>{data.target.proteinG}g</p>
                        </div>
                        <div>
                           <p className='text-xs text-muted-foreground'>Carbs</p>
                           <p className='font-medium text-foreground'>{data.target.carbsG}g</p>
                        </div>
                        <div>
                           <p className='text-xs text-muted-foreground'>Gras</p>
                           <p className='font-medium text-foreground'>{data.target.fatsG}g</p>
                        </div>
                     </CardContent>
                  </Card>

                  {/* Tabs de opciones */}
                  <div
                     role='tablist'
                     aria-label='Opciones generadas'
                     className='grid grid-cols-3 gap-2'
                  >
                     {options.map((_opt, idx) => (
                        <button
                           key={idx}
                           type='button'
                           role='tab'
                           aria-selected={selected === idx}
                           onClick={() => setSelected(idx)}
                           className={cn(
                              'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                              selected === idx
                                 ? 'border-primary bg-primary text-primary-foreground'
                                 : 'border-border text-muted-foreground hover:bg-muted'
                           )}
                        >
                           Opción {idx + 1}
                        </button>
                     ))}
                  </div>

                  {/* Opción seleccionada */}
                  {selectedOption ? (
                     <Card>
                        <CardHeader>
                           <CardTitle className='text-xl'>{selectedOption.name}</CardTitle>
                           <p className='text-sm text-muted-foreground'>
                              {selectedOption.description}
                           </p>
                        </CardHeader>
                        <CardContent className='space-y-3 text-sm'>
                           <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                              <span className='flex items-center gap-1'>
                                 <Clock className='h-3.5 w-3.5' />
                                 {selectedOption.prep_time_min} min
                              </span>
                              <span className='flex items-center gap-1'>
                                 <Flame className='h-3.5 w-3.5' />
                                 {data.components.actualMacros.kcal} kcal
                              </span>
                              <span className='capitalize'>{selectedOption.difficulty}</span>
                           </div>
                           <Separator />
                           <div>
                              <h3 className='mb-2 font-medium text-foreground'>Ingredientes</h3>
                              <ul className='space-y-1 text-sm text-muted-foreground'>
                                 <li>
                                    • {data.components.protein.grams}g de{' '}
                                    {data.components.protein.name}
                                 </li>
                                 <li>
                                    • {data.components.carb.grams}g de {data.components.carb.name}
                                 </li>
                                 <li>
                                    • {data.components.fat.grams}g de {data.components.fat.name}
                                 </li>
                                 {data.components.vegetable ? (
                                    <li>
                                       • {data.components.vegetable.grams}g de{' '}
                                       {data.components.vegetable.name}
                                    </li>
                                 ) : null}
                                 <li>• Ajo, sal, pimienta, limón y hierbas (libre uso)</li>
                              </ul>
                           </div>
                           <Separator />
                           <div>
                              <h3 className='mb-2 font-medium text-foreground'>Pasos</h3>
                              <ol className='space-y-2 text-sm'>
                                 {selectedOption.steps.map((step, idx) => (
                                    <li key={idx} className='flex gap-2'>
                                       <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary'>
                                          {idx + 1}
                                       </span>
                                       <span className='text-muted-foreground'>{step}</span>
                                    </li>
                                 ))}
                              </ol>
                           </div>
                        </CardContent>
                     </Card>
                  ) : null}
               </>
            ) : null}
         </div>
      </AppShell>
   )
}

export default PlanPage
