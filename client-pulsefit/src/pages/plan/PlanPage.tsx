import { useEffect, useMemo, useState } from 'react'
import {
   Clock,
   Flame,
   Sparkles,
   ChefHat,
   Salad,
   Coffee,
   Moon,
   Loader2,
   Cookie,
   X,
   RefreshCcw,
   Ban,
   CalendarDays,
   ShoppingCart,
   Repeat
} from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { ShoppingListDialog } from '@/components/ShoppingListDialog'
import { InfoTooltip } from '@/components/InfoTooltip'
import { SwapIngredientDialog } from '@/components/SwapIngredientDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useMealPlan, useGenerateMealPlan } from '@/hooks/useMealPlan'
import { type ItfMealType } from '@/features/meal-generator'
import type { ItfDailySchedule, ItfMealAssignment, ItfRecipe } from '@/interface/itfMeals'
import { cn } from '@/utils'
import { toast } from 'sonner'

interface MealTypeOption {
   label: string
   icon: React.ComponentType<{ className?: string }>
}

const MEAL_TYPE_CATALOG: Record<ItfMealType, MealTypeOption> = {
   breakfast: { label: 'Desayuno', icon: Coffee },
   snack_am: { label: 'Media mañana', icon: Sparkles },
   lunch: { label: 'Almuerzo', icon: Salad },
   snack_pm: { label: 'Media tarde', icon: Cookie },
   dinner: { label: 'Cena', icon: Moon }
}

const LOADER_MESSAGES = [
   'Armando tu plan semanal…',
   'Calculando porciones día a día…',
   'Buscando la mejor variedad…',
   'Casi listo, ya casi…'
]

const DAYS_OPTIONS = [1, 3, 7] as const

