/**
 * Sprint 11.15: "Chef Diego" — reviewer determinístico de platos.
 *
 * Cada plato que devuelve el LLM (Groq/Gemini) o el fallback templates
 * pasa por Diego antes de mostrarse al usuario. Diego aplica reglas
 * culinarias firmadas por un chef profesional que rechazan platos:
 *   - Química/físicamente imposibles (whey + limón).
 *   - Culturalmente absurdos (polvo servido "sobre" arepa).
 *   - Con pasos de preparación incoherentes (verduras crudas horneadas).
 *   - Con nombres robóticos ("plato unificado con X").
 *
 * A diferencia de un segundo LLM, este chef es:
 *   - Instantáneo (~50µs por plato).
 *   - Gratis (sin API cost).
 *   - Determinístico (testeable).
 *   - Extensible (nueva regla = nueva línea en CHEF_RULES).
 *
 * Retorna { approved, reason?, ruleName? }:
 *   - approved=true → mostrar plato al usuario.
 *   - approved=false → orquestador usa fallback template.
 */

import type { ItfPlateOption } from './types'

export interface ItfChefReviewResult {
   approved: boolean
   /** Razón humano-legible del rechazo (para logs). */
   reason?: string
   /** Nombre corto de la regla (para telemetría). */
   ruleName?: string
}

interface ChefRule {
   name: string
   check: (option: ItfPlateOption) => string | null
}

/**
 * Reglas del chef. Cada una recibe el plato completo y devuelve:
 *   - null si aprueba.
 *   - string con razón si rechaza.
 */
