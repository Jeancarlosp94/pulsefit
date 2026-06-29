/**
 * Validación de IMC + objetivo. Si IMC bajo + goal=lose, bloquear.
 * Si IMC muy alto + goal=maintain, sugerir reconsideración (sin bloquear).
 *
 * Reglas firmadas por Lucía (nutricionista clínica + especialista TCA):
 *   - IMC < 18.5 = bajo peso. Goal=lose es contraindicado.
 *   - IMC entre 18.5 y 24.9 = peso normal. Goal=lose debe ser conservador
 *     (no más de 0.5% por semana). Si quiere bajar mucho → señal de revisar.
 *   - IMC ≥ 30 = obesidad. Goal=lose es médicamente apropiado, pero con
 *     acompañamiento profesional recomendado.
 *   - IMC ≥ 35 + goal=maintain → sugerir reconsiderar (mensaje educativo).
 */

export type ItfImcCategory =
   | 'underweight'
   | 'normal'
   | 'overweight'
   | 'obese_1'
   | 'obese_2'
   | 'obese_3'

export interface ImcCheckResult {
   imc: number | null
   category: ItfImcCategory | null
   /** Si el plan puede generarse con los datos actuales. */
   ok: boolean
   /** Mensaje cuando NO es ok (block). */
   blockMessage: string | null
   /** Mensaje informativo cuando es ok pero conviene avisar (no bloquea). */
   adviceMessage: string | null
}

export const computeImc = (weightKg: number, heightCm: number): number | null => {
   if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || heightCm <= 0) return null
   const m = heightCm / 100
   return +(weightKg / (m * m)).toFixed(1)
}

export const categorizeImc = (imc: number): ItfImcCategory => {
   if (imc < 18.5) return 'underweight'
   if (imc < 25) return 'normal'
   if (imc < 30) return 'overweight'
   if (imc < 35) return 'obese_1'
   if (imc < 40) return 'obese_2'
   return 'obese_3'
}

export const checkImcVsGoal = (
   weightKg: number,
   heightCm: number,
   goal: 'lose' | 'gain' | 'maintain' | 'feel_better' | null | undefined
): ImcCheckResult => {
   const imc = computeImc(weightKg, heightCm)
   if (imc === null) {
      return {
         imc: null,
         category: null,
         ok: true,
         blockMessage: null,
         adviceMessage: null
      }
   }
   const category = categorizeImc(imc)

   /* BLOQUEOS (no permite generar plan) */
   if (category === 'underweight' && goal === 'lose') {
      return {
         imc,
         category,
         ok: false,
         blockMessage:
            'Tu IMC actual está por debajo del rango saludable. Bajar más peso no es seguro. Te recomendamos hablar con un profesional de salud antes de seguir 🌿',
         adviceMessage: null
      }
   }
   if (category === 'obese_3' && goal === 'gain') {
      return {
         imc,
         category,
         ok: false,
         blockMessage:
            'Tu IMC actual indica obesidad severa. Subir más peso podría ser un riesgo cardiovascular. Hablemos con un profesional antes 🌿',
         adviceMessage: null
      }
   }

   /* ADVISERS (permite continuar pero avisa con cariño) */
   if (category === 'normal' && goal === 'lose') {
      return {
         imc,
         category,
         ok: true,
         blockMessage: null,
         adviceMessage:
            'Tu peso ya está en rango saludable. Si tu objetivo es tonificarte o sentirte mejor, también te acompañamos sin enfocarnos en bajar 🌱'
      }
   }
   if ((category === 'obese_2' || category === 'obese_3') && goal === 'maintain') {
      return {
         imc,
         category,
         ok: true,
         blockMessage: null,
         adviceMessage:
            'Sin presión: reducir entre 5-10% del peso reduce significativamente el riesgo cardiovascular. Si en algún momento te interesa, aquí estamos 🌿'
      }
   }

   return { imc, category, ok: true, blockMessage: null, adviceMessage: null }
}
