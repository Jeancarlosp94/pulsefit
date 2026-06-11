import type { ItfReviewSummary } from './types'

/** Palabras prohibidas que rechazamos del output de IA. */
const FORBIDDEN_WORDS = [
   'fallaste',
   'no cumpliste',
   'deberías haber',
   'necesitas',
   'tienes que',
   'debes',
   'estás mal',
   'flojeaste',
   'régimen estricto',
   'diagnost',
   'trastorno',
   'enfermedad',
   'patolog',
   'déficit nutricional'
]

const FIELD_LIMITS = {
   greeting: { min: 5, max: 120 },
   summary: { min: 50, max: 400 },
   adjustments_intro: { min: 10, max: 150 },
   closing: { min: 5, max: 150 }
} as const

interface ValidationResult {
   ok: true
   value: ItfReviewSummary
}

interface ValidationFailure {
   ok: false
   reason: string
}

const containsForbidden = (text: string): string | null => {
   const lower = text.toLowerCase()
   for (const word of FORBIDDEN_WORDS) {
      if (lower.includes(word)) return word
   }
   return null
}

/**
 * Valida el output del modelo. Rechaza si:
 * - Falta algún campo.
 * - Longitudes fuera de rango.
 * - Contiene palabras prohibidas.
 * - Highlights vacíos o > 5.
 *
 * NO valida que los números mencionados existan en el input (la regla
 * del prompt System ya pide no inventar; el riesgo se mitiga con
 * fallback determinístico ante cualquier sospecha).
 */
export const validateReviewSummary = (raw: unknown): ValidationResult | ValidationFailure => {
   if (!raw || typeof raw !== 'object') {
      return { ok: false, reason: 'No es un objeto' }
   }
   const obj = raw as Record<string, unknown>

   const greeting = typeof obj.greeting === 'string' ? obj.greeting.trim() : ''
   const summary = typeof obj.summary === 'string' ? obj.summary.trim() : ''
   const adjustments_intro =
      typeof obj.adjustments_intro === 'string' ? obj.adjustments_intro.trim() : ''
   const closing = typeof obj.closing === 'string' ? obj.closing.trim() : ''
   const highlights = Array.isArray(obj.highlights)
      ? (obj.highlights as unknown[])
           .filter((h): h is string => typeof h === 'string')
           .map((h) => h.trim())
           .filter((h) => h.length > 0)
      : []

   const fields: Array<[string, string, keyof typeof FIELD_LIMITS]> = [
      ['greeting', greeting, 'greeting'],
      ['summary', summary, 'summary'],
      ['adjustments_intro', adjustments_intro, 'adjustments_intro'],
      ['closing', closing, 'closing']
   ]

   for (const [name, value, limitKey] of fields) {
      const { min, max } = FIELD_LIMITS[limitKey]
      if (value.length < min) return { ok: false, reason: `${name} muy corto (${value.length})` }
      if (value.length > max) return { ok: false, reason: `${name} muy largo (${value.length})` }
      const bad = containsForbidden(value)
      if (bad) return { ok: false, reason: `${name} contiene palabra prohibida: "${bad}"` }
   }

   if (highlights.length === 0 || highlights.length > 5) {
      return { ok: false, reason: `highlights debe tener 1-5 entradas` }
   }
   for (const h of highlights) {
      const bad = containsForbidden(h)
      if (bad) return { ok: false, reason: `highlight contiene palabra prohibida: "${bad}"` }
      if (h.length > 80) return { ok: false, reason: `highlight muy largo (${h.length})` }
   }

   return {
      ok: true,
      value: {
         greeting,
         summary,
         highlights,
         adjustments_intro,
         closing,
         source: 'ai'
      }
   }
}
