import { useMemo } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import {
   findIngredientAlternatives,
   rescaleGrams,
   SEED_INGREDIENTS,
   type ItfMealType
} from '@/features/meal-generator'
import { useSwapIngredient } from '@/hooks/useMealPlan'
import type { ItfMealPlan, ItfMealComponentSummary } from '@/interface/itfMeals'
import { cn } from '@/utils'

interface SwapIngredientDialogProps {
   open: boolean
   onOpenChange: (v: boolean) => void
   plan: ItfMealPlan
   dayIndex: number
   mealType: ItfMealType
   slot: 'protein' | 'carb' | 'fat' | 'vegetable'
   /** Componente actual mostrado (después de aplicar override si existe). */
   currentComponent: ItfMealComponentSummary
   currentGrams: number
   /** Favoritos del perfil para priorizar. */
   favoriteIds?: string[]
}

const SLOT_LABELS: Record<'protein' | 'carb' | 'fat' | 'vegetable', string> = {
   protein: 'Proteína',
   carb: 'Carbohidrato',
   fat: 'Grasa',
   vegetable: 'Vegetal'
}

export const SwapIngredientDialog = ({
   open,
   onOpenChange,
   plan,
   dayIndex,
   mealType,
   slot,
   currentComponent,
   currentGrams,
   favoriteIds = []
}: SwapIngredientDialogProps) => {
   const swap = useSwapIngredient()

   const currentSeed = useMemo(
      () => SEED_INGREDIENTS.find((i) => i.id === currentComponent.id),
      [currentComponent.id]
   )

   const alternatives = useMemo(
      () =>
         findIngredientAlternatives({
            currentIngredientId: currentComponent.id ?? '',
            category: slot,
            mealType,
            excludedIds: plan.excluded_ingredient_ids,
            favoriteIds,
            limit: 6
         }),
      [currentComponent.id, slot, mealType, plan.excluded_ingredient_ids, favoriteIds]
   )

   const handlePick = (alternativeId: string) => {
      const newSeed = SEED_INGREDIENTS.find((i) => i.id === alternativeId)
      if (!newSeed || !currentSeed) return

      const newGrams = rescaleGrams(currentSeed, newSeed, currentGrams)
      swap.mutate(
         {
            plan,
            dayIndex,
            mealType,
            slot,
            newComponent: { id: newSeed.id, name: newSeed.name, grams: newGrams },
            newGrams
         },
         {
            onSuccess: () => {
               onOpenChange(false)
            }
         }
      )
   }

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className='sm:max-w-md'>
            <DialogHeader>
               <DialogTitle>Cambiar {SLOT_LABELS[slot].toLowerCase()}</DialogTitle>
               <DialogDescription>
                  Solo cambiamos este día (día {dayIndex + 1}). El resto de tu plan queda igual.
               </DialogDescription>
            </DialogHeader>

            <div className='space-y-1 rounded-md border border-border bg-muted/30 p-3 text-xs'>
               <p className='text-muted-foreground'>Actual</p>
               <p className='font-medium capitalize'>{currentComponent.name}</p>
               <p className='text-muted-foreground'>{currentGrams}g</p>
            </div>

            <div className='space-y-2'>
               <p className='text-xs font-medium text-muted-foreground'>
                  Tocá una opción para reemplazar
               </p>
               <div className='space-y-1'>
                  {alternatives.length === 0 ? (
                     <p className='py-4 text-center text-xs text-muted-foreground'>
                        No tenemos alternativas para esta categoría 🌿
                     </p>
                  ) : (
                     alternatives.map((alt) => {
                        const newGrams = currentSeed
                           ? rescaleGrams(currentSeed, alt, currentGrams)
                           : 100
                        const isFav = favoriteIds.includes(alt.id)
                        return (
                           <button
                              key={alt.id}
                              type='button'
                              disabled={swap.isPending}
                              onClick={() => handlePick(alt.id)}
                              className={cn(
                                 'flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background p-3 text-left text-xs transition-colors hover:bg-muted disabled:opacity-50',
                                 isFav && 'border-primary/40'
                              )}
                           >
                              <div className='flex-1'>
                                 <p className='font-medium capitalize'>
                                    {alt.name}
                                    {isFav ? ' ⭐' : ''}
                                 </p>
                                 <p className='text-muted-foreground'>
                                    ~{newGrams}g · {Math.round((alt.kcalPer100g * newGrams) / 100)}{' '}
                                    kcal
                                 </p>
                              </div>
                              <ArrowRight className='h-3 w-3 shrink-0 text-muted-foreground' />
                           </button>
                        )
                     })
                  )}
               </div>
            </div>

            {swap.isPending ? (
               <div className='flex items-center justify-center gap-2 text-xs text-muted-foreground'>
                  <Loader2 className='h-3 w-3 animate-spin' />
                  Guardando…
               </div>
            ) : null}
         </DialogContent>
      </Dialog>
   )
}
