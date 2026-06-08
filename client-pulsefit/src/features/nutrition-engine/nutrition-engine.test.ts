import { describe, it, expect } from 'vitest'
import {
   calculateTMB,
   calculateGET,
   calculateTargetKcal,
   distributeMacros,
   validateNutritionPlan,
   calculateHydrationMl,
   shouldRecalculate,
   computeNutritionSummary,
   ACTIVITY_FACTORS,
   SAFETY_LIMITS
} from './index'

describe('calculateTMB (Mifflin-St Jeor)', () => {
   it('hombre 70kg / 175cm / 30 años → ~1649 kcal', () => {
      const tmb = calculateTMB({ weightKg: 70, heightCm: 175, age: 30, sex: 'male' })
      expect(tmb).toBe(1649)
   })

   it('mujer 60kg / 165cm / 28 años → 1330 kcal', () => {
      const tmb = calculateTMB({ weightKg: 60, heightCm: 165, age: 28, sex: 'female' })
      expect(tmb).toBe(1330)
   })

   it('prefer_not_to_say usa el promedio (1485 kcal en 65/170/30)', () => {
      const tmb = calculateTMB({
         weightKg: 65,
         heightCm: 170,
         age: 30,
         sex: 'prefer_not_to_say'
      })
      expect(tmb).toBe(1485)
   })
})

describe('calculateGET (factor de actividad)', () => {
   it('sedentary multiplica por 1.2', () => {
      expect(calculateGET({ tmb: 1500, activityLevel: 'sedentary' })).toBe(1800)
   })

   it('moderate multiplica por 1.55', () => {
      expect(calculateGET({ tmb: 1500, activityLevel: 'moderate' })).toBe(2325)
   })

   it('very_active multiplica por 1.9', () => {
      expect(calculateGET({ tmb: 1500, activityLevel: 'very_active' })).toBe(2850)
   })

   it('los factores están dentro del rango Harris-Benedict', () => {
      Object.values(ACTIVITY_FACTORS).forEach((f) => {
         expect(f).toBeGreaterThanOrEqual(1.2)
         expect(f).toBeLessThanOrEqual(1.9)
      })
   })
})

describe('calculateTargetKcal (déficit/superávit por goal)', () => {
   it('lose aplica déficit ~20%', () => {
      expect(calculateTargetKcal({ getKcal: 2000, goal: 'lose' })).toBe(1600)
   })

   it('gain aplica superávit ~12%', () => {
      expect(calculateTargetKcal({ getKcal: 2000, goal: 'gain' })).toBe(2240)
   })

   it('maintain devuelve el GET intacto', () => {
      expect(calculateTargetKcal({ getKcal: 2000, goal: 'maintain' })).toBe(2000)
   })

   it('feel_better devuelve el GET intacto (no fuerza déficit)', () => {
      expect(calculateTargetKcal({ getKcal: 2000, goal: 'feel_better' })).toBe(2000)
   })
})

describe('distributeMacros', () => {
   it('lose: prioriza proteína a 2.0 g/kg', () => {
      const m = distributeMacros({ totalKcal: 2000, weightKg: 70, goal: 'lose' })
      expect(m.proteinG).toBe(140)
   })

   it('gain: proteína a 1.8 g/kg', () => {
      const m = distributeMacros({ totalKcal: 2500, weightKg: 75, goal: 'gain' })
      expect(m.proteinG).toBe(135)
   })

   it('grasas respetan mínimo de 0.8 g/kg', () => {
      const m = distributeMacros({ totalKcal: 1800, weightKg: 60, goal: 'maintain' })
      const fatsKcal = m.fatsG * 9
      expect(fatsKcal).toBeGreaterThanOrEqual(60 * 0.8 * 9)
   })

   it('carbos cierran el balance sin valores negativos', () => {
      const m = distributeMacros({ totalKcal: 1500, weightKg: 80, goal: 'lose' })
      expect(m.carbsG).toBeGreaterThanOrEqual(0)
      const total = m.proteinG * 4 + m.carbsG * 4 + m.fatsG * 9
      // Tolerancia ±50 kcal por redondeo de cada macro.
      expect(Math.abs(total - m.totalKcal)).toBeLessThanOrEqual(60)
   })
})

