import type { OnboardingData } from './onboarding'

/**
 * Sprint 11.8B: defaults inteligentes para el modo rápido.
 *
 * Cuando el usuario activa fastTrack en Step1, saltamos Steps 4, 5, 6
 * aplicando estos defaults sensatos. El usuario puede personalizar más
 * tarde desde Perfil.
 *
 * Razonamiento (firmas Lucía + Carlos):
 *   - activityLevel: 'sedentary' es el más conservador. Subir es más
 *     fácil que bajar (sobreestimar GET → exceso calórico).
 *   - fitnessLevel: 'beginner' es seguro para no recomendar compound
 *     pesados sin contexto.
 *   - cooksAtHome: 'sometimes' es el promedio realista.
 *   - dietaryRestrictions: vacío. Si tiene → reanudará configuración.
 *   - budgetLevel: 'medium' es el más usado.
 *   - mealsPerDay: 3 (clásico).
 *   - favoriteCuisines: [] (sin sesgo).
 *   - availableDays: lunes a viernes (5 días).
 *   - availableMinutes: 30 (mínimo razonable).
 *   - equipment: [] (asumimos cero equipo → bodyweight).
 */
export const FAST_TRACK_DEFAULTS = {
   activityLevel: 'sedentary' as const,
   fitnessLevel: 'beginner' as const,
   cooksAtHome: 'sometimes' as const,
   dietaryRestrictions: [] as string[],
   allergies: '',
   dislikedFoods: [] as string[],
   budgetLevel: 'medium' as const,
   mealsPerDay: 3 as const,
   favoriteCuisines: [] as string[],
   favoriteIngredientIds: [] as string[],
   availableDays: [1, 2, 3, 4, 5] as number[],
   availableMinutes: 30 as number,
   equipment: [] as string[],
   lifestyle: null,
   monotonousMealsPreferred: false
} satisfies Partial<OnboardingData>
