import { describe, it, expect } from 'vitest'

/** Smoke test: verifica que Vitest está bien configurado. */
describe('vitest setup', () => {
   it('puede ejecutar tests', () => {
      expect(1 + 1).toBe(2)
   })

   it('reconoce el entorno jsdom', () => {
      expect(typeof window).toBe('object')
      expect(typeof document).toBe('object')
   })
})
