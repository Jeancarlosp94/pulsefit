import { useMemo, useState } from 'react'
import { Check, X, Replace, ArrowLeft, Loader2, Pencil } from 'lucide-react'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogMeal } from '@/hooks/useMealLogs'
import type { ItfMealPlan, ItfMealOfToday, ItfMealLogStatus } from '@/interface/itfMeals'
import type { ItfMealType } from '@/features/meal-generator'
import { cn } from '@/utils'

interface MealLogDialogProps {
   open: boolean
   onOpenChange: (v: boolean) => void
   meal: ItfMealOfToday
   plan: ItfMealPlan
   dayIndex: number
}

type Step = 'choose' | 'pick_alt' | 'custom_macros'

const MEAL_LABEL: Record<ItfMealType, string> = {
   breakfast: 'Desayuno',
   snack_am: 'Media mañana',
   lunch: 'Almuerzo',
   snack_pm: 'Media tarde',
   dinner: 'Cena'
}

export const MealLogDialog = ({ open, onOpenChange, meal, plan, dayIndex }: MealLogDialogProps) => {
   const logMeal = useLogMeal()
   const [step, setStep] = useState<Step>('choose')
   const [customName, setCustomName] = useState('')
   const [customKcal, setCustomKcal] = useState('')
   const [customProtein, setCustomProtein] = useState('')
   const [customCarbs, setCustomCarbs] = useState('')
   const [customFats, setCustomFats] = useState('')

   /* Alternativas: las otras 2 recetas del mismo meal_type del plan vigente. */
   const alternatives = useMemo(() => {
      const all = plan.recipes_by_meal_type[meal.meal_type] ?? []
      return all.filter((r) => r.name !== meal.recipe_name)
   }, [plan.recipes_by_meal_type, meal.meal_type, meal.recipe_name])

   const close = (v: boolean) => {
      if (!v) {
         setStep('choose')
         setCustomName('')
         setCustomKcal('')
         setCustomProtein('')
         setCustomCarbs('')
         setCustomFats('')
      }
      onOpenChange(v)
   }

   const logWith = (
      status: ItfMealLogStatus,
      override?: {
         recipe_name?: string
         kcal?: number
         protein_g?: number
         carbs_g?: number
         fats_g?: number
      }
   ) => {
      logMeal.mutate(
         {
            plan_id: plan.id,
            day_index: dayIndex,
            meal_type: meal.meal_type,
            status,
            recipe_name: override?.recipe_name ?? meal.recipe_name,
            kcal: status === 'skipped' ? undefined : (override?.kcal ?? meal.plannedKcal),
            protein_g:
               status === 'skipped' ? undefined : (override?.protein_g ?? meal.plannedProteinG),
            carbs_g: status === 'skipped' ? undefined : (override?.carbs_g ?? meal.plannedCarbsG),
            fats_g: status === 'skipped' ? undefined : (override?.fats_g ?? meal.plannedFatsG)
         },
         {
            onSuccess: () => close(false)
         }
      )
   }

   const handleCustomSubmit = () => {
      const k = Number(customKcal) || 0
      const p = Number(customProtein) || 0
      const c = Number(customCarbs) || 0
      const f = Number(customFats) || 0
      if (!customName.trim() || k <= 0) return
      logWith('substituted', {
         recipe_name: customName.trim(),
         kcal: k,
         protein_g: p,
         carbs_g: c,
         fats_g: f
      })
   }

   return (
      <Dialog open={open} onOpenChange={close}>
         <DialogContent className='sm:max-w-md'>
            <DialogHeader>
               <DialogTitle>{MEAL_LABEL[meal.meal_type]}</DialogTitle>
               <DialogDescription>
                  {meal.recipe_name} · {meal.plannedKcal} kcal previstas
               </DialogDescription>
            </DialogHeader>

            {/* === Paso 1: Elegir qué pasó === */}
            {step === 'choose' ? (
               <div className='space-y-2'>
                  <button
                     type='button'
                     onClick={() => logWith('planned')}
                     disabled={logMeal.isPending}
                     className='flex w-full items-center gap-3 rounded-md border border-primary/40 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 disabled:opacity-50'
                  >
                     <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                        <Check className='h-4 w-4' />
                     </div>
                     <div className='space-y-0.5'>
                        <p className='text-sm font-medium'>Sí, lo comí</p>
                        <p className='text-xs text-muted-foreground'>
                           Registramos las macros planeadas.
                        </p>
                     </div>
                  </button>

                  <button
                     type='button'
                     onClick={() => setStep('pick_alt')}
                     disabled={logMeal.isPending}
                     className='flex w-full items-center gap-3 rounded-md border border-border bg-background p-4 text-left transition-colors hover:bg-muted disabled:opacity-50'
                  >
                     <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/30 text-secondary-foreground'>
                        <Replace className='h-4 w-4' />
                     </div>
                     <div className='space-y-0.5'>
                        <p className='text-sm font-medium'>Comí algo distinto</p>
                        <p className='text-xs text-muted-foreground'>
                           Elige entre tus otras recetas o describe lo que comiste.
                        </p>
                     </div>
                  </button>

                  <button
                     type='button'
                     onClick={() => logWith('skipped')}
                     disabled={logMeal.isPending}
                     className='flex w-full items-center gap-3 rounded-md border border-border bg-background p-4 text-left transition-colors hover:bg-muted disabled:opacity-50'
                  >
                     <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                        <X className='h-4 w-4' />
                     </div>
                     <div className='space-y-0.5'>
                        <p className='text-sm font-medium'>No comí esta comida</p>
                        <p className='text-xs text-muted-foreground'>
                           Sin juicio, lo registramos para que el plan se ajuste.
                        </p>
                     </div>
                  </button>

                  {logMeal.isPending ? (
                     <div className='flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground'>
                        <Loader2 className='h-3 w-3 animate-spin' />
                        Guardando…
                     </div>
                  ) : null}
               </div>
            ) : null}

            {/* === Paso 2: Elegir alternativa === */}
            {step === 'pick_alt' ? (
               <div className='space-y-3'>
                  <button
                     type='button'
                     onClick={() => setStep('choose')}
                     className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
                  >
                     <ArrowLeft className='h-3 w-3' />
                     Volver
                  </button>

                  {alternatives.length > 0 ? (
                     <>
                        <p className='text-xs text-muted-foreground'>
                           Tus otras recetas para {MEAL_LABEL[meal.meal_type].toLowerCase()}:
                        </p>
                        <div className='space-y-1.5'>
                           {alternatives.map((recipe) => {
                              const macros = recipe.components.actualMacros
                              return (
                                 <button
                                    key={recipe.name}
                                    type='button'
                                    disabled={logMeal.isPending}
                                    onClick={() =>
                                       logWith('substituted', {
                                          recipe_name: recipe.name,
                                          kcal: Math.round(macros.kcal),
                                          protein_g: Math.round(macros.proteinG),
                                          carbs_g: Math.round(macros.carbsG),
                                          fats_g: Math.round(macros.fatsG)
                                       })
                                    }
                                    className='w-full rounded-md border border-border bg-background p-3 text-left transition-colors hover:bg-muted disabled:opacity-50'
                                 >
                                    <p className='text-sm font-medium capitalize'>{recipe.name}</p>
                                    <p className='text-xs text-muted-foreground'>
                                       {Math.round(macros.kcal)} kcal ·{' '}
                                       {Math.round(macros.proteinG)}g prot
                                    </p>
                                 </button>
                              )
                           })}
                        </div>
                     </>
                  ) : null}

                  <button
                     type='button'
                     onClick={() => setStep('custom_macros')}
                     className='flex w-full items-center gap-3 rounded-md border border-dashed border-border bg-background p-3 text-left transition-colors hover:bg-muted'
                  >
                     <Pencil className='h-4 w-4 shrink-0 text-muted-foreground' />
                     <div className='space-y-0.5'>
                        <p className='text-sm font-medium'>Otra cosa — describe</p>
                        <p className='text-xs text-muted-foreground'>
                           Anota qué fue y sus macros aproximadas.
                        </p>
                     </div>
                  </button>
               </div>
            ) : null}

            {/* === Paso 3: Macros custom === */}
            {step === 'custom_macros' ? (
               <div className='space-y-3'>
                  <button
                     type='button'
                     onClick={() => setStep('pick_alt')}
                     className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
                  >
                     <ArrowLeft className='h-3 w-3' />
                     Volver
                  </button>

                  <div className='space-y-2'>
                     <div className='space-y-1'>
                        <Label htmlFor='custom-name' className='text-xs'>
                           ¿Qué comiste?
                        </Label>
                        <Input
                           id='custom-name'
                           value={customName}
                           onChange={(e) => setCustomName(e.target.value)}
                           placeholder='Ej: hamburguesa con papas'
                           maxLength={80}
                        />
                     </div>

                     <div className='grid grid-cols-2 gap-2'>
                        <div className='space-y-1'>
                           <Label htmlFor='custom-kcal' className='text-xs'>
                              kcal
                           </Label>
                           <Input
                              id='custom-kcal'
                              type='number'
                              inputMode='numeric'
                              value={customKcal}
                              onChange={(e) => setCustomKcal(e.target.value)}
                              placeholder='Aprox'
                           />
                        </div>
                        <div className='space-y-1'>
                           <Label htmlFor='custom-protein' className='text-xs'>
                              Proteína (g)
                           </Label>
                           <Input
                              id='custom-protein'
                              type='number'
                              inputMode='numeric'
                              value={customProtein}
                              onChange={(e) => setCustomProtein(e.target.value)}
                              placeholder='Aprox'
                           />
                        </div>
                        <div className='space-y-1'>
                           <Label htmlFor='custom-carbs' className='text-xs'>
                              Carbos (g)
                           </Label>
                           <Input
                              id='custom-carbs'
                              type='number'
                              inputMode='numeric'
                              value={customCarbs}
                              onChange={(e) => setCustomCarbs(e.target.value)}
                              placeholder='Aprox'
                           />
                        </div>
                        <div className='space-y-1'>
                           <Label htmlFor='custom-fats' className='text-xs'>
                              Grasas (g)
                           </Label>
                           <Input
                              id='custom-fats'
                              type='number'
                              inputMode='numeric'
                              value={customFats}
                              onChange={(e) => setCustomFats(e.target.value)}
                              placeholder='Aprox'
                           />
                        </div>
                     </div>
                  </div>

                  <Button
                     onClick={handleCustomSubmit}
                     disabled={!customName.trim() || !customKcal || logMeal.isPending}
                     className='w-full'
                  >
                     {logMeal.isPending ? (
                        <>
                           <Loader2 className='h-4 w-4 animate-spin' />
                           Guardando…
                        </>
                     ) : (
                        'Guardar'
                     )}
                  </Button>

                  <p className={cn('text-center text-[10px] text-muted-foreground')}>
                     Sin juicio. Lo registramos para que el plan se ajuste a tu ritmo real 🌿
                  </p>
               </div>
            ) : null}
         </DialogContent>
      </Dialog>
   )
}
