import { SEED_INGREDIENTS } from './seed-ingredients'
import { formatQuantity, SHOPPING_UNITS } from './shopping-units'
import type { ItfMealPlan } from '@/interface/itfMeals'
import type { ItfMealType } from './types'

/** Sección del supermercado (ordenadas por recorrido típico LATAM). */
export type ItfShoppingSection =
   | 'carniceria' /* carnes + pescados + huevos + embutidos magros */
   | 'lacteos' /* yogurt, quesos, mantequilla */
   | 'legumbres' /* enlatados de lentejas, garbanzos, frijoles */
   | 'verduras' /* todas las verduras + ajos + cebollas */
   | 'frutas'
   | 'abarrotes' /* arroz, pasta, avena, harinas, pan, aceites, condimentos secos */

export interface ItfShoppingItem {
   ingredientId: string
   name: string
   section: ItfShoppingSection
   totalGrams: number
   /** Cantidad humana: "3 pechugas (~600g)", "1 kg", etc. */
   humanQuantity: string
}

export interface ItfShoppingList {
   /** Total de items distintos. */
   itemCount: number
   /** Días que cubre la lista. */
   days: number
   /** Multiplicador familia (1 = personal). */
   familyMultiplier: number
   /** Items agrupados por sección, en orden de recorrido. */
   bySection: Array<{ section: ItfShoppingSection; label: string; items: ItfShoppingItem[] }>
}

const SECTION_LABELS: Record<ItfShoppingSection, string> = {
   carniceria: '🥩 Carnicería / pescadería',
   lacteos: '🧀 Lácteos',
   legumbres: '🥫 Enlatados / legumbres',
   verduras: '🥬 Verduras',
   frutas: '🍎 Frutas',
   abarrotes: '🌾 Abarrotes / despensa'
}

const SECTION_ORDER: ItfShoppingSection[] = [
   'carniceria',
   'lacteos',
   'legumbres',
   'verduras',
   'frutas',
   'abarrotes'
]

/**
 * Decide en qué sección del supermercado vive cada ingrediente.
 * Reglas firmadas por Diego — el orden importa para recorrido real.
 */
const sectionForIngredient = (id: string, category: string): ItfShoppingSection => {
   /* Override específicos primero. */
   if (id === 'lentils-cooked' || id === 'chickpeas' || id === 'black-beans' || id === 'tuna-can') {
      return 'legumbres'
   }
   if (
      id === 'greek-yogurt' ||
      id === 'cottage-cheese' ||
      id === 'queso-fresco' ||
      id === 'ricotta' ||
      id === 'butter-unsalted' ||
      id === 'whey-protein'
   ) {
      return 'lacteos'
   }
   /* Reglas por categoría. */
   if (category === 'protein') return 'carniceria'
   if (category === 'vegetable') return 'verduras'
   if (category === 'fruit') return 'frutas'
   if (category === 'condiment') return 'verduras' /* ajo, limón, sal van con verdulería */
   return 'abarrotes' /* carbs + fats + resto */
}

/**
 * Construye la lista de compras agregando gramos de TODOS los componentes
 * usados en `daily_schedule`, multiplicado por el familyMultiplier.
 *
 * IMPORTANTE: solo cuenta los componentes (proteína, carbo, grasa, vegetal)
 * que tienen recetas asignadas. Los condimentos free-use (sal, ajo, limón)
 * NO se calculan al gramo — asumimos que el usuario los tiene en casa, pero
 * los agregamos como "recordatorio" sin gramaje exacto.
 */
export const buildShoppingList = ({
   plan,
   familyMultiplier = 1
}: {
   plan: ItfMealPlan
   familyMultiplier?: number
}): ItfShoppingList => {
   /* Acumular gramos por ingredient id. */
   const accumulator = new Map<string, { totalGrams: number; name: string }>()

   const ingredientLookup = new Map(SEED_INGREDIENTS.map((i) => [i.id, i]))

   const addToAccumulator = (id: string | undefined, name: string, grams: number) => {
      if (!id || grams <= 0) return
      const current = accumulator.get(id) ?? { totalGrams: 0, name }
      current.totalGrams += grams * familyMultiplier
      current.name = name
      accumulator.set(id, current)
   }

   const recipesByType = plan.recipes_by_meal_type as Record<
      string,
      ItfMealPlan['recipes_by_meal_type'][ItfMealType]
   >
   for (const day of plan.daily_schedule) {
      const mealEntries = Object.entries(day.meals)
      for (const [mealType, assignment] of mealEntries) {
         if (!assignment) continue
         const recipes = recipesByType[mealType]
         const recipe = recipes?.[assignment.recipeIdx]
         if (!recipe) continue
         const c = recipe.components
         addToAccumulator(c.protein.id, c.protein.name, assignment.scaledGrams.protein)
         addToAccumulator(c.carb.id, c.carb.name, assignment.scaledGrams.carb)
         addToAccumulator(c.fat.id, c.fat.name, assignment.scaledGrams.fat)
         if (c.vegetable) {
            addToAccumulator(c.vegetable.id, c.vegetable.name, assignment.scaledGrams.vegetable)
         }
      }
   }

   /* Convertir a items + asignar sección + humanizar cantidad. */
   const items: ItfShoppingItem[] = []
   for (const [id, { totalGrams, name }] of accumulator.entries()) {
      const seed = ingredientLookup.get(id)
      const category = seed?.category ?? 'condiment'
      items.push({
         ingredientId: id,
         name,
         section: sectionForIngredient(id, category),
         totalGrams: Math.round(totalGrams),
         humanQuantity: formatQuantity(id, totalGrams)
      })
   }

   /* Agrupar por sección + ordenar items dentro de cada una alfabéticamente. */
   const bySection: ItfShoppingList['bySection'] = SECTION_ORDER.map((section) => ({
      section,
      label: SECTION_LABELS[section],
      items: items
         .filter((i) => i.section === section)
         .sort((a, b) => a.name.localeCompare(b.name, 'es'))
   })).filter((g) => g.items.length > 0)

   return {
      itemCount: items.length,
      days: plan.days,
      familyMultiplier,
      bySection
   }
}

/**
 * Genera un texto plano de la lista listo para copiar a WhatsApp.
 */
export const shoppingListToPlainText = (list: ItfShoppingList): string => {
   const header = `🛒 Lista de compras — ${list.days} ${list.days === 1 ? 'día' : 'días'}${
      list.familyMultiplier > 1 ? ` × ${list.familyMultiplier} personas` : ''
   }\n`
   const sections = list.bySection.map((g) => {
      const lines = g.items.map((i) => `• ${i.name} — ${i.humanQuantity}`).join('\n')
      return `\n${g.label}\n${lines}`
   })
   return header + sections.join('\n')
}

/** Métricas básicas para mostrar al usuario. */
export const getShoppingListSummary = (list: ItfShoppingList) => ({
   sectionsCount: list.bySection.length,
   itemsCount: list.itemCount,
   /* Aproximación de gramaje total comprable. */
   totalGramsApprox: list.bySection.reduce(
      (sum, g) => sum + g.items.reduce((s, i) => s + i.totalGrams, 0),
      0
   )
})

/** Exporta SHOPPING_UNITS y formatQuantity para tests. */
export { SHOPPING_UNITS, formatQuantity }
