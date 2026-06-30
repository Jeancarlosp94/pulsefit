import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
   ItfActivityLevel,
   ItfFitnessLevel,
   ItfGoal,
   ItfSex
} from '@/features/nutrition-engine'

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7

/** Estructura plana persistible: usamos primitivos y arrays simples. */
export interface OnboardingData {
   // Step 1 — consent
   acceptedTerms: boolean
   acceptedPrivacy: boolean

   // Step 2 — objetivo
   goal: ItfGoal | null
   targetWeightKg: number | null
   targetDate: string | null

   // Step 3 — cuerpo
   age: number | null
   dateOfBirth: string | null /* YYYY-MM-DD, fuente de verdad de la edad */
   sex: ItfSex | null
   heightCm: number | null
   currentWeightKg: number | null
   medicalConditions: string[]
   /** Sprint 11.5A: historial de TCA → activa modo intuitivo. */
   eatingDisorderHistory: boolean

   // Step 4 — actividad
   activityLevel: ItfActivityLevel | null
   fitnessLevel: ItfFitnessLevel | null

   // Step 5 — dieta
   cooksAtHome: 'yes' | 'sometimes' | 'rarely' | null
   dietaryRestrictions: string[]
   allergies: string
   dislikedFoods: string[]
   budgetLevel: 'low' | 'medium' | 'high' | null
   /** Patrón alimentario (2-5 comidas/día). Decisión de Lucía. */
   mealsPerDay: 2 | 3 | 4 | 5
   /** Cocinas favoritas (multi-select). El motor prioriza recetas canónicas de estas regiones. */
   favoriteCuisines: string[]
   /** IDs de ingredientes que le gustan (boost en el selector). */
   favoriteIngredientIds: string[]
   /** Sprint 11.6: estilo de vida — preconfigura defaults sensatos. */
   lifestyle:
      | 'estudiante'
      | 'oficinista'
      | 'mama_papa'
      | 'freelance'
      | 'migrante'
      | 'atleta_amateur'
      | null
   /** Sprint 11.6: si true, el pattern-engine no marca "varía más" como problema. */
   monotonousMealsPreferred: boolean

   // Step 6 — horario
   availableDays: number[]
   availableMinutes: number | null
   equipment: string[]
}

const initialData: OnboardingData = {
   acceptedTerms: false,
   acceptedPrivacy: false,

   goal: null,
   targetWeightKg: null,
   targetDate: null,

   age: null,
   dateOfBirth: null,
   sex: null,
   heightCm: null,
   currentWeightKg: null,
   medicalConditions: [],
   eatingDisorderHistory: false,

   activityLevel: null,
   fitnessLevel: null,

   cooksAtHome: null,
   dietaryRestrictions: [],
   allergies: '',
   dislikedFoods: [],
   budgetLevel: null,
   mealsPerDay: 3,
   favoriteCuisines: [],
   favoriteIngredientIds: [],
   lifestyle: null,
   monotonousMealsPreferred: false,

   availableDays: [],
   availableMinutes: null,
   equipment: []
}

interface OnboardingState {
   step: OnboardingStep
   data: OnboardingData

   setStep: (step: OnboardingStep) => void
   next: () => void
   back: () => void
   update: (patch: Partial<OnboardingData>) => void
   reset: () => void
}

/**
 * Store del onboarding. Persiste el progreso para que si el usuario cierra
 * la PWA y vuelve, no pierda lo que avanzó. Se resetea al cerrar Step 7
 * exitosamente (`reset()` después de `updateProfile`).
 */
export const useOnboardingStore = create<OnboardingState>()(
   persist(
      (set, get) => ({
         step: 1,
         data: initialData,
         setStep: (step) => set({ step }),
         next: () => {
            const s = get().step
            if (s < 7) set({ step: (s + 1) as OnboardingStep })
         },
         back: () => {
            const s = get().step
            if (s > 1) set({ step: (s - 1) as OnboardingStep })
         },
         update: (patch) => set({ data: { ...get().data, ...patch } }),
         reset: () => set({ step: 1, data: initialData })
      }),
      {
         name: 'pulsefit-onboarding',
         storage: createJSONStorage(() => localStorage),
         version: 1
      }
   )
)
