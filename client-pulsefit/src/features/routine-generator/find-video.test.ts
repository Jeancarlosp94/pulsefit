import { describe, it, expect } from 'vitest'
import { findVideoUrlForExercise } from './find-video'

describe('findVideoUrlForExercise', () => {
   it('match exacto del nombre devuelve la URL', () => {
      const url = findVideoUrlForExercise('Sentadilla con peso corporal')
      expect(url).toMatch(/youtube\.com/)
   })

   it('match case-insensitive', () => {
      const url = findVideoUrlForExercise('SENTADILLA CON PESO CORPORAL')
      expect(url).toMatch(/youtube\.com/)
   })

   it('match sin acentos', () => {
      const url = findVideoUrlForExercise('plancha lateral')
      expect(url).toMatch(/youtube\.com/)
   })

   it('match fuzzy "kettlebell swing" → kb-swing', () => {
      const url = findVideoUrlForExercise('Kettlebell swing ruso')
      expect(url).toMatch(/youtube\.com/)
   })

   it('ejercicio desconocido devuelve undefined', () => {
      const url = findVideoUrlForExercise('Levitación cuántica')
      expect(url).toBeUndefined()
   })

   it('cadena vacía devuelve undefined', () => {
      const url = findVideoUrlForExercise('')
      expect(url).toBeUndefined()
   })

   it('cobertura: los nuevos ejercicios del Sprint 2.2 tienen video', () => {
      const expected = [
         'Sentadilla búlgara',
         'Kettlebell swing ruso',
         'Hip thrust con mancuerna',
         'Face-pull',
         'Pull-apart con banda',
         'Dead bug',
         'Bird dog',
         'Plancha lateral',
         'Curl de bíceps con mancuernas'
      ]
      for (const name of expected) {
         const url = findVideoUrlForExercise(name)
         expect(url, `falta video para "${name}"`).toMatch(/youtube\.com/)
      }
   })
})
