import { describe, it, expect } from 'vitest'
import { areIncompatible, filterCarbsForProtein } from './pairing-rules'
import type { ItfIngredient } from './types'

const mk = (name: string, category: ItfIngredient['category']): ItfIngredient => ({
   id: name.toLowerCase().replace(/\s/g, '-'),
   name,
   category,
   kcalPer100g: 100,
   proteinPer100g: 10,
   carbsPer100g: 10,
   fatsPer100g: 5,
   tags: [],
   source: 'manual'
})

describe('Pairing rules — Sprint 11.18', () => {
   it('yogurt + pan = INCOMPATIBLE', () => {
      const yogurt = mk('yogurt griego natural', 'protein')
      const pan = mk('pan integral', 'carb')
      expect(areIncompatible(yogurt, pan)).toBe(true)
   })

   it('yogurt + granola = compatible', () => {
      const yogurt = mk('yogurt griego natural', 'protein')
      const granola = mk('granola sin azúcar', 'carb')
      expect(areIncompatible(yogurt, granola)).toBe(false)
   })

   it('yogurt + avena = compatible', () => {
      const yogurt = mk('yogurt griego natural', 'protein')
      const avena = mk('avena en hojuelas', 'carb')
      expect(areIncompatible(yogurt, avena)).toBe(false)
   })

   it('yogurt con papa/arroz/pasta/tortilla/arepa = INCOMPATIBLE', () => {
      const yogurt = mk('yogurt griego natural', 'protein')
      const badCarbs = [
         'papa cocida',
         'arroz blanco',
         'pasta cocida',
         'tortilla de maíz',
         'arepa de maíz'
      ]
      for (const name of badCarbs) {
         expect(areIncompatible(yogurt, mk(name, 'carb'))).toBe(true)
      }
   })

   it('jamón + granola = INCOMPATIBLE (salado + dulce seco)', () => {
      const jamon = mk('jamón cocido bajo en sodio', 'protein')
      const granola = mk('granola sin azúcar', 'carb')
      expect(areIncompatible(jamon, granola)).toBe(true)
   })

   it('jamón + pan / arepa / papa = compatible', () => {
      const jamon = mk('jamón cocido bajo en sodio', 'protein')
      const okCarbs = ['pan integral', 'arepa de maíz', 'papa cocida']
      for (const name of okCarbs) {
         expect(areIncompatible(jamon, mk(name, 'carb'))).toBe(false)
      }
   })

   it('proteína en polvo + pan = INCOMPATIBLE', () => {
      const polvo = mk('proteína en polvo (whey)', 'protein')
      const pan = mk('pan integral', 'carb')
      expect(areIncompatible(polvo, pan)).toBe(true)
   })

   it('proteína en polvo + avena/banana = compatible', () => {
      const polvo = mk('proteína en polvo (whey)', 'protein')
      expect(areIncompatible(polvo, mk('avena en hojuelas', 'carb'))).toBe(false)
      expect(areIncompatible(polvo, mk('banana', 'carb'))).toBe(false)
   })

   it('lentejas + granola = INCOMPATIBLE', () => {
      const lentejas = mk('lentejas cocidas', 'protein')
      const granola = mk('granola sin azúcar', 'carb')
      expect(areIncompatible(lentejas, granola)).toBe(true)
   })

   it('pescado + granola/avena = INCOMPATIBLE', () => {
      const pescado = mk('filete de tilapia', 'protein')
      expect(areIncompatible(pescado, mk('granola sin azúcar', 'carb'))).toBe(true)
      expect(areIncompatible(pescado, mk('avena en hojuelas', 'carb'))).toBe(true)
   })

   it('pollo + arroz = compatible (no dispara nada)', () => {
      const pollo = mk('pechuga de pollo', 'protein')
      expect(areIncompatible(pollo, mk('arroz blanco cocido', 'carb'))).toBe(false)
   })
})

describe('filterCarbsForProtein — Sprint 11.18', () => {
   it('yogurt filtra pan y deja granola', () => {
      const yogurt = mk('yogurt griego natural', 'protein')
      const carbs = [
         mk('pan integral', 'carb'),
         mk('granola sin azúcar', 'carb'),
         mk('avena', 'carb'),
         mk('papa cocida', 'carb')
      ]
      const filtered = filterCarbsForProtein(yogurt, carbs)
      const names = filtered.map((c) => c.name)
      expect(names).not.toContain('pan integral')
      expect(names).not.toContain('papa cocida')
      expect(names).toContain('granola sin azúcar')
      expect(names).toContain('avena')
   })

   it('jamón filtra granola', () => {
      const jamon = mk('jamón cocido bajo en sodio', 'protein')
      const carbs = [
         mk('granola sin azúcar', 'carb'),
         mk('pan integral', 'carb'),
         mk('arroz blanco', 'carb')
      ]
      const filtered = filterCarbsForProtein(jamon, carbs)
      expect(filtered.map((c) => c.name)).not.toContain('granola sin azúcar')
      expect(filtered.map((c) => c.name)).toContain('pan integral')
   })

   it('si TODOS los carbs son incompatibles, retorna el pool original (fail-open)', () => {
      const yogurt = mk('yogurt griego natural', 'protein')
      const carbs = [mk('pan integral', 'carb'), mk('papa cocida', 'carb')]
      const filtered = filterCarbsForProtein(yogurt, carbs)
      expect(filtered.length).toBe(carbs.length)
   })
})
