import { describe, it, expect } from 'vitest'
import type {
   ItfActivityType,
   ItfLogActivityInput,
   ItfLogSetInput,
   ItfWorkoutLog
} from './itfWorkouts'

describe('itfWorkouts — Sprint 11.7 activity types', () => {
   it('ItfActivityType acepta los 5 tipos esperados', () => {
      const validTypes: ItfActivityType[] = ['strength', 'cardio', 'sport', 'dance', 'movement']
      expect(validTypes.length).toBe(5)
   })

   it('ItfLogActivityInput requiere activity_name + duration_min + intensity', () => {
      const valid: ItfLogActivityInput = {
         activity_type: 'sport',
         activity_name: 'Fútbol',
         duration_min: 90,
         intensity: 4
      }
      expect(valid.activity_name).toBe('Fútbol')
      expect(valid.duration_min).toBe(90)
      expect(valid.intensity).toBeGreaterThanOrEqual(1)
      expect(valid.intensity).toBeLessThanOrEqual(5)
   })

   it('ItfLogSetInput sigue siendo compatible con strength', () => {
      const valid: ItfLogSetInput = {
         exercise_id: 'squat',
         exercise_name: 'Sentadilla',
         sets_completed: 3,
         reps_completed: 8,
         weight_kg: 60,
         rpe_actual: 7
      }
      expect(valid.exercise_id).toBe('squat')
   })

   it('ItfWorkoutLog soporta strength con nullable activity_name/duration', () => {
      const strengthLog: ItfWorkoutLog = {
         id: '1',
         user_id: 'u',
         logged_at: '2026-06-29T00:00:00Z',
         activity_type: 'strength',
         exercise_id: 'squat',
         exercise_name: 'Sentadilla',
         sets_completed: 3,
         reps_completed: 8,
         weight_kg: 60,
         rpe_actual: 7,
         activity_name: null,
         duration_min: null,
         intensity: null,
         notes: null,
         session_id: null,
         calories_burned: null,
         workout_subtype: null,
         perceived_effort: null
      }
      expect(strengthLog.activity_type).toBe('strength')
      expect(strengthLog.duration_min).toBe(null)
   })

   it('ItfWorkoutLog soporta sport con nullable exercise_id/sets', () => {
      const sportLog: ItfWorkoutLog = {
         id: '2',
         user_id: 'u',
         logged_at: '2026-06-29T00:00:00Z',
         activity_type: 'sport',
         exercise_id: null,
         exercise_name: null,
         sets_completed: null,
         reps_completed: null,
         weight_kg: null,
         rpe_actual: null,
         activity_name: 'Fútbol',
         duration_min: 90,
         intensity: 4,
         notes: 'Cancha 7 con amigos',
         session_id: null,
         calories_burned: null,
         workout_subtype: null,
         perceived_effort: null
      }
      expect(sportLog.activity_type).toBe('sport')
      expect(sportLog.exercise_id).toBe(null)
      expect(sportLog.activity_name).toBe('Fútbol')
   })
})
