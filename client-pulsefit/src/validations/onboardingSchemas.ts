import { z } from 'zod'

/**
 * Esquemas zod del onboarding (7 steps). Todos los mensajes en español,
 * compasivos. Ningún campo dice "obligatorio" — usamos "necesitamos saber".
 */

// Step 1 — Términos y privacidad
export const step1Schema = z.object({
   acceptedTerms: z.boolean().refine((v) => v === true, {
      message: 'Necesitamos que aceptes los términos para continuar'
   }),
   acceptedPrivacy: z.boolean().refine((v) => v === true, {
      message: 'Necesitamos que aceptes la política de privacidad'
   })
})

// Step 2 — Objetivo
export const step2Schema = z
   .object({
      goal: z.enum(['lose', 'gain', 'maintain', 'feel_better'], {
         required_error: '¿Qué te gustaría lograr?'
      }),
      targetWeightKg: z
         .number({
            invalid_type_error: 'Necesitamos un peso meta'
         })
         .min(30, { message: 'Revisa el peso meta, parece muy bajo' })
         .max(300, { message: 'Revisa el peso meta, parece muy alto' })
         .optional(),
      targetDate: z.string().optional()
   })
   .superRefine((data, ctx) => {
      // Si el objetivo es perder o ganar, el peso meta y la fecha son necesarios.
      if (data.goal === 'lose' || data.goal === 'gain') {
         if (!data.targetWeightKg) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               path: ['targetWeightKg'],
               message: '¿Qué peso quieres alcanzar?'
            })
         }
         if (!data.targetDate) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               path: ['targetDate'],
               message: '¿Para cuándo te gustaría?'
            })
         }
      }
   })

// Step 3 — Cuerpo + médico
export const step3Schema = z.object({
   age: z
      .number({ invalid_type_error: 'Cuéntanos tu edad' })
      .min(13, { message: 'Necesitas tener al menos 13 años' })
      .max(120, { message: 'Revisa la edad, parece fuera de rango' }),
   sex: z.enum(['male', 'female', 'prefer_not_to_say'], {
      required_error: 'Selecciona una opción'
   }),
   heightCm: z
      .number({ invalid_type_error: '¿Cuánto mides?' })
      .min(100, { message: 'Revisa la altura' })
      .max(250, { message: 'Revisa la altura' }),
   currentWeightKg: z
      .number({ invalid_type_error: '¿Cuánto pesas hoy?' })
      .min(30, { message: 'Revisa el peso' })
      .max(300, { message: 'Revisa el peso' }),
   medicalConditions: z.array(z.string()).default([])
})

// Step 4 — Actividad
export const step4Schema = z.object({
   activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active'], {
      required_error: '¿Cuánto te mueves en el día?'
   }),
   fitnessLevel: z.enum(['absolute_beginner', 'beginner', 'intermediate', 'advanced'], {
      required_error: '¿Cuánta experiencia tienes entrenando?'
   })
})

// Step 5 — Dieta
export const step5Schema = z.object({
   cooksAtHome: z.enum(['yes', 'sometimes', 'rarely'], {
      required_error: '¿Cocinas en casa?'
   }),
   dietaryRestrictions: z.array(z.string()).default([]),
   allergies: z
      .string()
      .max(500, { message: 'Probemos con un texto más corto' })
      .optional()
      .or(z.literal('')),
   dislikedFoods: z.array(z.string()).default([]),
   budgetLevel: z.enum(['low', 'medium', 'high'], {
      required_error: '¿Cómo está el presupuesto?'
   }),
   /* Validación de Lucía: 2-5 comidas, default 3 (más sano y universal). */
   mealsPerDay: z
      .number({ required_error: '¿Cuántas comidas haces al día?' })
      .int()
      .min(2, { message: 'Mínimo 2 comidas al día' })
      .max(5, { message: 'Máximo 5 comidas al día' })
      .default(3),
   /* Gustos personales (opcionales). */
   favoriteCuisines: z.array(z.string()).default([]),
   favoriteIngredientIds: z.array(z.string()).default([])
})

// Step 6 — Horario
export const step6Schema = z.object({
   availableDays: z.array(z.number().min(0).max(6)).min(1, { message: 'Elige al menos un día' }),
   availableMinutes: z
      .number({ invalid_type_error: '¿Cuánto tiempo por sesión?' })
      .min(10, { message: 'Mínimo 10 minutos' })
      .max(180, { message: 'Máximo 180 minutos' }),
   equipment: z.array(z.string()).default([])
})

// Step 7 — Confirmación (sin input, solo flag)
export const step7Schema = z.object({
   confirmed: z.boolean().refine((v) => v === true, {
      message: 'Confirma para terminar 🌱'
   })
})

export type Step1Values = z.infer<typeof step1Schema>
export type Step2Values = z.infer<typeof step2Schema>
export type Step3Values = z.infer<typeof step3Schema>
export type Step4Values = z.infer<typeof step4Schema>
export type Step5Values = z.infer<typeof step5Schema>
export type Step6Values = z.infer<typeof step6Schema>
export type Step7Values = z.infer<typeof step7Schema>