describe('validateNutritionPlan (seguridad)', () => {
   const base = {
      sex: 'female' as const,
      currentWeightKg: 70,
      targetWeightKg: 65,
      weeksToGoal: 10
   }

   it('rechaza target debajo del mínimo femenino', () => {
      const r = validateNutritionPlan({ ...base, targetKcal: 1000 })
      expect(r.ok).toBe(false)
      if (!r.ok) {
         expect(r.reason).toBe('kcal_too_low')
         expect(r.suggestedAdjustment?.targetKcal).toBe(SAFETY_LIMITS.MIN_KCAL_FEMALE)
      }
   })

   it('rechaza pérdida mayor a 1% peso/semana y sugiere extender plazo', () => {
      const r = validateNutritionPlan({
         sex: 'male',
         currentWeightKg: 80,
         targetWeightKg: 70,
         weeksToGoal: 4,
         targetKcal: 1800
      })
      expect(r.ok).toBe(false)
      if (!r.ok) {
         expect(r.reason).toBe('loss_too_fast')
         expect(r.suggestedAdjustment?.weeksToGoal).toBeGreaterThanOrEqual(13)
      }
   })

   it('rechaza plazo menor a 2 semanas cuando la pérdida es sostenible', () => {
      // 0.5 kg en 1 semana sobre 80 kg = 0.625 % / sem → no activa loss_too_fast
      // pero sí activa el guard de "plazo corto".
      const r = validateNutritionPlan({
         sex: 'male',
         currentWeightKg: 80,
         targetWeightKg: 79.5,
         weeksToGoal: 1,
         targetKcal: 1800
      })
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.reason).toBe('unrealistic_timeline')
   })

   it('acepta plan razonable de pérdida lenta', () => {
      const r = validateNutritionPlan({
         sex: 'female',
         currentWeightKg: 70,
         targetWeightKg: 65,
         weeksToGoal: 16,
         targetKcal: 1500
      })
      expect(r.ok).toBe(true)
   })

   it('mensajes nunca contienen lenguaje punitivo', () => {
      const r = validateNutritionPlan({ ...base, targetKcal: 800 })
      if (!r.ok) {
         const msg = r.message.toLowerCase()
         expect(msg).not.toMatch(/fallaste|incorrecto|inv[áa]lido|prohibido/)
      }
   })
})

describe('calculateHydrationMl', () => {
   it('80kg → 2800 ml (35 × 80)', () => {
      expect(calculateHydrationMl(80)).toBe(2800)
   })

   it('redondea a múltiplos de 50', () => {
      expect(calculateHydrationMl(63) % 50).toBe(0)
   })

   it('nunca devuelve menos de 1500 ml', () => {
      expect(calculateHydrationMl(30)).toBeGreaterThanOrEqual(1500)
   })
})

describe('shouldRecalculate', () => {
   const baseDate = new Date('2026-01-01T00:00:00Z')
   const baseline = {
      lastWeightKg: 70,
      currentWeightKg: 70,
      lastRecalcAt: baseDate,
      now: new Date('2026-01-15T00:00:00Z'),
      lastActivityLevel: 'moderate' as const,
      currentActivityLevel: 'moderate' as const,
      lastGoal: 'lose' as const,
      currentGoal: 'lose' as const
   }

   it('devuelve none cuando nada cambió', () => {
      expect(shouldRecalculate(baseline)).toBe('none')
   })

   it('detecta cambio de peso ≥ 2 kg', () => {
      expect(shouldRecalculate({ ...baseline, currentWeightKg: 67.9 })).toBe(
         'weight_diff_significant'
      )
   })

   it('detecta paso de 4+ semanas', () => {
      expect(shouldRecalculate({ ...baseline, now: new Date('2026-02-15T00:00:00Z') })).toBe(
         'four_weeks_passed'
      )
   })

   it('detecta cambio de activity_level', () => {
      expect(shouldRecalculate({ ...baseline, currentActivityLevel: 'active' })).toBe(
         'activity_changed'
      )
   })

   it('detecta cambio de goal', () => {
      expect(shouldRecalculate({ ...baseline, currentGoal: 'maintain' })).toBe('goal_changed')
   })
})

describe('computeNutritionSummary (orquestador)', () => {
   it('devuelve resumen coherente para perfil real', () => {
      const summary = computeNutritionSummary({
         weightKg: 70,
         heightCm: 170,
         age: 32,
         sex: 'male',
         activityLevel: 'moderate',
         goal: 'lose'
      })
      expect(summary.tmb).toBeGreaterThan(1000)
      expect(summary.getKcal).toBeGreaterThan(summary.tmb)
      expect(summary.targetKcal).toBeLessThan(summary.getKcal)
      expect(summary.proteinG).toBeGreaterThan(0)
      expect(summary.carbsG).toBeGreaterThanOrEqual(0)
      expect(summary.fatsG).toBeGreaterThan(0)
      expect(summary.hydrationMl).toBeGreaterThanOrEqual(2400)
   })

   it('mismo input → mismo output (función pura)', () => {
      const a = computeNutritionSummary({
         weightKg: 65,
         heightCm: 165,
         age: 28,
         sex: 'female',
         activityLevel: 'light',
         goal: 'maintain'
      })
      const b = computeNutritionSummary({
         weightKg: 65,
         heightCm: 165,
         age: 28,
         sex: 'female',
         activityLevel: 'light',
         goal: 'maintain'
      })
      expect(a).toEqual(b)
   })
})
