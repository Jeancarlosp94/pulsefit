/**
 * Catálogos para los selects/checkboxes del onboarding. Centralizado para
 * que el copy se mantenga consistente entre pasos y futuras pantallas
 * (perfil, revisión semanal).
 */

import type {
   ItfActivityLevel,
   ItfFitnessLevel,
   ItfGoal,
   ItfSex
} from '@/features/nutrition-engine'

export interface OnboardingOption<T extends string> {
   value: T
   label: string
   description?: string
   emoji?: string
}

export const GOAL_OPTIONS: OnboardingOption<ItfGoal>[] = [
   {
      value: 'lose',
      label: 'Bajar de peso',
      description: 'Con calma, sin pasar hambre.',
      emoji: '🌿'
   },
   {
      value: 'gain',
      label: 'Ganar músculo',
      description: 'Sumar masa, fuerza y energía.',
      emoji: '💪'
   },
   {
      value: 'maintain',
      label: 'Mantenerme',
      description: 'Sostener lo que ya tienes.',
      emoji: '🌱'
   },
   {
      value: 'feel_better',
      label: 'Sentirme mejor',
      description: 'Sin foco en el peso, foco en el bienestar.',
      emoji: '🌊'
   }
]

export const SEX_OPTIONS: OnboardingOption<ItfSex>[] = [
   { value: 'female', label: 'Mujer' },
   { value: 'male', label: 'Hombre' },
   { value: 'prefer_not_to_say', label: 'Prefiero no decirlo' }
]

export const ACTIVITY_OPTIONS: OnboardingOption<ItfActivityLevel>[] = [
   {
      value: 'sedentary',
      label: 'Sedentario',
      description: 'Oficina, sin ejercicio.'
   },
   {
      value: 'light',
      label: 'Ligero',
      description: '1-3 días de ejercicio por semana.'
   },
   {
      value: 'moderate',
      label: 'Moderado',
      description: '3-5 días por semana.'
   },
   {
      value: 'active',
      label: 'Activo',
      description: '6-7 días por semana.'
   },
   {
      value: 'very_active',
      label: 'Muy activo',
      description: 'Atleta o trabajo físico intenso.'
   }
]

export const FITNESS_LEVEL_OPTIONS: OnboardingOption<ItfFitnessLevel>[] = [
   {
      value: 'absolute_beginner',
      label: 'Empiezo desde cero',
      description: 'Nunca o casi nunca he entrenado.'
   },
   {
      value: 'beginner',
      label: 'Principiante',
      description: 'Menos de 1 año entrenando.'
   },
   {
      value: 'intermediate',
      label: 'Intermedio',
      description: '1-3 años de constancia.'
   },
   {
      value: 'advanced',
      label: 'Avanzado',
      description: 'Más de 3 años entrenando.'
   }
]

export const COOKS_AT_HOME_OPTIONS: OnboardingOption<'yes' | 'sometimes' | 'rarely'>[] = [
   { value: 'yes', label: 'Sí, casi siempre' },
   { value: 'sometimes', label: 'A veces' },
   { value: 'rarely', label: 'Casi nunca' }
]

export const BUDGET_OPTIONS: OnboardingOption<'low' | 'medium' | 'high'>[] = [
   {
      value: 'low',
      label: 'Ajustado',
      description: 'Priorizar básicos: huevos, arroz, plátano…'
   },
   {
      value: 'medium',
      label: 'Normal',
      description: 'Variedad razonable, mercado promedio.'
   },
   {
      value: 'high',
      label: 'Holgado',
      description: 'Sin restricciones de presupuesto.'
   }
]

export const DIETARY_RESTRICTIONS: OnboardingOption<string>[] = [
   { value: 'vegetarian', label: 'Vegetariana' },
   { value: 'vegan', label: 'Vegana' },
   { value: 'pescatarian', label: 'Pescetariana' },
   { value: 'gluten_free', label: 'Sin gluten' },
   { value: 'lactose_free', label: 'Sin lactosa' },
   { value: 'kosher', label: 'Kosher' },
   { value: 'halal', label: 'Halal' }
]

export const EQUIPMENT_OPTIONS: OnboardingOption<string>[] = [
   { value: 'none', label: 'Solo mi cuerpo' },
   { value: 'dumbbells', label: 'Mancuernas' },
   { value: 'bands', label: 'Bandas elásticas' },
   { value: 'kettlebell', label: 'Pesa rusa' },
   { value: 'pullup_bar', label: 'Barra de dominadas' },
   { value: 'bench', label: 'Banco' },
   { value: 'gym_full', label: 'Gimnasio completo' }
]

export const MEDICAL_CONDITIONS: OnboardingOption<string>[] = [
   { value: 'none', label: 'Ninguna' },
   { value: 'hypertension', label: 'Hipertensión' },
   { value: 'diabetes', label: 'Diabetes' },
   { value: 'heart', label: 'Problema cardíaco' },
   { value: 'joint', label: 'Problema articular' },
   { value: 'spine', label: 'Problema de columna' },
   { value: 'thyroid', label: 'Tiroides' },
   { value: 'pregnancy', label: 'Embarazo / postparto' }
]

/** Etiquetas de los días de la semana (0=Domingo, 6=Sábado, ISO-friendly para el motor). */
export const WEEK_DAYS: { value: number; short: string; long: string }[] = [
   { value: 1, short: 'L', long: 'Lunes' },
   { value: 2, short: 'M', long: 'Martes' },
   { value: 3, short: 'X', long: 'Miércoles' },
   { value: 4, short: 'J', long: 'Jueves' },
   { value: 5, short: 'V', long: 'Viernes' },
   { value: 6, short: 'S', long: 'Sábado' },
   { value: 0, short: 'D', long: 'Domingo' }
]
