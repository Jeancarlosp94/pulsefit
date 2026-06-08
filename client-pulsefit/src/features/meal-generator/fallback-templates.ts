import type { ItfMealComponents, ItfMealType, ItfPlateOption } from './types'

/**
 * Plantillas de fallback usadas cuando la IA falla 2 veces.
 *
 * Características obligatorias (de generadores-hibridos.md sección 8):
 *   - 3 plantillas distintas (bowl, plato dividido, salteado).
 *   - Pasos genéricos pero coherentes y compasivos.
 *   - Sin promesas estéticas ni consejos médicos.
 *   - Funciona con CUALQUIER combinación de componentes.
 *
 * La app NUNCA queda sin plan: si esta función recibe un input válido,
 * SIEMPRE devuelve 3 opciones.
 */

const MEAL_LABEL: Record<ItfMealType, string> = {
   breakfast: 'el desayuno',
   lunch: 'el almuerzo',
   dinner: 'la cena',
   snack_am: 'la media mañana',
   snack_pm: 'la media tarde'
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

const ingredientName = (s: { ingredient: { name: string }; grams: number }) =>
   `${s.grams}g de ${s.ingredient.name}`

export const buildMealFallback = (
   components: ItfMealComponents,
   mealType: ItfMealType
): ItfPlateOption[] => {
   const { protein, carb, fat, vegetable } = components
   /* fat se usa via ingredientName(fat) en los pasos pero no como nombre suelto. */
   void fat
   const hasVeg = vegetable.grams > 0
   const proteinName = protein.ingredient.name
   const carbName = carb.ingredient.name
   const vegName = hasVeg ? vegetable.ingredient.name : ''

   const bowl: ItfPlateOption = {
      name: `Bowl de ${proteinName} con ${carbName}${hasVeg ? ` y ${vegName}` : ''}`,
      description: `Plato simple y balanceado, ideal para ${MEAL_LABEL[mealType]}.`,
      prep_time_min: 20,
      difficulty: 'easy',
      steps: [
         `Cocina ${ingredientName(carb)} hasta su punto deseado, con un toque de sal.`,
         `Sazona ${ingredientName(protein)} con sal, pimienta y ajo al gusto.`,
         `Cocina ${proteinName} a la plancha con ${ingredientName(fat)} 5 a 7 minutos.`,
         hasVeg
            ? `Saltea o cuece al vapor ${ingredientName(vegetable)} hasta que esté brillante.`
            : `Prepara unas hierbas frescas y limón para decorar.`,
         `Sirve todo junto en un bowl, decora con limón o hierbas frescas y disfruta.`
      ]
   }

   const classic: ItfPlateOption = {
      name: `${cap(proteinName)} al ajillo con ${carbName}${hasVeg ? ` y ${vegName}` : ''}`,
      description: `Versión clásica casera, ideal cuando quieres algo familiar.`,
      prep_time_min: 25,
      difficulty: 'easy',
      steps: [
         `Pica un par de dientes de ajo finos y déjalos listos.`,
         `Cocina ${ingredientName(carb)} con sal hasta su punto.`,
         `Calienta ${ingredientName(fat)} en sartén y dora el ajo unos segundos.`,
         `Suma ${ingredientName(protein)} y cocina a fuego medio, dándole vuelta cada par de minutos.`,
         hasVeg
            ? `Agrega ${ingredientName(vegetable)} en los últimos 4 minutos para que quede crujiente.`
            : `Termina con pimienta y unas gotas de limón.`,
         `Sirve caliente, en un plato dividido, con un toque de limón al final.`
      ]
   }

   const stirfry: ItfPlateOption = {
      name: `Salteado de ${proteinName}${hasVeg ? ` con ${vegName}` : ''} y ${carbName}`,
      description: `Estilo wok rápido, todo en una sartén.`,
      prep_time_min: 15,
      difficulty: 'easy',
      steps: [
         `Cocina ${ingredientName(carb)} aparte y reserva.`,
         `Corta ${proteinName} en cubos pequeños para que cocine rápido.`,
         `Calienta ${ingredientName(fat)} en sartén bien caliente y dora el ${proteinName}.`,
         hasVeg
            ? `Suma ${ingredientName(vegetable)} y saltea 2 a 3 minutos manteniendo el color vivo.`
            : `Agrega ajo y sazón al gusto, salteando todo junto.`,
         `Incorpora ${carbName} cocido, mezcla con sal, pimienta y unas gotas de limón.`,
         `Sirve caliente, agrega hierbas frescas si tienes a mano.`
      ]
   }

   return [bowl, classic, stirfry]
}
