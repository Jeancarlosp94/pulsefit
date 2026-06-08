import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, forgotPasswordSchema } from './authSchemas'

describe('loginSchema', () => {
   it('acepta credenciales válidas', () => {
      const result = loginSchema.safeParse({
         email: 'roberto@example.com',
         password: 'algoSegura'
      })
      expect(result.success).toBe(true)
   })

   it('rechaza email vacío con mensaje compasivo', () => {
      const result = loginSchema.safeParse({ email: '', password: 'pwd1234567' })
      expect(result.success).toBe(false)
      if (!result.success) {
         expect(result.error.issues[0].message).toMatch(/correo/i)
      }
   })

   it('rechaza email inválido sin tono punitivo', () => {
      const result = loginSchema.safeParse({
         email: 'no-es-email',
         password: 'pwd1234567'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
         const msg = result.error.issues[0].message.toLowerCase()
         /* Cero "fallaste"/"error"/"incorrecto". */
         expect(msg).not.toMatch(/fallaste|incorrecto|inv[áa]lido/)
      }
   })
})

describe('registerSchema', () => {
   const valid = {
      name: 'Roberto',
      email: 'r@example.com',
      password: '12345678',
      passwordConfirm: '12345678',
      acceptedTerms: true
   }

   it('acepta payload válido', () => {
      expect(registerSchema.safeParse(valid).success).toBe(true)
   })

   it('exige aceptación de términos', () => {
      const r = registerSchema.safeParse({ ...valid, acceptedTerms: false })
      expect(r.success).toBe(false)
   })

   it('detecta passwords que no coinciden', () => {
      const r = registerSchema.safeParse({ ...valid, passwordConfirm: 'otraotra' })
      expect(r.success).toBe(false)
      if (!r.success) {
         expect(r.error.issues[0].path).toContain('passwordConfirm')
      }
   })

   it('rechaza password muy corta', () => {
      const r = registerSchema.safeParse({
         ...valid,
         password: '123',
         passwordConfirm: '123'
      })
      expect(r.success).toBe(false)
   })
})

describe('forgotPasswordSchema', () => {
   it('acepta email válido', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'a@b.co' }).success).toBe(true)
   })

   it('rechaza email vacío', () => {
      expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false)
   })
})
