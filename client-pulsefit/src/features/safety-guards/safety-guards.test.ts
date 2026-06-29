import { describe, it, expect } from 'vitest'
import {
   checkImcVsGoal,
   checkMinimumAge,
   checkMoodHealth,
   computeAge,
   computeImc,
   getResourcesForCountry
} from './index'

describe('age-guard', () => {
   it('rechaza menores de 18', () => {
      const dob = new Date()
      dob.setFullYear(dob.getFullYear() - 17)
      const result = checkMinimumAge(dob)
      expect(result.ok).toBe(false)
      expect(result.age).toBe(17)
   })

   it('acepta mayores de 18', () => {
      const dob = new Date()
      dob.setFullYear(dob.getFullYear() - 25)
      const result = checkMinimumAge(dob)
      expect(result.ok).toBe(true)
      expect(result.age).toBe(25)
   })

   it('rechaza DOB inválido o ausente', () => {
      expect(checkMinimumAge(null).ok).toBe(false)
      expect(checkMinimumAge('').ok).toBe(false)
   })

   it('rechaza edades imposibles', () => {
      const dob = new Date()
      dob.setFullYear(dob.getFullYear() - 200)
      expect(checkMinimumAge(dob).ok).toBe(false)
   })

   it('computeAge ajusta por mes/día actual', () => {
      const future = new Date()
      future.setFullYear(future.getFullYear() - 18)
      future.setDate(future.getDate() + 1) /* cumple mañana */
      expect(computeAge(future)).toBe(17)
   })
})

describe('imc-guard', () => {
   it('bloquea underweight con goal=lose', () => {
      const r = checkImcVsGoal(45, 165, 'lose')
      expect(r.ok).toBe(false)
      expect(r.blockMessage).toContain('rango saludable')
      expect(r.category).toBe('underweight')
   })

   it('bloquea obesidad clase III con goal=gain', () => {
      const r = checkImcVsGoal(120, 165, 'gain')
      expect(r.ok).toBe(false)
      expect(r.blockMessage).toContain('cardiovascular')
   })

   it('advierte normal weight con goal=lose', () => {
      const r = checkImcVsGoal(60, 165, 'lose')
      expect(r.ok).toBe(true)
      expect(r.adviceMessage).toBeTruthy()
      expect(r.category).toBe('normal')
   })

   it('advierte obesidad con goal=maintain', () => {
      const r = checkImcVsGoal(110, 165, 'maintain')
      expect(r.ok).toBe(true)
      expect(r.adviceMessage).toContain('cardiovascular')
   })

   it('permite obese_1 con goal=lose sin bloqueo', () => {
      const r = checkImcVsGoal(95, 170, 'lose')
      expect(r.ok).toBe(true)
      expect(r.category).toBe('obese_1')
   })

   it('computeImc devuelve null para inputs inválidos', () => {
      expect(computeImc(0, 165)).toBe(0)
      expect(computeImc(70, 0)).toBe(null)
      expect(computeImc(NaN, 165)).toBe(null)
   })
})

describe('mood-monitor', () => {
   const daysAgo = (n: number) => {
      const d = new Date()
      d.setDate(d.getDate() - n)
      return d.toISOString().slice(0, 10)
   }

   it('escala high con 3 días consecutivos de mood ≤ 2', () => {
      const r = checkMoodHealth({
         recent_moods: [
            { log_date: daysAgo(0), mood_level: 1, energy_level: 2 },
            { log_date: daysAgo(1), mood_level: 2, energy_level: 2 },
            { log_date: daysAgo(2), mood_level: 1, energy_level: 1 }
         ],
         eating_disorder_history: false
      })
      expect(r.severity).toBe('high')
   })

   it('escala medium con 5 registros y avg ≤ 2.5', () => {
      const r = checkMoodHealth({
         recent_moods: [
            { log_date: daysAgo(0), mood_level: 2, energy_level: 3 },
            { log_date: daysAgo(1), mood_level: 3, energy_level: 2 },
            { log_date: daysAgo(2), mood_level: 2, energy_level: 2 },
            { log_date: daysAgo(3), mood_level: 2, energy_level: 3 },
            { log_date: daysAgo(4), mood_level: 3, energy_level: 3 }
         ],
         eating_disorder_history: false
      })
      expect(r.severity).toBe('medium')
   })

   it('TCA history baja el umbral a 2.5/2 días', () => {
      const r = checkMoodHealth({
         recent_moods: [
            { log_date: daysAgo(0), mood_level: 2, energy_level: 3 },
            { log_date: daysAgo(1), mood_level: 3, energy_level: 3 }
         ],
         eating_disorder_history: true
      })
      expect(r.severity).toBe('high')
   })

   it('no alerta cuando mood está saludable', () => {
      const r = checkMoodHealth({
         recent_moods: [
            { log_date: daysAgo(0), mood_level: 4, energy_level: 4 },
            { log_date: daysAgo(1), mood_level: 5, energy_level: 4 },
            { log_date: daysAgo(2), mood_level: 4, energy_level: 4 }
         ],
         eating_disorder_history: false
      })
      expect(r.severity).toBe(null)
   })

   it('no escala high si los 3 días no son consecutivos', () => {
      const r = checkMoodHealth({
         recent_moods: [
            { log_date: daysAgo(0), mood_level: 1, energy_level: 1 },
            { log_date: daysAgo(2), mood_level: 1, energy_level: 1 },
            { log_date: daysAgo(5), mood_level: 1, energy_level: 1 }
         ],
         eating_disorder_history: false
      })
      expect(r.severity).toBe(null)
   })
})

describe('professional-resources', () => {
   it('devuelve recursos del país', () => {
      const r = getResourcesForCountry('EC')
      expect(r.country_code).toBe('EC')
      expect(r.resources.length).toBeGreaterThan(0)
   })

   it('default si no hay país', () => {
      const r = getResourcesForCountry(null)
      expect(r.country_code).toBe('default')
   })

   it('default si país desconocido', () => {
      const r = getResourcesForCountry('ZZ')
      expect(r.country_code).toBe('default')
   })

   it('normaliza el código a uppercase', () => {
      const r = getResourcesForCountry('mx')
      expect(r.country_code).toBe('MX')
   })

   it('crisis lines son 24/7 y gratis', () => {
      const r = getResourcesForCountry('PE')
      const crisis = r.resources.filter((res) => res.type === 'crisis_line')
      expect(crisis.length).toBeGreaterThan(0)
      crisis.forEach((res) => {
         expect(res.hours).toBe('24/7')
         expect(res.cost).toBe('free')
      })
   })
})
