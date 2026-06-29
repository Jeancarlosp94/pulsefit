import { describe, it, expect } from 'vitest'
import { validateDietaryConsistency } from './dietary-validator'

describe('dietary-validator', () => {
   it('valida OK sin restricciones', () => {
      const r = validateDietaryConsistency(
         { name: 'Tortilla de huevo', steps: ['Bate los huevos', 'Cocina con mantequilla'] },
         []
      )
      expect(r.valid).toBe(true)
   })

   it('rechaza vegan con huevo en steps', () => {
      const r = validateDietaryConsistency(
         { name: 'Bowl integral', steps: ['Cocina los huevos al gusto', 'Sirve con palta'] },
         ['vegan']
      )
      expect(r.valid).toBe(false)
      expect(r.restriction).toBe('vegan')
      expect(r.offending_word).toMatch(/huevo/i)
      expect(r.location).toBe('step')
   })

   it('rechaza vegan con queso en name', () => {
      const r = validateDietaryConsistency(
         { name: 'Pasta con queso', steps: ['Hervir pasta', 'Mezclar con verduras'] },
         ['vegan']
      )
      expect(r.valid).toBe(false)
      expect(r.location).toBe('name')
   })

   it('rechaza vegetarian con pollo', () => {
      const r = validateDietaryConsistency(
         { name: 'Bowl de pollo', steps: ['Cocina el pollo a la plancha'] },
         ['vegetarian']
      )
      expect(r.valid).toBe(false)
      expect(r.restriction).toBe('vegetarian')
   })

   it('vegetarian acepta huevo y lácteos', () => {
      const r = validateDietaryConsistency(
         { name: 'Tortilla con queso', steps: ['Bate huevos', 'Agrega queso'] },
         ['vegetarian']
      )
      expect(r.valid).toBe(true)
   })

   it('pescatarian acepta pescado pero no carne', () => {
      const r1 = validateDietaryConsistency(
         { name: 'Salmón al horno', steps: ['Marinar el salmón'] },
         ['pescatarian']
      )
      expect(r1.valid).toBe(true)

      const r2 = validateDietaryConsistency(
         { name: 'Bowl', steps: ['Saltear la carne con cebolla'] },
         ['pescatarian']
      )
      expect(r2.valid).toBe(false)
   })

   it('gluten_free rechaza pasta', () => {
      const r = validateDietaryConsistency(
         { name: 'Bowl saludable', steps: ['Cocer la pasta al dente'] },
         ['gluten_free']
      )
      expect(r.valid).toBe(false)
   })

   it('lactose_free rechaza leche', () => {
      const r = validateDietaryConsistency(
         { name: 'Smoothie', steps: ['Licuar con leche', 'Servir frío'] },
         ['lactose_free']
      )
      expect(r.valid).toBe(false)
   })

   it('normaliza tildes para no fallar', () => {
      const r = validateDietaryConsistency(
         { name: 'Plato con jamón', steps: ['Saltear el jamón'] },
         ['vegan']
      )
      expect(r.valid).toBe(false)
   })

   it('soporta múltiples restricciones (vegan + gluten_free)', () => {
      const r = validateDietaryConsistency(
         { name: 'Pasta con tofu', steps: ['Cocer pasta', 'Saltear tofu'] },
         ['vegan', 'gluten_free']
      )
      expect(r.valid).toBe(false)
      expect(r.restriction).toBe('gluten_free')
   })

   it('no hace match parcial dentro de palabra completa', () => {
      /* "atún" no debe matchear "atuna" o palabras compuestas. */
      const r = validateDietaryConsistency(
         { name: 'Plato natural', steps: ['naturalmente fresco'] },
         ['vegan']
      )
      expect(r.valid).toBe(true)
   })
})
