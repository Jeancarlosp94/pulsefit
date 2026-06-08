import type { ItfPlateOption, ItfValidationResult, ItfValidationFail } from './types'

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

/** Condimentos y básicos que siempre puede usar sin que sean "ingrediente nuevo". */
const FREE_USE = new Set([
   'sal',
   'pimienta',
   'ajo',
   'limón',
   'limon',
   'agua',
   'hierbas',
   'orégano',
   'tomillo',
   'cilantro',
   'perejil',
   'comino',
   'aceite',
   'vinagre'
])

const fail = (reason: ItfValidationFail['reason'], detail?: string): ItfValidationFail => ({
   valid: false,
   reason,
   ...(detail ? { detail } : {})
})

const tokenize = (text: string): string[] =>
   text
      .toLowerCase()
      .split(/[\s,.;:()¡!¿?\n]+/u)
      .filter((t) => t.length >= 4)

const FOOD_HEURISTIC = /^[a-záéíóúñ]+$/u

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

   const allowed = allowedIngredients.map((s) => s.toLowerCase().trim())

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

      // 7 — longitud de cada step
      const badStep = opt.steps.find(
         (s) => typeof s !== 'string' || s.length < 10 || s.length > 200
      )
      if (badStep !== undefined) return fail('step_length', `option ${i}`)

      // 8 — difficulty
      if (!['easy', 'medium', 'hard'].includes(opt.difficulty)) {
         return fail('bad_difficulty', `option ${i}: ${opt.difficulty}`)
      }

      // 9 — palabras prohibidas
      const fullText = [opt.name, opt.description, ...opt.steps].join(' ').toLowerCase()
      const forbidden = FORBIDDEN_WORDS.find((w) => fullText.includes(w))
      if (forbidden) return fail('forbidden_words', `option ${i}: "${forbidden}"`)

      // 4 — ingredientes permitidos
      const tokens = tokenize(fullText)
      const unknown = tokens.find(
         (t) =>
            FOOD_HEURISTIC.test(t) &&
            !FREE_USE.has(t) &&
            allowed.every((a) => !a.includes(t) && !t.includes(a)) &&
            ['azúcar', 'queso', 'mantequilla', 'crema', 'tocino', 'jamón', 'salchicha'].includes(t)
      )
      if (unknown) return fail('unknown_ingredient', unknown)
   }

   return { valid: true, options: opts }
}
