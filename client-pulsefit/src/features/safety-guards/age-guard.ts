/**
 * Validación de edad mínima.
 * PulseFit no es para menores de 18 (riesgo clínico + responsabilidad legal).
 */

export interface AgeCheckResult {
   /** Edad calculada en años cumplidos. */
   age: number | null
   /** Si la edad es válida para usar PulseFit. */
   ok: boolean
   /** Mensaje compasivo si no es válida. */
   message: string | null
}

export const computeAge = (dob: string | Date | null | undefined): number | null => {
   if (!dob) return null
   const birth = typeof dob === 'string' ? new Date(dob) : dob
   if (Number.isNaN(birth.getTime())) return null
   const now = new Date()
   let age = now.getFullYear() - birth.getFullYear()
   const m = now.getMonth() - birth.getMonth()
   if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--
   }
   return age
}

export const checkMinimumAge = (dob: string | Date | null | undefined): AgeCheckResult => {
   const age = computeAge(dob)
   if (age === null) {
      return {
         age: null,
         ok: false,
         message: 'Necesitamos tu fecha de nacimiento para personalizar tu plan 🌱'
      }
   }
   if (age < 18) {
      return {
         age,
         ok: false,
         message:
            'PulseFit está pensada para mayores de 18. Cuando cumplas esa edad, te esperamos con todo 🌿. Mientras, busca apoyo de un profesional cercano.'
      }
   }
   if (age > 120) {
      return { age, ok: false, message: 'Esa edad no parece correcta, revisa la fecha 🌱' }
   }
   return { age, ok: true, message: null }
}
