import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CUISINE_OPTIONS, FAVORITE_INGREDIENT_SUGGESTIONS } from '@/config'
import { useAuth } from '@/hooks/useAuth'
import { useErrorHandling } from '@/hooks/useErrorHandling'
import { cn } from '@/utils'
import { toast } from 'sonner'

/**
 * Editor de gustos personales que aparece en la página Perfil. Permite
 * a usuarios que ya pasaron el onboarding actualizar sus cocinas e
 * ingredientes favoritos sin tener que rehacer el cuestionario completo.
 *
 * El motor de generación los lee en cada plan nuevo y prioriza recetas
 * de esas cocinas + boost a esos ingredientes en el selector.
 */
export const FavoritesEditor = () => {
   const { profile, updateProfile } = useAuth()
   const { handleApiError } = useErrorHandling()

   const initialCuisines = (profile?.favorite_cuisines as string[] | null) ?? []
   const initialIngredients = (profile?.favorite_ingredient_ids as string[] | null) ?? []

   const [cuisines, setCuisines] = useState<string[]>(initialCuisines)
   const [ingredients, setIngredients] = useState<string[]>(initialIngredients)
   const [saving, setSaving] = useState(false)
   const [dirty, setDirty] = useState(false)

   /* Resync cuando llega el profile (puede tardar tras el primer render). */
   useEffect(() => {
      setCuisines((profile?.favorite_cuisines as string[] | null) ?? [])
      setIngredients((profile?.favorite_ingredient_ids as string[] | null) ?? [])
      setDirty(false)
   }, [profile?.favorite_cuisines, profile?.favorite_ingredient_ids])

   const toggleCuisine = (value: string) => {
      setCuisines((prev) =>
         prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
      )
      setDirty(true)
   }

   const toggleIngredient = (id: string) => {
      setIngredients((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
      setDirty(true)
   }

   const handleSave = async () => {
      if (saving) return
      setSaving(true)
      try {
         await updateProfile({
            favorite_cuisines: cuisines,
            favorite_ingredient_ids: ingredients
         })
         toast.success('Tus gustos quedaron guardados 🌱')
         setDirty(false)
      } catch (e) {
         handleApiError(e)
      } finally {
         setSaving(false)
      }
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
               <Heart className='h-4 w-4 text-primary' />
               Mis gustos
            </CardTitle>
         </CardHeader>
         <CardContent className='space-y-5 text-sm'>
            {/* Cocinas favoritas */}
            <div className='space-y-2'>
               <p className='text-xs font-medium text-muted-foreground'>Cocinas que te gustan</p>
               <div className='grid grid-cols-2 gap-2'>
                  {CUISINE_OPTIONS.map((opt) => (
                     <button
                        key={opt.value}
                        type='button'
                        onClick={() => toggleCuisine(opt.value)}
                        aria-pressed={cuisines.includes(opt.value)}
                        className={cn(
                           'rounded-md border p-2 text-left text-xs transition-colors',
                           cuisines.includes(opt.value)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted'
                        )}
                     >
                        <p className='font-medium'>
                           {opt.emoji} {opt.label}
                        </p>
                     </button>
                  ))}
               </div>
            </div>

            {/* Ingredientes favoritos */}
            <div className='space-y-2'>
               <p className='text-xs font-medium text-muted-foreground'>
                  Ingredientes que te encantan
               </p>
               <p className='text-[10px] text-muted-foreground'>
                  Los priorizaremos en tus planes nuevos.
               </p>
               <div className='flex flex-wrap gap-1.5'>
                  {FAVORITE_INGREDIENT_SUGGESTIONS.map((ing) => {
                     const isSelected = ingredients.includes(ing.id)
                     return (
                        <button
                           key={ing.id}
                           type='button'
                           onClick={() => toggleIngredient(ing.id)}
                           aria-pressed={isSelected}
                           className={cn(
                              'rounded-full border px-3 py-1 text-xs transition-colors',
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
            </div>

            {/* Resumen + guardar */}
            <div className='flex items-center justify-between gap-2 border-t border-border pt-3'>
               <p className='text-xs text-muted-foreground'>
                  {cuisines.length} {cuisines.length === 1 ? 'cocina' : 'cocinas'} ·{' '}
                  {ingredients.length} {ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}
               </p>
               <Button size='sm' onClick={handleSave} disabled={!dirty || saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
               </Button>
            </div>
         </CardContent>
      </Card>
   )
}
