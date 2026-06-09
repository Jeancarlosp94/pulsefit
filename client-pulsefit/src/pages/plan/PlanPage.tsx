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
   AlertCircle,
   Cookie,
   X,
   RefreshCcw,
   Ban
} from 'lucide-react'
import { AppShell } from '@/layout'
import { TitleUI } from '@/components/TitleUI'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useGenerateMeal } from '@/hooks/useGenerateMeal'
import {
   getActiveMealTypes,
   type ItfMealType,
   type ItfMealsPerDay
} from '@/features/meal-generator'
import type { ItfMealComponentSummary, ItfPlateOptionWithComponents } from '@/interface/itfMeals'
import { cn } from '@/utils'
import { toast } from 'sonner'

interface MealTypeOption {
   value: ItfMealType
   label: string
   icon: React.ComponentType<{ className?: string }>
}

const MEAL_TYPE_CATALOG: Record<ItfMealType, MealTypeOption> = {
   breakfast: { value: 'breakfast', label: 'Desayuno', icon: Coffee },
   snack_am: { value: 'snack_am', label: 'Media mañana', icon: Sparkles },
   lunch: { value: 'lunch', label: 'Almuerzo', icon: Salad },
   snack_pm: { value: 'snack_pm', label: 'Media tarde', icon: Cookie },
   dinner: { value: 'dinner', label: 'Cena', icon: Moon }
}

const LOADER_MESSAGES = [
   'Preparando opciones…',
   'Combinando ingredientes…',
   'Buscando lo mejor para tu día…',
   'Casi listo…'
]

