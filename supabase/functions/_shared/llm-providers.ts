/**
 * Abstracción de proveedores LLM para las Edge Functions.
 * Decisión arquitectónica (files/MEMORY.md, mesa de expertos 2026-06-08):
 *   - Primario: Groq + Llama 3.3 70B Versatile (latencia ~0.5s).
 *   - Fallback: Google Gemini 2.0 Flash (latencia ~2s, free tier independiente).
 *
 * La cascada queda: Groq → Groq retry → Gemini → fallback templates (en el
 * orchestrator del Edge Function).
 */

export interface LLMResponse {
   raw: string
   provider: 'groq' | 'gemini'
   latencyMs: number
}

export interface LLMProvider {
   name: 'groq' | 'gemini'
   /**
    * Genera una respuesta basada en system + user prompt.
    * Debe lanzar si la API responde con error o si tarda más del timeout.
    */
   generate: (input: {
      systemPrompt: string
      userPrompt: string
      timeoutMs?: number
   }) => Promise<LLMResponse>
}

// ============================================================
//  GROQ PROVIDER
// ============================================================
export const createGroqProvider = (apiKey: string): LLMProvider => ({
   name: 'groq',
   async generate({ systemPrompt, userPrompt, timeoutMs = 8000 }) {
      const start = Date.now()
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)

      try {
         const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${apiKey}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({
               model: 'llama-3.3-70b-versatile',
               temperature: 0.4,
               max_tokens: 1500,
               response_format: { type: 'json_object' },
               messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
               ]
            }),
            signal: controller.signal
         })
         if (!res.ok) {
            const text = await res.text().catch(() => '')
            throw new Error(`groq_${res.status}: ${text.slice(0, 200)}`)
         }
         const data = await res.json()
         const content: string = data?.choices?.[0]?.message?.content ?? ''
         if (!content) throw new Error('groq_empty_response')
         return { raw: content, provider: 'groq', latencyMs: Date.now() - start }
      } finally {
         clearTimeout(timer)
      }
   }
})

// ============================================================
//  GEMINI PROVIDER (fallback)
// ============================================================
export const createGeminiProvider = (apiKey: string): LLMProvider => ({
   name: 'gemini',
   async generate({ systemPrompt, userPrompt, timeoutMs = 8000 }) {
      const start = Date.now()
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)

      try {
         const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
         const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               systemInstruction: { parts: [{ text: systemPrompt }] },
               contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
               generationConfig: {
                  temperature: 0.4,
                  maxOutputTokens: 1500,
                  responseMimeType: 'application/json'
               }
            }),
            signal: controller.signal
         })
         if (!res.ok) {
            const text = await res.text().catch(() => '')
            throw new Error(`gemini_${res.status}: ${text.slice(0, 200)}`)
         }
         const data = await res.json()
         const content: string =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
         if (!content) throw new Error('gemini_empty_response')
         return { raw: content, provider: 'gemini', latencyMs: Date.now() - start }
      } finally {
         clearTimeout(timer)
      }
   }
})
