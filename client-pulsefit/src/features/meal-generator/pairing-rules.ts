/**
 * Sprint 11.18: reglas de emparejamiento (pairing) proteína × carb × grasa.
 *
 * PROBLEMA REAL:
 *   El motor de selección aleatoria puede armar combos absurdos como
 *   "yogurt griego + pan integral" o "jamón cocido + granola sin azúcar".
 *   El Chef Diego rechaza estos platos al final del pipeline, pero es tarde:
 *   el LLM ya alucinó, el fallback template no sabe qué hacer, y el usuario
 *   ve platos raros.
 *
 * SOLUCIÓN:
 *   Filtrar en el nivel MÁS TEMPRANO posible — al construir el combo. Si el
 *   proteína elegido es yogurt, el carb NO puede ser pan/tostada/arepa; si
 *   es jamón, no puede ser granola/muesli, etc.
 *
 * FILOSOFÍA:
 *   - Firmada por Diego (chef): las combinaciones aquí NO son "sugerencias",
 *     son platos que un cocinero LATAM real jamás armaría.
 *   - Se prefiere fail-open: si un ingrediente no está en la tabla, se
 *     considera compatible con todos (default permisivo).
 *   - Solo listamos incompatibilidades DURAS (yogurt+pan gomoso, jamón+dulce),
 *     no preferencias subjetivas ("no me gusta el pescado con papa").
 */

import type { ItfIngredient } from './types'

/**
 * Retorna true si los dos ingredientes NO combinan como plato coherente.
 * false = combo aceptable.
 */
export const areIncompatible = (protein: ItfIngredient, carb: ItfIngredient): boolean => {
   const p = protein.name.toLowerCase()
   const c = carb.name.toLowerCase()

   /* YOGURT → solo con cereal-like (granola, avena, cereal, muesli, semillas).
    * Pan/tostada/arepa/tortilla/papa/arroz/pasta quedan gomosos. */
   if (/yogur[t]?/i.test(p)) {
      const carbIsCerealLike = /granola|avena|cereal|müesli|muesli|semilla/i.test(c)
      if (!carbIsCerealLike) return true
   }

   /* PROTEÍNA EN POLVO → solo con cereal-like para batido/overnight.
    * No con pan/tortilla/arepa (queda seco encima). */
   if (/polvo|whey|caseina|caseína/i.test(p)) {
      const carbIsCerealLike =
         /granola|avena|cereal|müesli|muesli|semilla|banana|plátano|fruta/i.test(c)
      if (!carbIsCerealLike) return true
   }

   /* CARNES PROCESADAS SALADAS (jamón, chorizo, salchicha, pavo cocido)
    * → NO con granola/muesli/cereal dulce. Sí con pan/arepa/papa. */
   if (/jam[óo]n|chorizo|salchicha|salami|pavo\s+cocido|mortadela/i.test(p)) {
      const carbIsSweet = /granola|muesli|müesli|cereal(?:es)?\s+(?:dulce|de\s+desayuno)/i.test(c)
      if (carbIsSweet) return true
   }

   /* HUEVOS DULCES → los huevos combinan salado. No con granola/cereal dulce.
    * Pan/tostada/arepa/papa/avena están OK. */
   if (/huevos?/i.test(p) && p.length < 15) {
      const carbIsSweet = /granola\b|muesli|müesli/i.test(c)
      if (carbIsSweet) return true
   }

   /* LEGUMBRES (lentejas, garbanzos, frijoles, porotos) → NO con granola/muesli
    * ni con avena. Son salado-tierra. */
   if (/lentejas|garbanzos|frijoles|porotos|habas/i.test(p)) {
      const carbIsSweet = /granola|muesli|müesli|avena/i.test(c)
      if (carbIsSweet) return true
   }

   /* PESCADO/MARISCO → NO con granola/muesli/cereal dulce ni avena. */
   if (/pescado|salm[óo]n|tilapia|at[úu]n|merluza|sardina|filete de/i.test(p)) {
      const carbIsSweet = /granola|muesli|müesli|avena|cereal\b/i.test(c)
      if (carbIsSweet) return true
   }

   /* QUESOS DUROS/PROCESADOS → NO con granola dulce ni cereal dulce. */
   if (/queso\s+(?:cottage|ricotta|fresco|panela|blanco)/i.test(p)) {
      const carbIsSweet = /muesli|müesli|cereal(?:es)?\s+(?:dulce|de\s+desayuno)/i.test(c)
      if (carbIsSweet) return true
   }

   return false
}

/**
 * Filtra un pool de carbs para dejar solo los compatibles con la proteína dada.
 * Si NINGUNO es compatible (raro), retorna el pool completo — mejor un plato
 * subóptimo que ningún plato (el Chef lo rechazará y caeremos a fallback).
 */
export const filterCarbsForProtein = (
   protein: ItfIngredient,
   carbs: ItfIngredient[]
): ItfIngredient[] => {
   const compatible = carbs.filter((c) => !areIncompatible(protein, c))
   return compatible.length > 0 ? compatible : carbs
}
