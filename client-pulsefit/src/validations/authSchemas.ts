import { z } from 'zod'

/**
 * Esquemas zod para los formularios de auth. Mensajes en español,
 * compasivos: nada de "ingresa un email válido" seco — siempre invitamos.
 */

export const emailField = z
   .string({ required_error: 'Necesitamos tu correo para encontrarte 🌱' })
   .min(1, { message: 'Necesitamos tu correo para encontrarte 🌱' })
   .email({ message: 'Revisa el correo, parece estar incompleto' })

export const passwordField = z
   .string({ required_error: 'Falta tu contraseña' })
   .min(8, { message: 'Mínimo 8 caracteres, así estamos más seguros' })
   .max(72, { message: 'Probemos con una contraseña un poco más corta' })

export const loginSchema = z.object({
   email: emailField,
   password: z
      .string({ required_error: 'Falta tu contraseña' })
      .min(1, { message: 'Falta tu contraseña' })
})

export const registerSchema = z
   .object({
      name: z
         .string()
         .trim()
         .min(2, { message: '¿Cómo te llamamos?' })
         .max(80, { message: 'Probemos con un nombre un poco más corto' })
         .optional()
         .or(z.literal('')),
      email: emailField,
      password: passwordField,
      passwordConfirm: z.string().min(1, { message: 'Confirmemos tu contraseña' }),
      acceptedTerms: z.boolean().refine((v) => v === true, {
         message: 'Necesitamos que aceptes los términos para continuar'
      })
   })
   .refine((data) => data.password === data.passwordConfirm, {
      path: ['passwordConfirm'],
      message: 'Las contraseñas no coinciden, probemos otra vez'
   })

export const forgotPasswordSchema = z.object({
   email: emailField
})

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