const PlanPage = () => {
   const { profile, onboardingCompleted } = useAuth()
   const planQuery = useMealPlan()
   const generate = useGenerateMealPlan()

   const [requestedDays, setRequestedDays] = useState<1 | 3 | 7>(7)
   const [blockedIds, setBlockedIds] = useState<string[]>([])
   const [selectedDayIdx, setSelectedDayIdx] = useState(0)
   const [loaderIdx, setLoaderIdx] = useState(0)
   const [shoppingOpen, setShoppingOpen] = useState(false)
   const [swapTarget, setSwapTarget] = useState<{
      dayIndex: number
      mealType: ItfMealType
      slot: 'protein' | 'carb' | 'fat' | 'vegetable'
   } | null>(null)

   /* Rotación de mensajes mientras carga (cada 2.5s). */
   useEffect(() => {
      if (!generate.isPending) return
      setLoaderIdx(0)
      const id = window.setInterval(
         () => setLoaderIdx((i) => (i + 1) % LOADER_MESSAGES.length),
         2500
      )
      return () => window.clearInterval(id)
   }, [generate.isPending])

   const plan = generate.data ?? planQuery.data ?? null

   const handleGenerate = () => {
      setSelectedDayIdx(0)
      generate.mutate({
         days: requestedDays,
         excluded_ingredient_ids: blockedIds
      })
   }

   /* === Lectura de la receta seleccionada del día actual === */
   const selectedDay: ItfDailySchedule | undefined = plan?.daily_schedule[selectedDayIdx]

   /* Bloqueo: nombres legibles a partir de las recetas. */
   const blockedLabels = useMemo(() => {
      if (!plan) return blockedIds.map((id) => ({ id, name: id }))
      const allIngredients = Object.values(plan.recipes_by_meal_type)
         .flat()
         .flatMap((r) => [
            r?.components.protein,
            r?.components.carb,
            r?.components.fat,
            r?.components.vegetable
         ])
      return blockedIds.map((id) => {
         const found = allIngredients.find((ing) => ing?.id === id)
         return { id, name: found?.name ?? id }
      })
   }, [blockedIds, plan])

   const handleBlock = (id: string | undefined, label: string) => {
      if (!id) return
      if (blockedIds.includes(id)) {
         toast(`${label} ya está bloqueado 🌿`)
         return
      }
      setBlockedIds((prev) => [...prev, id])
      toast.success(`${label} no aparecerá en próximos planes 🌱`)
   }

   const handleUnblock = (id: string) => {
      setBlockedIds((prev) => prev.filter((b) => b !== id))
   }

   /* === Estados de pantalla === */
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

   return (
      <AppShell userName={profile?.name ?? null}>
         <TitleUI
            title='Tu plan semanal 🥗'
            subtitle='Generamos todo de una. Las porciones de cada día están calculadas para cumplir tu objetivo calórico exacto.'
         />

         <div className='space-y-4'>
            {/* Generador */}
            <Card>
               <CardContent className='pt-6'>
                  <div className='space-y-3'>
                     <div>
                        <p className='mb-2 text-xs text-muted-foreground'>¿Cuántos días querés?</p>
                        <div className='grid grid-cols-3 gap-2'>
                           {DAYS_OPTIONS.map((d) => (
                              <button
                                 key={d}
                                 type='button'
                                 onClick={() => setRequestedDays(d)}
                                 aria-pressed={requestedDays === d}
                                 className={cn(
                                    'rounded-md border p-2 text-xs transition-colors',
                                    requestedDays === d
                                       ? 'border-primary bg-primary/10 text-primary'
                                       : 'border-border text-muted-foreground hover:bg-muted'
                                 )}
                              >
                                 {d === 1 ? '1 día' : d === 3 ? '3 días' : 'Semana (7)'}
                              </button>
                           ))}
                        </div>
                     </div>
                     <Button
                        onClick={handleGenerate}
                        disabled={generate.isPending}
                        className='w-full'
                     >
                        {generate.isPending ? (
                           <>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              {LOADER_MESSAGES[loaderIdx]}
                           </>
                        ) : plan ? (
                           <>
                              <RefreshCcw className='h-4 w-4' />
                              Regenerar plan
                           </>
                        ) : (
                           <>
                              <CalendarDays className='h-4 w-4' />
                              Generar mi plan
                           </>
                        )}
                     </Button>
                  </div>
               </CardContent>
            </Card>

            {/* Ingredientes bloqueados (siempre visible si hay) */}
            {blockedLabels.length > 0 ? (
               <Card>
                  <CardContent className='space-y-2 pt-6'>
                     <p className='text-xs font-medium text-muted-foreground'>
                        No te volveremos a mostrar
                     </p>
                     <div className='flex flex-wrap gap-2'>
                        {blockedLabels.map((b) => (
                           <button
                              key={b.id}
                              type='button'
                              onClick={() => handleUnblock(b.id)}
                              className='inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs hover:bg-muted/60'
                           >
                              {b.name}
                              <X className='h-3 w-3' />
                           </button>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            ) : null}

            {/* Empty state */}
            {!plan && !generate.isPending ? (
               <EmptyState
                  icon={ChefHat}
                  title='Sin plan aún'
                  description='Tocá "Generar mi plan" y armamos toda tu semana en una sola pasada.'
               />
            ) : null}

            {/* Plan generado */}
            {plan ? (
               <>
                  {plan.source === 'mixed' || plan.source === 'fallback' ? (
                     <Card className='border-secondary/40 bg-secondary/5'>
                        <CardContent className='pt-6 text-sm'>
                           {plan.source === 'fallback'
                              ? 'Tu plan salió con recetas simples por ahora 🌿. Mañana volveremos con más creatividad.'
                              : 'Algunas recetas salieron con plantilla 🌿. Las demás vienen frescas.'}
                        </CardContent>
                     </Card>
                  ) : null}

                  {/* Lista de compras */}
                  <Button
                     type='button'
                     variant='outline'
                     onClick={() => setShoppingOpen(true)}
                     className='w-full'
                  >
                     <ShoppingCart className='h-4 w-4' />
                     Ver lista de compras
                  </Button>

                  {/* Selector de día */}
                  <Card>
                     <CardHeader className='pb-3'>
                        <CardTitle className='text-base'>
                           Plan de {plan.days} {plan.days === 1 ? 'día' : 'días'}
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div
                           className={cn(
                              'grid gap-1',
                              plan.days <= 3 ? 'grid-cols-3' : 'grid-cols-7'
                           )}
                        >
                           {plan.daily_schedule.map((d, idx) => {
                              const active = selectedDayIdx === idx
                              return (
                                 <button
                                    key={d.day}
                                    type='button'
                                    onClick={() => setSelectedDayIdx(idx)}
                                    aria-pressed={active}
                                    className={cn(
                                       'flex flex-col items-center gap-0.5 rounded-md border p-2 text-[10px] transition-colors',
                                       active
                                          ? 'border-primary bg-primary/10 text-primary'
                                          : 'border-border text-muted-foreground hover:bg-muted'
                                    )}
                                 >
                                    <span className='font-semibold'>Día {d.day}</span>
                                    <span>{d.totalKcal} kcal</span>
                                 </button>
                              )
                           })}
                        </div>
                     </CardContent>
                  </Card>

                  {/* Day detail */}
                  {selectedDay ? (
                     <DayDetail
                        day={selectedDay}
                        plan={plan}
                        targetKcal={plan.target_kcal}
                        onBlock={handleBlock}
                        onSwap={(mealType, slot) =>
                           setSwapTarget({ dayIndex: selectedDayIdx, mealType, slot })
                        }
                     />
                  ) : null}
               </>
            ) : null}
         </div>

         {plan ? (
            <ShoppingListDialog
               plan={plan}
               open={shoppingOpen}
               onOpenChange={setShoppingOpen}
               familyMultiplier={(profile?.family_size as number | null) ?? 1}
            />
         ) : null}

         {plan && swapTarget
            ? (() => {
                 const assignment =
                    plan.daily_schedule[swapTarget.dayIndex]?.meals[swapTarget.mealType]
                 const recipe = assignment
                    ? plan.recipes_by_meal_type[swapTarget.mealType]?.[assignment.recipeIdx]
                    : undefined
                 if (!assignment || !recipe) return null
                 const ov = assignment.componentOverrides
                 const currentComp =
                    ov?.[swapTarget.slot] ?? recipe.components[swapTarget.slot] ?? null
                 if (!currentComp) return null
                 return (
                    <SwapIngredientDialog
                       open={true}
                       onOpenChange={(v) => {
                          if (!v) setSwapTarget(null)
                       }}
                       plan={plan}
                       dayIndex={swapTarget.dayIndex}
                       mealType={swapTarget.mealType}
                       slot={swapTarget.slot}
                       currentComponent={currentComp}
                       currentGrams={assignment.scaledGrams[swapTarget.slot]}
                       favoriteIds={(profile?.favorite_ingredient_ids as string[] | null) ?? []}
                    />
                 )
              })()
            : null}
      </AppShell>
   )
}

/* ============================================================
 *  Day Detail — muestra todas las comidas del día seleccionado.
 * ============================================================ */
interface DayDetailProps {
   day: ItfDailySchedule
   plan: NonNullable<ReturnType<typeof useMealPlan>['data']>
   targetKcal: number
   onBlock: (id: string | undefined, label: string) => void
   onSwap: (mealType: ItfMealType, slot: 'protein' | 'carb' | 'fat' | 'vegetable') => void
}

const DayDetail = ({ day, plan, targetKcal, onBlock, onSwap }: DayDetailProps) => {
   const mealEntries = Object.entries(day.meals) as Array<[ItfMealType, ItfMealAssignment]>
   const drift = Math.round(((day.totalKcal - targetKcal) / targetKcal) * 100)
   return (
      <div className='space-y-3'>
         {/* Resumen kcal del día */}
         <Card>
            <CardContent className='flex items-center justify-between pt-6 text-sm'>
               <div className='flex items-center gap-2'>
                  <Flame className='h-4 w-4 text-primary' />
                  <span className='font-medium'>{day.totalKcal} kcal</span>
                  <InfoTooltip topic='kcal' />
                  <span className='text-xs text-muted-foreground'>/ {targetKcal} objetivo</span>
               </div>
               <span
                  className={cn(
                     'text-xs',
                     Math.abs(drift) <= 1 ? 'text-primary' : 'text-secondary'
                  )}
               >
                  {drift === 0 ? 'exacto' : `${drift > 0 ? '+' : ''}${drift}%`}
               </span>
            </CardContent>
         </Card>

         {mealEntries.map(([mealType, assignment]) => {
            const recipe = plan.recipes_by_meal_type[mealType]?.[assignment.recipeIdx]
            if (!recipe) return null
            return (
               <MealCard
                  key={mealType}
                  mealType={mealType}
                  assignment={assignment}
                  recipe={recipe}
                  onBlock={onBlock}
                  onSwap={(slot) => onSwap(mealType, slot)}
               />
            )
         })}
      </div>
   )
}

/* ============================================================
 *  Meal Card — una comida del día con receta + porciones escaladas.
 * ============================================================ */
interface MealCardProps {
   mealType: ItfMealType
   assignment: ItfMealAssignment
   recipe: ItfRecipe
   onBlock: (id: string | undefined, label: string) => void
   onSwap: (slot: 'protein' | 'carb' | 'fat' | 'vegetable') => void
}

const MealCard = ({ mealType, assignment, recipe, onBlock, onSwap }: MealCardProps) => {
   const meta = MEAL_TYPE_CATALOG[mealType]
   const Icon = meta.icon
   const [expanded, setExpanded] = useState(false)
   const c = recipe.components
   /* Aplicar overrides del usuario para ESTE día específico. */
   const ov = assignment.componentOverrides
   const proteinComp = ov?.protein ?? c.protein
   const carbComp = ov?.carb ?? c.carb
   const fatComp = ov?.fat ?? c.fat
   const vegComp = ov?.vegetable ?? c.vegetable
   return (
      <Card>
         <CardHeader className='pb-2'>
            <CardTitle className='flex items-center justify-between text-base'>
               <span className='flex items-center gap-2'>
                  <Icon className='h-4 w-4 text-primary' />
                  {meta.label}
               </span>
               <span className='text-xs font-normal text-muted-foreground'>
                  {assignment.scaledKcal} kcal
               </span>
            </CardTitle>
         </CardHeader>
         <CardContent className='space-y-2 text-sm'>
            <div>
               <p className='font-medium'>{recipe.name}</p>
               <p className='text-xs text-muted-foreground'>{recipe.description}</p>
            </div>
            <div className='flex items-center gap-3 text-xs text-muted-foreground'>
               <span className='inline-flex items-center gap-1'>
                  <Clock className='h-3 w-3' />
                  {recipe.prep_time_min} min
               </span>
               <span className='capitalize'>{recipe.difficulty}</span>
            </div>

            <button
               type='button'
               onClick={() => setExpanded((v) => !v)}
               className='text-xs text-primary underline-offset-4 hover:underline'
            >
               {expanded ? 'Ocultar receta' : 'Ver receta'}
            </button>

            {expanded ? (
               <div className='space-y-3'>
                  <Separator />
                  <div className='space-y-1.5'>
                     <p className='text-xs font-medium text-muted-foreground'>Ingredientes</p>
                     <IngredientRow
                        name={proteinComp.name}
                        grams={assignment.scaledGrams.protein}
                        onBlock={() => onBlock(proteinComp.id, proteinComp.name)}
                        onSwap={() => onSwap('protein')}
                     />
                     <IngredientRow
                        name={carbComp.name}
                        grams={assignment.scaledGrams.carb}
                        onBlock={() => onBlock(carbComp.id, carbComp.name)}
                        onSwap={() => onSwap('carb')}
                     />
                     {assignment.scaledGrams.fat > 0 ? (
                        <IngredientRow
                           name={fatComp.name}
                           grams={assignment.scaledGrams.fat}
                           onBlock={() => onBlock(fatComp.id, fatComp.name)}
                           onSwap={() => onSwap('fat')}
                        />
                     ) : null}
                     {vegComp && assignment.scaledGrams.vegetable > 0 ? (
                        <IngredientRow
                           name={vegComp.name}
                           grams={assignment.scaledGrams.vegetable}
                           onBlock={() => onBlock(vegComp.id, vegComp.name)}
                           onSwap={() => onSwap('vegetable')}
                        />
                     ) : null}
                  </div>
                  <Separator />
                  <div className='space-y-1.5'>
                     <p className='text-xs font-medium text-muted-foreground'>Preparación</p>
                     <ol className='list-decimal space-y-1 pl-5 text-xs'>
                        {recipe.steps.map((s, i) => (
                           <li key={i}>{s}</li>
                        ))}
                     </ol>
                  </div>
               </div>
            ) : null}
         </CardContent>
      </Card>
   )
}

const IngredientRow = ({
   name,
   grams,
   onBlock,
   onSwap
}: {
   name: string
   grams: number
   onBlock: () => void
   onSwap: () => void
}) => (
   <div className='flex items-center justify-between text-xs'>
      <span className='capitalize'>
         {name} <span className='text-muted-foreground'>· {grams}g</span>
      </span>
      <div className='flex items-center gap-1'>
         <button
            type='button'
            onClick={onSwap}
            className='rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
            title='Cambiar por otro ingrediente (solo este día)'
            aria-label='Cambiar ingrediente'
         >
            <Repeat className='h-3.5 w-3.5' />
         </button>
         <button
            type='button'
            onClick={onBlock}
            className='rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
            title='No volver a mostrar este ingrediente'
            aria-label='Bloquear ingrediente'
         >
            <Ban className='h-3.5 w-3.5' />
         </button>
      </div>
   </div>
)

export default PlanPage
