/**
 * Edge Function `weekly-review`.
 *
 * Recibe del cliente:
 *   - userName: string para personalizar el saludo.
 *   - metrics: ItfWeeklyMetrics ya calculadas por el cliente.
 *   - adjustments: lista de ItfAdjustment del motor determinístico.
 *
 * Devuelve:
 *   - summary: { greeting, summary, highlights, adjustments_intro, closing, source }
 *
 * El cliente combina metrics + adjustments + summary en su componente.
 * Esta función SOLO redacta el mensaje narrativo, nunca inventa números.
 *
 * Cascade: Groq → Gemini → null (cliente arma fallback determinístico).
 *
 * Seguridad:
 *   - API keys leídas SOLO desde Deno.env.
 *   - El validador rechaza outputs con palabras prohibidas.
 *   - Si todo falla, devuelve { summary: null, source: 'fallback' } y el
 *     cliente usa buildFallbackSummary del motor.
 */

import { createGeminiProvider, createGroqProvider } from '../_shared/llm-providers.ts'
import { corsHeaders, jsonRes } from '../_shared/cors.ts'

interface Metrics {
   week_start: string
   week_end: string
   meal_adherence_pct: number
   workouts_count: number
   rpe_average: number | null
   weight_change_kg: number | null
   mood_days: number
   energy_average: number | null
   mood_average: number | null
   rescues_used: number
   water_avg_glasses: number
   streak_days: number
}

interface Adjustment {
   id: string
   type: string
   title: string
   reason: string
   priority: 'high' | 'medium' | 'low'
}

interface RequestBody {
   userName?: string
   metrics: Metrics
   adjustments: Adjustment[]
}

const SYSTEM_PROMPT = `Eres el coach de PulseFit, una app PWA gratuita de fitness y nutrición para Latinoamérica.

Tu ÚNICO trabajo es redactar un resumen semanal cálido y compasivo basado en métricas que se te entregan.

REGLAS ABSOLUTAS:
- NUNCA inventas números, métricas o ajustes que no estén en el input.
- SOLO usas los datos del input.
- NUNCA das consejos médicos ni nutricionales específicos.
- NUNCA usas palabras: "fallaste", "no cumpliste", "deberías haber", "necesitas", "tienes que", "estás mal", "régimen estricto", "trastorno", "patología".
- Tono: como un amigo que se preocupa, no como un entrenador exigente.
- Español neutro LATAM (tuteo: tú/tienes/puedes, NO voseo).
- Máximo 3 párrafos cortos en summary.
- Termina siempre con una frase de apoyo.
- Devuelves SOLO un JSON con la estructura exacta pedida, sin texto adicional.`

const buildUserPrompt = (body: RequestBody): string => {
   const m = body.metrics
   const name = body.userName?.trim() || 'tú'
   const adjustmentsSummary =
      body.adjustments.length > 0
         ? body.adjustments.map((a) => `- [${a.priority}] ${a.title}: ${a.reason}`).join('\n')
         : 'Sin ajustes propuestos. Mantener el plan actual.'

   return `Esta es la semana de ${name} (del ${m.week_start} al ${m.week_end}):
- Adherencia de comidas: ${m.meal_adherence_pct}%
- Entrenamientos completados: ${m.workouts_count}
- RPE promedio: ${m.rpe_average ?? 'sin datos'}
- Cambio de peso: ${m.weight_change_kg !== null ? `${m.weight_change_kg} kg` : 'sin datos'}
- Energía promedio: ${m.energy_average !== null ? `${m.energy_average}/5` : 'sin datos'}
- Ánimo promedio: ${m.mood_average !== null ? `${m.mood_average}/5` : 'sin datos'}
- Rescates usados: ${m.rescues_used}
- Vasos de agua promedio/día: ${m.water_avg_glasses}
- Racha actual: ${m.streak_days} días

Ajustes que el motor determinístico propone (NO los inventes, úsalos como están):
${adjustmentsSummary}

Devuelve EXCLUSIVAMENTE este JSON, sin markdown ni texto adicional:
{
  "greeting": "saludo personalizado de 1 oración",
  "summary": "resumen empático de la semana, 2-3 oraciones",
  "highlights": ["positivo 1 concreto", "positivo 2 concreto"],
  "adjustments_intro": "frase introduciendo los cambios sugeridos",
  "closing": "mensaje de apoyo final, 1 oración"
}`
}

const FORBIDDEN = [
   'fallaste',
   'no cumpliste',
   'deberías haber',
   'necesitas',
   'tienes que',
   'debes',
   'estás mal',
   'régimen estricto',
   'trastorno',
   'patolog',
   'déficit nutricional'
]

const isClean = (text: string): boolean => {
   const lower = text.toLowerCase()
   return !FORBIDDEN.some((w) => lower.includes(w))
}

const parseAndValidate = (raw: string): Record<string, unknown> | null => {
   try {
      /* Quitar bloques de markdown si vinieran. */
      const cleaned = raw
         .trim()
         .replace(/^```(?:json)?\s*/i, '')
         .replace(/\s*```$/, '')
      const obj = JSON.parse(cleaned)
      const fields = ['greeting', 'summary', 'adjustments_intro', 'closing']
      for (const f of fields) {
         if (typeof obj[f] !== 'string' || obj[f].length < 5) return null
         if (!isClean(obj[f])) return null
      }
      if (!Array.isArray(obj.highlights) || obj.highlights.length === 0) return null
      for (const h of obj.highlights) {
         if (typeof h !== 'string' || !isClean(h)) return null
      }
      return obj
   } catch {
      return null
   }
}

Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
   }

   try {
      const body = (await req.json()) as RequestBody
      if (!body?.metrics) {
         return jsonRes({ msg: 'Faltan métricas 🌿' }, 400)
      }

      const groqKey = Deno.env.get('GROQ_API_KEY')
      const geminiKey = Deno.env.get('GEMINI_API_KEY')

      const userPrompt = buildUserPrompt(body)

      /* Intento 1: Groq. */
      if (groqKey) {
         try {
            const groq = createGroqProvider(groqKey)
            const res = await groq.generate({
               systemPrompt: SYSTEM_PROMPT,
               userPrompt,
               timeoutMs: 9000
            })
            const obj = parseAndValidate(res.raw)
            if (obj) {
               return jsonRes({
                  msg: 'ok',
                  data: { ...obj, source: 'ai', provider: res.provider }
               })
            }
         } catch (_e) {
            /* swallow y continuar al fallback Gemini */
         }
      }

      /* Intento 2: Gemini. */
      if (geminiKey) {
         try {
            const gemini = createGeminiProvider(geminiKey)
            const res = await gemini.generate({
               systemPrompt: SYSTEM_PROMPT,
               userPrompt,
               timeoutMs: 10000
            })
            const obj = parseAndValidate(res.raw)
            if (obj) {
               return jsonRes({
                  msg: 'ok',
                  data: { ...obj, source: 'ai', provider: res.provider }
               })
            }
         } catch (_e) {
            /* fall through al fallback */
         }
      }

      /* Si llegamos aquí: el cliente arma su fallback determinístico. */
      return jsonRes({ msg: 'fallback', data: null }, 200)
   } catch (e) {
      console.error('[weekly-review] error', e instanceof Error ? e.message : e)
      return jsonRes({ msg: 'Algo no salió como esperábamos 🌱' }, 500)
   }
})