const PlanPage = () => {
   const { profile, onboardingCompleted } = useAuth()
   const mealsPerDay = (profile?.meals_per_day as ItfMealsPerDay | null) ?? 3
   const activeMealTypes = useMemo(() => getActiveMealTypes(mealsPerDay), [mealsPerDay])
   const [mealType, setMealType] = useState<ItfMealType>(activeMealTypes[0] ?? 'lunch')
   const [selected, setSelected] = useState<number>(0)
   /* Ingredientes bloqueados en esta sesión (no persisten en perfil). */
   const [blockedIds, setBlockedIds] = useState<string[]>([])
   const [loaderIdx, setLoaderIdx] = useState(0)
   const mutation = useGenerateMeal()

   /* Rotación de mensajes mientras carga (cada 2.5s). */
   useEffect(() => {
      if (!mutation.isPending) return
      setLoaderIdx(0)
      const id = window.setInterval(
         () => setLoaderIdx((i) => (i + 1) % LOADER_MESSAGES.length),
         2500
      )
      return () => window.clearInterval(id)
   }, [mutation.isPending])

   /* Si cambia el meal_type, resetear las opciones (no las bloqueadas). */
   useEffect(() => {
      setSelected(0)
   }, [mealType])

   const handleGenerate = () => {
      setSelected(0)
      mutation.mutate({
         meal_type: mealType,
         excluded_ingredient_ids: blockedIds
      })
   }

   const handleBlockIngredient = (ing: ItfMealComponentSummary | null, label: string) => {
      if (!ing?.id) return
      if (blockedIds.includes(ing.id)) {
         toast(`${label} ya está bloqueado 🌿`)
         return
      }
      setBlockedIds((prev) => [...prev, ing.id!])
      toast.success(`${label} bloqueado para próximas generaciones 🌱`)
   }

   const handleUnblock = (id: string) => {
      setBlockedIds((prev) => prev.filter((b) => b !== id))
   }

   const data = mutation.data
   const options: ItfPlateOptionWithComponents[] = useMemo(() => data?.options ?? [], [data])
   const selectedOption: ItfPlateOptionWithComponents | undefined = options[selected]
   const selectedComponents = selectedOption?.components

   /* Drift de la opción seleccionada vs target. */
   const drift =
      data && selectedComponents
         ? Math.round(
              ((selectedComponents.actualMacros.kcal - data.target.kcal) / data.target.kcal) * 100
           )
         : 0
   const driftSign = drift >= 0 ? '+' : ''

   /* Nombres legibles de los ingredientes bloqueados (a partir de las opciones
    * generadas hasta ahora — fallback al id si no encontramos el nombre). */
   const blockedLabels = useMemo(() => {
      const allIngredients = options.flatMap((o) => [
         o.components.protein,
         o.components.carb,
         o.components.fat,
         o.components.vegetable
      ])
      return blockedIds.map((id) => {
         const found = allIngredients.find((ing) => ing?.id === id)
         return { id, name: found?.name ?? id }
      })
   }, [blockedIds, options])

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
            title='Tu plan'
            subtitle={`Distribuido en ${mealsPerDay} comidas al día. Elegí una y armamos 3 opciones distintas.`}
         />

         <div className='space-y-4'>
            {/* Selector de meal_type */}
            <Card>
               <CardContent className='pt-6'>
                  <div
                     className={cn(
                        'grid gap-2',
                        activeMealTypes.length === 2 && 'grid-cols-2',
                        activeMealTypes.length === 3 && 'grid-cols-3',
                        activeMealTypes.length === 4 && 'grid-cols-4',
                        activeMealTypes.length === 5 && 'grid-cols-5'
                     )}
                  >
                     {activeMealTypes.map((mt) => {
                        const opt = MEAL_TYPE_CATALOG[mt]
                        const Icon = opt.icon
                        const active = mealType === mt
                        return (
                           <button
                              key={mt}
                              type='button'
                              onClick={() => setMealType(mt)}
                              aria-pressed={active}
                              className={cn(
                                 'flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                 active
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground hover:bg-muted'
                              )}
                           >
                              <Icon className='h-5 w-5' />
                              <span className='text-center leading-tight'>{opt.label}</span>
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
                           {LOADER_MESSAGES[loaderIdx]}
                        </>
                     ) : data ? (
                        <>
                           <RefreshCcw className='h-4 w-4' />
                           Regenerar opciones
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

            {/* Bloqueados */}
            {blockedLabels.length > 0 ? (
               <Card className='border-secondary/30'>
                  <CardContent className='space-y-2 pt-4 text-sm'>
                     <p className='text-xs text-muted-foreground'>
                        Bloqueados en esta sesión (no aparecerán al regenerar):
                     </p>
                     <div className='flex flex-wrap gap-1.5'>
                        {blockedLabels.map((b) => (
                           <button
                              key={b.id}
                              type='button'
                              onClick={() => handleUnblock(b.id)}
                              className='inline-flex items-center gap-1 rounded-full border border-secondary/40 bg-secondary/10 px-2 py-0.5 text-xs text-secondary-foreground hover:bg-secondary/20'
                              aria-label={`Desbloquear ${b.name}`}
                           >
                              {b.name}
                              <X className='h-3 w-3' />
                           </button>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            ) : null}

            {/* Sin data y sin loading */}
            {!data && !mutation.isPending ? (
               <EmptyState
                  icon={ChefHat}
                  title='Aún no generamos nada'
                  description='Elegí una comida arriba y dale a "Generar 3 opciones".'
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
                  ) : data.source === 'mixed' ? (
                     <Card className='border-secondary/40 bg-secondary/5'>
                        <CardContent className='flex items-start gap-3 pt-6 text-xs text-muted-foreground'>
                           <AlertCircle
                              className='mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary'
                              aria-hidden='true'
                           />
                           <p>
                              Una opción salió con plantilla (la IA no quiso colaborar para esa).
                           </p>
                        </CardContent>
                     </Card>
                  ) : null}

                  {/* Tabs de opciones (cada una con SU set de ingredientes) */}
                  <div
                     role='tablist'
                     aria-label='Opciones generadas'
                     className='grid grid-cols-3 gap-2'
                  >
                     {options.map((opt, idx) => (
                        <button
                           key={idx}
                           type='button'
                           role='tab'
                           aria-selected={selected === idx}
                           onClick={() => setSelected(idx)}
                           className={cn(
                              'rounded-md border px-2 py-1.5 text-left transition-colors',
                              selected === idx
                                 ? 'border-primary bg-primary text-primary-foreground'
                                 : 'border-border text-muted-foreground hover:bg-muted'
                           )}
                        >
                           <p className='text-[10px] uppercase tracking-wider'>Opción {idx + 1}</p>
                           <p className='line-clamp-2 text-xs font-medium'>
                              {opt.components?.protein?.name ?? 'Opción'}
                              {opt.components?.carb?.name ? ` · ${opt.components.carb.name}` : ''}
                           </p>
                        </button>
                     ))}
                  </div>

                  {/* Macros target + actual de la opción seleccionada (defensivo). */}
                  {selectedOption && selectedComponents?.actualMacros ? (
                     <Card>
                        <CardHeader className='pb-3'>
                           <CardTitle className='flex items-center justify-between text-base'>
                              <span>Esta opción aporta</span>
                              <span
                                 className={cn(
                                    'text-xs font-normal',
                                    Math.abs(drift) <= 15 ? 'text-primary' : 'text-secondary'
                                 )}
                              >
                                 {driftSign}
                                 {drift}% vs target
                              </span>
                           </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-3 text-sm'>
                           <div className='grid grid-cols-4 gap-2 text-center'>
                              <div>
                                 <p className='text-xs text-muted-foreground'>Kcal</p>
                                 <p className='font-medium text-foreground'>
                                    {selectedComponents.actualMacros.kcal}
                                 </p>
                                 <p className='text-[10px] text-muted-foreground'>
                                    / {data.target.kcal}
                                 </p>
                              </div>
                              <div>
                                 <p className='text-xs text-muted-foreground'>Prot</p>
                                 <p className='font-medium text-foreground'>
                                    {selectedComponents.actualMacros.proteinG}g
                                 </p>
                                 <p className='text-[10px] text-muted-foreground'>
                                    / {data.target.proteinG}g
                                 </p>
                              </div>
                              <div>
                                 <p className='text-xs text-muted-foreground'>Carbs</p>
                                 <p className='font-medium text-foreground'>
                                    {selectedComponents.actualMacros.carbsG}g
                                 </p>
                                 <p className='text-[10px] text-muted-foreground'>
                                    / {data.target.carbsG}g
                                 </p>
                              </div>
                              <div>
                                 <p className='text-xs text-muted-foreground'>Gras</p>
                                 <p className='font-medium text-foreground'>
                                    {selectedComponents.actualMacros.fatsG}g
                                 </p>
                                 <p className='text-[10px] text-muted-foreground'>
                                    / {data.target.fatsG}g
                                 </p>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  ) : null}

                  {/* Opción seleccionada */}
                  {selectedOption && selectedComponents ? (
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
                                 {selectedComponents.actualMacros.kcal} kcal
                              </span>
                              <span className='capitalize'>{selectedOption.difficulty}</span>
                           </div>
                           <Separator />
                           <div>
                              <h3 className='mb-2 font-medium text-foreground'>
                                 Ingredientes
                                 <span className='ml-2 text-xs font-normal text-muted-foreground'>
                                    (tap el ✕ para no volver a verlo)
                                 </span>
                              </h3>
                              <ul className='space-y-1.5 text-sm text-muted-foreground'>
                                 <IngredientRow
                                    summary={selectedComponents.protein}
                                    label='Proteína'
                                    onBlock={() =>
                                       handleBlockIngredient(
                                          selectedComponents.protein,
                                          selectedComponents.protein.name
                                       )
                                    }
                                 />
                                 <IngredientRow
                                    summary={selectedComponents.carb}
                                    label='Carbo'
                                    onBlock={() =>
                                       handleBlockIngredient(
                                          selectedComponents.carb,
                                          selectedComponents.carb.name
                                       )
                                    }
                                 />
                                 <IngredientRow
                                    summary={selectedComponents.fat}
                                    label='Grasa'
                                    onBlock={() =>
                                       handleBlockIngredient(
                                          selectedComponents.fat,
                                          selectedComponents.fat.name
                                       )
                                    }
                                 />
                                 {selectedComponents.vegetable ? (
                                    <IngredientRow
                                       summary={selectedComponents.vegetable}
                                       label='Vegetal'
                                       onBlock={() =>
                                          handleBlockIngredient(
                                             selectedComponents.vegetable,
                                             selectedComponents.vegetable!.name
                                          )
                                       }
                                    />
                                 ) : null}
                                 <li className='pl-1 text-xs italic text-muted-foreground/80'>
                                    + ajo, sal, pimienta, limón, hierbas (libre uso)
                                 </li>
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

/** Fila de ingrediente con botón "no me gusta" / bloquear. */
const IngredientRow = ({
   summary,
   label,
   onBlock
}: {
   summary: ItfMealComponentSummary
   label: string
   onBlock: () => void
}) => (
   <li className='flex items-center justify-between gap-2 rounded-md border border-border/40 bg-card/40 px-2 py-1.5'>
      <div className='flex-1 min-w-0'>
         <p className='text-[10px] uppercase tracking-wider text-muted-foreground'>{label}</p>
         <p className='text-sm text-foreground'>
            <span className='font-medium'>{summary.grams}g</span> de {summary.name}
         </p>
      </div>
      <button
         type='button'
         onClick={onBlock}
         className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary/20 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
         aria-label={`Bloquear ${summary.name}`}
         title='No quiero ver este ingrediente'
      >
         <Ban className='h-3.5 w-3.5' />
      </button>
   </li>
)

export default PlanPage
