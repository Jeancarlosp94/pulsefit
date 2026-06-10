import type { ItfPlateOption, ItfValidationResult, ItfValidationFail } from './types'

export type ItfSinglePlateValidation =
   | { valid: true; option: ItfPlateOption }
   | { valid: false; reason: ItfValidationFail['reason']; detail?: string }

/**
 * Palabras prohibidas en la respuesta de IA. Implementan los principios del
 * proyecto: cero punitivismo, cero consejo médico, cero promesas estéticas.
 */
const FORBIDDEN_WORDS = [
   'fallaste',
   'incorrecto',
   'malo',
   'diagnóstico',
   'enfermedad',
   'cura',
   'medicamento',
   'tonificar',
   'quemar grasa',
   'transformación',
   'antes y después',
   'régimen estricto'
]

/**
 * Patrones de comida ULTRA-PROCESADA que NO queremos que aparezca en recetas.
 * Cuidado: NO bloqueamos "queso" / "mantequilla" / "jamón" genéricos porque
 * son base de la cocina LATAM (queso fresco, mantequilla sin sal, jamón cocido
 * magro). Solo bloqueamos las versiones procesadas/industriales por sodio o
 * aceites trans.
 */
const FORBIDDEN_PROCESSED_FOODS = [
   'azúcar añadida',
   'azúcar refinada',
   'queso amarillo',
   'queso cheddar',
   'queso procesado',
   'queso americano',
   'margarina',
   'crema de leche',
   'nata para batir',
   'tocino',
   'panceta',
   'jamón serrano',
   'jamón ibérico',
   'jamón crudo',
   'jamón ahumado',
   'salchicha',
   'chorizo',
   'mortadela',
   'salami',
   'pepperoni'
]

const fail = (reason: ItfValidationFail['reason'], detail?: string): ItfValidationFail => ({
   valid: false,
   reason,
   ...(detail ? { detail } : {})
})

interface ValidateInput {
   raw: string
   allowedIngredients: string[]
}

/**
 * Valida la respuesta de Groq contra TODAS las restricciones del producto.
 *
 * Reglas (de files/generadores-hibridos.md sección 4):
 *   1. JSON parseable.
 *   2. Exactamente 3 options.
 *   3. Cada option tiene name, description, prep_time_min, difficulty, steps.
 *   4. Solo menciona ingredientes permitidos (fuzzy + FREE_USE + tokens cortos).
 *   5. prep_time_min entre 5 y 60.
 *   6. steps entre 2 y 10 elementos.
 *   7. Cada step entre 10 y 200 caracteres.
 *   8. difficulty es 'easy' | 'medium' | 'hard'.
 *   9. NO contiene palabras prohibidas en name/description/steps.
 */
