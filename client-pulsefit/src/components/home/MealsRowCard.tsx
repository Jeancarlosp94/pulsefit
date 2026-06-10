import { Coffee, Salad, Moon, Sparkles, Cookie, Check, X, Replace } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ItfMealOfToday } from '@/interface/itfMeals'
import type { ItfMealType } from '@/features/meal-generator'
import { cn } from '@/utils'

const MEAL_ICON: Record<ItfMealType, React.ComponentType<{ className?: string }>> = {
   breakfast: Coffee,
   snack_am: Sparkles,
   lunch: Salad,
   snack_pm: Cookie,
   dinner: Moon
}

const MEAL_LABEL: Record<ItfMealType, string> = {
   breakfast: 'Desayuno',
   snack_am: 'Media mañana',
   lunch: 'Almuerzo',
   snack_pm: 'Media tarde',
   dinner: 'Cena'
}

interface MealsRowCardProps {
   meals: ItfMealOfToday[]
   onTapMeal: (meal: ItfMealOfToday) => void
}

export const MealsRowCard = ({ meals, onTapMeal }: MealsRowCardProps) => {
   if (meals.length === 0) return null
   return (
      <Card>
         <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Comidas de hoy</CardTitle>
         </CardHeader>
         <CardContent>
            <div className='-mx-1 flex gap-2 overflow-x-auto px-1 pb-2'>
               {meals.map((meal) => (
                  <MealMiniCard key={meal.meal_type} meal={meal} onTap={() => onTapMeal(meal)} />
               ))}
            </div>
         </CardContent>
      </Card>
   )
}

interface MealMiniCardProps {
   meal: ItfMealOfToday
   onTap: () => void
}

const MealMiniCard = ({ meal, onTap }: MealMiniCardProps) => {
   const Icon = MEAL_ICON[meal.meal_type]
   const label = MEAL_LABEL[meal.meal_type]
   const done = meal.status === 'planned' || meal.status === 'substituted'
   const skipped = meal.status === 'skipped'

   return (
      <button
         type='button'
         onClick={onTap}
         className={cn(
            'flex w-36 shrink-0 flex-col gap-1.5 rounded-md border p-3 text-left transition-colors',
            done && 'border-primary/50 bg-primary/5',
            skipped && 'border-muted text-muted-foreground opacity-60',
            !done && !skipped && 'border-border hover:bg-muted/40'
         )}
      >
         <div className='flex items-center justify-between'>
            <Icon className={cn('h-4 w-4', done ? 'text-primary' : 'text-muted-foreground')} />
            {done ? (
               <div className='flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                  {meal.status === 'substituted' ? (
                     <Replace className='h-2.5 w-2.5' />
                  ) : (
                     <Check className='h-2.5 w-2.5' />
                  )}
               </div>
            ) : null}
            {skipped ? <X className='h-3.5 w-3.5' /> : null}
         </div>
         <div className='space-y-0.5'>
            <p className='text-[10px] font-medium uppercase tracking-wide text-muted-foreground'>
               {label}
            </p>
            <p className='line-clamp-2 text-xs font-medium leading-tight'>{meal.recipe_name}</p>
            <p className='text-[10px] text-muted-foreground'>{meal.plannedKcal} kcal</p>
         </div>
      </button>
   )
}
