import { describe, it, expect } from 'vitest'
import { detectAllPatterns } from './detectors'

describe('pattern-engine — monotonía consciente (Sprint 11.6)', () => {
   const makeMealsWithFrequentSubs = (recipe: string, count: number) =>
      Array.from({ length: count }, (_, i) => ({
         logged_at: `2026-06-${String(10 + i).padStart(2, '0')}T12:00:00`,
         status: 'substituted',
         meal_type: 'lunch',
         recipe_name: recipe
      }))

   it('detecta frequently_substituted por default (sin flag)', () => {
      const patterns = detectAllPatterns({
         meals: makeMealsWithFrequentSubs('Pollo al curry', 5),
         workouts: [],
         moods: [],
         water: [],
         rescues: []
      })
      const fs = patterns.filter((p) => p.type === 'frequently_substituted')
      expect(fs.length).toBeGreaterThan(0)
   })

   it('NO detecta frequently_substituted si monotonous_meals_preferred=true', () => {
      const patterns = detectAllPatterns({
         meals: makeMealsWithFrequentSubs('Pollo al curry', 5),
         workouts: [],
         moods: [],
         water: [],
         rescues: [],
         monotonous_meals_preferred: true
      })
      const fs = patterns.filter((p) => p.type === 'frequently_substituted')
      expect(fs.length).toBe(0)
   })

   it('NO detecta struggles_with_meals con monotonía si skips son altos pero consciente', () => {
      const meals = [
         ...Array.from({ length: 6 }, (_, i) => ({
            logged_at: `2026-06-${String(10 + i).padStart(2, '0')}T08:00:00`,
            status: 'skipped',
            meal_type: 'breakfast',
            recipe_name: 'Avena'
         })),
         ...Array.from({ length: 6 }, (_, i) => ({
            logged_at: `2026-06-${String(10 + i).padStart(2, '0')}T12:00:00`,
            status: 'planned',
            meal_type: 'lunch',
            recipe_name: 'Pollo'
         }))
      ]
      const withFlag = detectAllPatterns({
         meals,
         workouts: [],
         moods: [],
         water: [],
         rescues: [],
         monotonous_meals_preferred: true
      })
      expect(withFlag.filter((p) => p.type === 'struggles_with_meals')).toHaveLength(0)

      const withoutFlag = detectAllPatterns({
         meals,
         workouts: [],
         moods: [],
         water: [],
         rescues: []
      })
      expect(withoutFlag.filter((p) => p.type === 'struggles_with_meals').length).toBeGreaterThan(0)
   })

   it('respeta otras detecciones (mood, hydration) aunque monotonous=true', () => {
      const patterns = detectAllPatterns({
         meals: [],
         workouts: [],
         moods: [
            { log_date: '2026-06-29', mood_level: 1, energy_level: 1 },
            { log_date: '2026-06-28', mood_level: 2, energy_level: 2 },
            { log_date: '2026-06-27', mood_level: 1, energy_level: 1 }
         ],
         water: [],
         rescues: [],
         monotonous_meals_preferred: true
      })
      expect(patterns.filter((p) => p.type === 'persistent_low_mood').length).toBeGreaterThan(0)
   })
})
