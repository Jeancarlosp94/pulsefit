/**
 * Validador defensivo de consistencia dietaria.
 *
 * Aunque `filterIngredientPool` excluye ingredientes prohibidos por tags,
 * la IA o un fallback creativo pueden colar palabras de animales en los
 * `steps` o `name` (ej: "tortilla con huevo" cuando el usuario es vegan).
 *
 * Esta función VALIDA el output ya armado. Si encuentra un leak,
 * devuelve { valid: false } para que el orchestrator rechace y reintente
 * o caiga a fallback más estricto.
 */

const ANIMAL_KEYWORDS_BY_RESTRICTION: Record<string, string[]> = {
   vegan: [
      'huevo',
      'huevos',
      'pollo',
      'pavo',
      'cerdo',
      'carne',
      'res',
      'pescado',
      'atun',
      'atún',
      'salmón',
      'salmon',
      'camarón',
      'camarones',
      'queso',
      'leche',
      'yogurt',
      'yogur',
      'mantequilla',
      'crema',
      'jamón',
      'jamon',
      'tocino',
      'chorizo',
      'jamoneta',
      'miel',
      'gelatina'
   ],
   vegetarian: [
      'pollo',
      'pavo',
      'cerdo',
      'carne',
      'res',
      'pescado',
      'atun',
      'atún',
      'salmón',
      'salmon',
      'camarón',
      'camarones',
      'jamón',
      'jamon',
      'tocino',
      'chorizo',
      'gelatina'
   ],
   pescatarian: ['pollo', 'pavo', 'cerdo', 'carne', 'res', 'jamón', 'jamon', 'tocino', 'chorizo'],
   gluten_free: [
      'pan ',
      'trigo',
      'pasta',
      'fideos',
      'cuscús',
      'cuscus',
      'cebada',
      'centeno',
      'galletas',
      'tortilla de harina',
      'empanada'
   ],
   lactose_free: ['leche', 'queso', 'yogurt', 'yogur', 'mantequilla', 'crema', 'lácteo', 'lacteo']
}

export interface DietaryValidationResult {
   valid: boolean
   /** Restricción que falló (si valid=false). */
   restriction: string | null
   /** Palabra que disparó el rechazo. */
   offending_word: string | null
   /** En qué campo apareció: name | step. */
   location: 'name' | 'step' | null
}

export const validateDietaryConsistency = (
   plate: { name: string; steps: string[] },
   dietaryRestrictions: string[]
): DietaryValidationResult => {
   if (dietaryRestrictions.length === 0) {
      return { valid: true, restriction: null, offending_word: null, location: null }
   }

   const normalize = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
   const nameLow = normalize(plate.name)
   const stepsLow = plate.steps.map(normalize)

   for (const restriction of dietaryRestrictions) {
      const keywords = ANIMAL_KEYWORDS_BY_RESTRICTION[restriction]
      if (!keywords) continue

      for (const kw of keywords) {
         const kwLow = normalize(kw)
         /* Match con boundary para evitar false positives. */
         const regex = new RegExp(`\\b${kwLow.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)

         if (regex.test(nameLow)) {
            return { valid: false, restriction, offending_word: kw, location: 'name' }
         }
         for (const step of stepsLow) {
            if (regex.test(step)) {
               return { valid: false, restriction, offending_word: kw, location: 'step' }
            }
         }
      }
   }
   return { valid: true, restriction: null, offending_word: null, location: null }
}