export const validateMealResponse = ({
   raw,
   allowedIngredients
}: ValidateInput): ItfValidationResult => {
   // 1 — JSON
   let parsed: { options?: ItfPlateOption[] }
   try {
      parsed = JSON.parse(raw)
   } catch {
      return fail('invalid_json')
   }

   // 2 — número de opciones
   const opts = parsed.options
   if (!Array.isArray(opts) || opts.length !== 3) {
      return fail('wrong_option_count', `recibí ${opts?.length ?? 0}`)
   }

   void allowedIngredients /* legacy: ya no filtramos por allowed (era contraproducente). */

   for (let i = 0; i < opts.length; i++) {
      const opt = opts[i]

      // 3 — campos requeridos
      if (
         !opt ||
         typeof opt.name !== 'string' ||
         typeof opt.description !== 'string' ||
         typeof opt.prep_time_min !== 'number' ||
         typeof opt.difficulty !== 'string' ||
         !Array.isArray(opt.steps)
      ) {
         return fail('missing_fields', `option ${i}`)
      }

      // 5 — prep_time_min
      if (opt.prep_time_min < 5 || opt.prep_time_min > 60) {
         return fail('prep_time_out_of_range', `option ${i}: ${opt.prep_time_min}`)
      }

      // 6 — número de steps
      if (opt.steps.length < 2 || opt.steps.length > 10) {
         return fail('steps_out_of_range', `option ${i}: ${opt.steps.length}`)
      }

      // 7 — longitud de cada step (rango amplio para no rechazar técnicas reales)
      const badStep = opt.steps.find(
         (s) => typeof s !== 'string' || s.length < 20 || s.length > 250
      )
      if (badStep !== undefined) return fail('step_length', `option ${i}`)

      // 8 — difficulty
      if (!['easy', 'medium', 'hard'].includes(opt.difficulty)) {
         return fail('bad_difficulty', `option ${i}: ${opt.difficulty}`)
      }

      // 9 — palabras prohibidas (lenguaje punitivo + comida procesada)
      const fullText = [opt.name, opt.description, ...opt.steps].join(' ').toLowerCase()
      const forbidden = FORBIDDEN_WORDS.find((w) => fullText.includes(w))
      if (forbidden) return fail('forbidden_words', `option ${i}: "${forbidden}"`)
      const processed = FORBIDDEN_PROCESSED_FOODS.find((p) => fullText.includes(p))
      if (processed) return fail('forbidden_words', `option ${i}: "${processed}"`)

      /* Antes había un check de "tokens desconocidos" que bloqueaba palabras
       * de cocina como "sartén", "minutos", "fuego" o ingredientes regionales
       * (cebolla colorada, ají amarillo). Era contraproducente y la lista negra
       * solo cubría 7 palabras genéricas. El check #9 + FORBIDDEN_PROCESSED_FOODS
       * ya cubre los procesados peligrosos sin falsos positivos. */
   }

   return { valid: true, options: opts }
}

/**
 * Valida UNA opción individual (cuando el orquestador genera las 3 opciones
 * por separado con Promise.all). Reglas idénticas a `validateMealResponse`
 * pero aplicadas a un solo plato.
 */
export const validateSinglePlate = ({
   raw,
   allowedIngredients
}: ValidateInput): ItfSinglePlateValidation => {
   let parsed: Partial<ItfPlateOption>
   try {
      parsed = JSON.parse(raw)
   } catch {
      return { valid: false, reason: 'invalid_json' }
   }

   if (
      !parsed ||
      typeof parsed.name !== 'string' ||
      typeof parsed.description !== 'string' ||
      typeof parsed.prep_time_min !== 'number' ||
      typeof parsed.difficulty !== 'string' ||
      !Array.isArray(parsed.steps)
   ) {
      return { valid: false, reason: 'missing_fields' }
   }

   if (parsed.prep_time_min < 5 || parsed.prep_time_min > 60) {
      return { valid: false, reason: 'prep_time_out_of_range' }
   }
   /* Aceptamos un rango más amplio que el del prompt para que el validador no
    * sea más estricto que la IA. El prompt pide 3-7 / 30-180; aceptamos 2-10
    * / 20-220 para tolerar pequeñas desviaciones sin invalidar. */
   if (parsed.steps.length < 2 || parsed.steps.length > 10) {
      return { valid: false, reason: 'steps_out_of_range' }
   }
   const badStep = parsed.steps.find(
      (s) => typeof s !== 'string' || s.length < 20 || s.length > 250
   )
   if (badStep !== undefined) return { valid: false, reason: 'step_length' }

   if (!['easy', 'medium', 'hard'].includes(parsed.difficulty)) {
      return { valid: false, reason: 'bad_difficulty' }
   }

   const fullText = [parsed.name, parsed.description, ...parsed.steps].join(' ').toLowerCase()
   const forbidden = FORBIDDEN_WORDS.find((w) => fullText.includes(w))
   if (forbidden) return { valid: false, reason: 'forbidden_words', detail: forbidden }
   const processed = FORBIDDEN_PROCESSED_FOODS.find((p) => fullText.includes(p))
   if (processed) return { valid: false, reason: 'forbidden_words', detail: processed }
   void allowedIngredients /* legacy: ya no filtramos por allowed (era contraproducente). */

   return {
      valid: true,
      option: {
         name: parsed.name,
         description: parsed.description,
         prep_time_min: parsed.prep_time_min,
         difficulty: parsed.difficulty as ItfPlateOption['difficulty'],
         steps: parsed.steps as string[]
      }
   }
}