const CHEF_RULES: ChefRule[] = [
   /* ============================================================
    *  1. QUÍMICA: proteína en polvo con calor
    * ============================================================ */
   {
      name: 'polvo_en_caliente',
      check: (opt) => {
         const text = [opt.name, ...opt.steps].join(' ').toLowerCase()
         /* Polvo + verbos de cocción caliente (cualquier orden).
          * IMPORTANTE: word boundaries \b para evitar match con "licuaDORA",
          * "arepa calienTE" (adjetivo), etc. */
         const HOT_VERBS_STR =
            '\\b(?:cocina|cocinar|saltea|saltear|dora|dorar|hornea|hornear|calienta|calentar|fríe|fríen|freír|frita|fritas|frito|fritos|tuesta|tostar|asa|asar|guisa|guisar)\\b'
         const hotVerbs = new RegExp(HOT_VERBS_STR, 'i')
         const powder = /\b(?:polvo|whey|caseina|caseína)\b/i
         if (!hotVerbs.test(text) || !powder.test(text)) return null
         const powderMatch = new RegExp(
            `\\b(?:polvo|whey|caseina|caseína)\\b[^.]{0,80}${HOT_VERBS_STR}`,
            'i'
         )
         const inverseMatch = new RegExp(
            `${HOT_VERBS_STR}[^.]{0,80}\\b(?:polvo|whey|caseina|caseína)\\b`,
            'i'
         )
         if (powderMatch.test(text) || inverseMatch.test(text)) {
            return 'proteína en polvo no se cocina en caliente (se coagula/quema)'
         }
         return null
      }
   },

   /* ============================================================
    *  2. QUÍMICA: polvo + ácido cítrico → coagulación
    * ============================================================ */
   {
      name: 'polvo_con_acido',
      check: (opt) => {
         const text = [opt.name, ...opt.steps].join(' ').toLowerCase()
         const powder = /(polvo|whey|caseina|caseína)/i
         const acid = /(limón|limon|jugo de limón|jugo de limon|vinagre|cítric|ácido cítrico)/i
         if (!powder.test(text) || !acid.test(text)) return null
         /* Buscar co-ocurrencia cercana (mismo step). */
         for (const step of opt.steps) {
            const s = step.toLowerCase()
            if (powder.test(s) && acid.test(s)) {
               return 'proteína en polvo + limón/ácido coagula la whey (imposible)'
            }
         }
         return null
      }
   },

   /* ============================================================
    *  3. TÉCNICA: polvo sazonado con sal/hierbas/ajo
    * ============================================================ */
   {
      name: 'polvo_sazonado_salado',
      check: (opt) => {
         const text = [opt.name, ...opt.steps].join(' ').toLowerCase()
         const powder = /(polvo|whey|caseina|caseína)/i
         const salty =
            /(hierbas frescas|perejil|cilantro|orégano|albahaca|ajo|sal\s|pimienta|cebolla)/i
         if (!powder.test(text)) return null
         for (const step of opt.steps) {
            const s = step.toLowerCase()
            if (powder.test(s) && salty.test(s)) {
               return 'la proteína en polvo se combina con dulces/canela, no con salados'
            }
         }
         return null
      }
   },

   /* ============================================================
    *  4. PLATING: polvo servido "sobre" un plato cocido
    * ============================================================ */
   {
      name: 'polvo_sobre_plato',
      check: (opt) => {
         const text = [opt.name, ...opt.steps].join(' ').toLowerCase()
         const bad =
            /\b(?:polvo|whey|caseina|caseína)\b[^.]{0,40}\b(?:sobre|encima de|con)\b[^.]{0,15}\b(?:arepa|pan|tortilla|papa|arroz|pasta|filete)\b/i
         if (bad.test(text)) {
            return 'proteína en polvo no se sirve seca sobre un plato — va en líquido'
         }
         return null
      }
   },

   /* ============================================================
    *  5. NOMBRE ROBÓTICO — "plato unificado", "combinación de"
    * ============================================================ */
   {
      name: 'nombre_robotico',
      check: (opt) => {
         const full = `${opt.name} ${opt.description}`.toLowerCase()
         const bad = /(plato unificado|combinaci[óo]n de|receta de)/i
         if (bad.test(full)) {
            return 'nombre/descripción robótico (evitar "plato unificado", "combinación de")'
         }
         return null
      }
   },

   /* ============================================================
    *  6. TÉCNICA: verduras crudas (lechuga, tomate, pepino) horneadas
    * ============================================================ */
   {
      name: 'verdura_cruda_cocida',
      check: (opt) => {
         const text = opt.steps.join(' ').toLowerCase()
         const VEG = '\\b(?:lechuga|pepino)\\b'
         const HOT_VEG =
            '\\b(?:hornea|hornear|saltea|saltear|cocina|cocinar|dora|dorar|fríe|fríen|freír|tuesta|tostar|asa|asar)\\b'
         const forward = new RegExp(`${VEG}[^.]{0,60}${HOT_VEG}`, 'i')
         const reverse = new RegExp(`${HOT_VEG}[^.]{0,60}${VEG}`, 'i')
         if (forward.test(text) || reverse.test(text)) {
            return 'lechuga/pepino no se cocinan en caliente'
         }
         return null
      }
   },

   /* ============================================================
    *  7. TIEMPO: pescado >25 min de cocción queda seco
    * ============================================================ */
   {
      name: 'pescado_sobre_cocido',
      check: (opt) => {
         const text = opt.steps.join(' ').toLowerCase()
         const fish = /(pescado|tilapia|atún|salmón|salmon|merluza|filete de)/i
         if (!fish.test(opt.name.toLowerCase()) && !fish.test(text)) return null
         /* Buscamos "N minutos" cerca de una acción de cocción de pescado. */
         const bad =
            /(pescado|tilapia|atún|salmón|salmon|merluza|filete)[^.]{0,60}(3[0-9]|[4-9]\d)\s*min/i
         if (bad.test(text)) {
            return 'pescado >30 min de cocción queda seco'
         }
         return null
      }
   },

   /* ============================================================
    *  8. PLATING: huevos crudos servidos sin cocción
    * ============================================================ */
   {
      name: 'huevo_crudo',
      check: (opt) => {
         const text = opt.steps.join(' ').toLowerCase()
         const eggs = /\bhuevos?\b/i
         const cooked =
            /\b(?:cocina|cocinar|fríe|fríen|freír|hierve|hervir|revuelve|revolver|hornea|hornear|dora|dorar|batir|calienta|calentar|prepara|tortilla|frittata|escalfa)\b/i
         if (!eggs.test(text)) return null
         /* Solo si menciona huevos y NINGÚN verbo de cocción aparece: sospechoso. */
         if (!cooked.test(text)) {
            return 'huevos requieren cocción (no se sirven crudos)'
         }
         return null
      }
   }
]

/**
 * Punto de entrada. Chef Diego revisa un plato y aprueba o rechaza.
 *
 * @example
 *   const review = reviewByChef(plate)
 *   if (!review.approved) {
 *      console.warn('[Chef]', review.ruleName, '→', review.reason)
 *      return useFallbackTemplate()
 *   }
 */
export const reviewByChef = (option: ItfPlateOption): ItfChefReviewResult => {
   for (const rule of CHEF_RULES) {
      const violation = rule.check(option)
      if (violation) {
         return {
            approved: false,
            reason: violation,
            ruleName: rule.name
         }
      }
   }
   return { approved: true }
}

/** Exportado para telemetría / debug. */
export const CHEF_RULE_NAMES = CHEF_RULES.map((r) => r.name)
