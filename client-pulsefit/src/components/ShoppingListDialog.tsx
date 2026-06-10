import { useMemo, useState } from 'react'
import { Copy, Share2, Users, Check } from 'lucide-react'
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { buildShoppingList, shoppingListToPlainText } from '@/features/meal-generator'
import type { ItfMealPlan } from '@/interface/itfMeals'
import { cn } from '@/utils'
import { toast } from 'sonner'

interface ShoppingListDialogProps {
   plan: ItfMealPlan
   open: boolean
   onOpenChange: (v: boolean) => void
   /** Multiplicador familiar persistido. Default 1. */
   familyMultiplier?: number
}

/** Familia presets (también disponible desde el setting del perfil). */
const FAMILY_OPTIONS = [1, 2, 3, 4] as const

export const ShoppingListDialog = ({
   plan,
   open,
   onOpenChange,
   familyMultiplier = 1
}: ShoppingListDialogProps) => {
   const [localFamily, setLocalFamily] = useState(familyMultiplier)
   /* Set de items marcados como "ya tengo en casa" — no persiste, solo UI. */
   const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

   const list = useMemo(
      () => buildShoppingList({ plan, familyMultiplier: localFamily }),
      [plan, localFamily]
   )

   const toggleChecked = (id: string) => {
      setCheckedIds((prev) => {
         const next = new Set(prev)
         if (next.has(id)) next.delete(id)
         else next.add(id)
         return next
      })
   }

   const handleCopy = async () => {
      const text = shoppingListToPlainText(list)
      try {
         await navigator.clipboard.writeText(text)
         toast.success('Lista copiada — pegala en WhatsApp 📋')
      } catch {
         toast.error('No pudimos copiar. Probá compartir directo 🌿')
      }
   }

   const handleShare = async () => {
      const text = shoppingListToPlainText(list)
      if (typeof navigator.share === 'function') {
         try {
            await navigator.share({
               title: 'Mi lista de compras PulseFit',
               text
            })
            return
         } catch {
            /* User canceled o no compatible — caemos al copy */
         }
      }
      handleCopy()
   }

   const checkedCount = checkedIds.size

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-md'>
            <DialogHeader>
               <DialogTitle>🛒 Tu lista de compras</DialogTitle>
               <DialogDescription>
                  {list.itemCount} ingredientes para {list.days} {list.days === 1 ? 'día' : 'días'}
                  {localFamily > 1 ? ` × ${localFamily} personas` : ''}.
                  {checkedCount > 0 ? ` Ya tenés ${checkedCount} en casa.` : ''}
               </DialogDescription>
            </DialogHeader>

            {/* Selector familia */}
            <div className='space-y-2'>
               <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <Users className='h-3 w-3' />
                  <span>¿Para cuántas personas cocinas?</span>
               </div>
               <div className='grid grid-cols-4 gap-2'>
                  {FAMILY_OPTIONS.map((n) => (
                     <button
                        key={n}
                        type='button'
                        onClick={() => setLocalFamily(n)}
                        aria-pressed={localFamily === n}
                        className={cn(
                           'rounded-md border p-2 text-xs transition-colors',
                           localFamily === n
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted'
                        )}
                     >
                        {n === 1 ? 'Solo yo' : `${n} 👥`}
                     </button>
                  ))}
               </div>
            </div>

            <Separator />

            {/* Lista agrupada por sección */}
            <div className='space-y-4'>
               {list.bySection.map((group) => (
                  <div key={group.section}>
                     <p className='mb-2 text-xs font-medium text-foreground'>{group.label}</p>
                     <ul className='space-y-1'>
                        {group.items.map((item) => {
                           const checked = checkedIds.has(item.ingredientId)
                           return (
                              <li
                                 key={item.ingredientId}
                                 onClick={() => toggleChecked(item.ingredientId)}
                                 className={cn(
                                    'flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted/60',
                                    checked && 'text-muted-foreground line-through'
                                 )}
                              >
                                 <div
                                    className={cn(
                                       'mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border',
                                       checked
                                          ? 'border-primary bg-primary text-primary-foreground'
                                          : 'border-muted-foreground/40'
                                    )}
                                 >
                                    {checked ? <Check className='h-2.5 w-2.5' /> : null}
                                 </div>
                                 <div className='flex-1'>
                                    <span className='capitalize'>{item.name}</span>
                                    <span className='ml-1 text-muted-foreground'>
                                       — {item.humanQuantity}
                                    </span>
                                 </div>
                              </li>
                           )
                        })}
                     </ul>
                  </div>
               ))}
            </div>

            <Separator />

            {/* Acciones */}
            <div className='grid grid-cols-2 gap-2'>
               <Button type='button' variant='outline' size='sm' onClick={handleCopy}>
                  <Copy className='h-3.5 w-3.5' />
                  Copiar
               </Button>
               <Button type='button' size='sm' onClick={handleShare}>
                  <Share2 className='h-3.5 w-3.5' />
                  Compartir
               </Button>
            </div>
            <p className='text-center text-[10px] text-muted-foreground'>
               Tip: tocá cada item para marcarlo como ya tengo en casa 🌿
            </p>
         </DialogContent>
      </Dialog>
   )
}
