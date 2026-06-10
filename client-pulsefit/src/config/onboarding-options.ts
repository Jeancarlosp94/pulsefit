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

/** Patrones alimentarios validados por Lucía (files/formulas-nutricion.md). */
export const MEALS_PER_DAY_OPTIONS: OnboardingOption<string>[] = [
   {
      value: '2',
      label: '2 comidas',
      description: 'Ayuno intermitente (16:8). Almuerzo + cena.',
      emoji: '🌅'
   },
   {
      value: '3',
      label: '3 comidas',
      description: 'Patrón clásico. Desayuno + almuerzo + cena.',
      emoji: '🌱'
   },
   {
      value: '4',
      label: '4 comidas',
      description: '+ snack media tarde para más saciedad.',
      emoji: '☕'
   },
   {
      value: '5',
      label: '5 comidas',
      description: 'Atletas / hipertrofia. Distribuye proteína al máximo.',
      emoji: '💪'
   }
]

/** Cocinas favoritas (Step 5.5, multi-select). Validadas por Diego. */
export const CUISINE_OPTIONS: OnboardingOption<string>[] = [
   {
      value: 'andina',
      label: 'Andina',
      description: 'Perú, Ecuador, Colombia, Venezuela: ceviche, ajiaco, arepa, lomo saltado.',
      emoji: '🇵🇪'
   },
   {
      value: 'mexicana',
      label: 'Mexicana',
      description: 'Chilaquiles, tinga, tacos, huevos rancheros.',
      emoji: '🇲🇽'
   },
   {
      value: 'cono_sur',
      label: 'Cono Sur',
      description: 'Argentina, Chile, Uruguay: milanesa, parrilla, guisos, tortilla.',
      emoji: '🇦🇷'
   },
   {
      value: 'brasilena',
      label: 'Brasileña',
      description: 'Feijoada, moqueca, frango grelhado, tapioca.',
      emoji: '🇧🇷'
   },
   {
      value: 'asiatica',
      label: 'Asiática',
      description: 'Teriyaki, salteado al wok, bowls con tofu.',
      emoji: '🌏'
   },
   {
      value: 'mediterranea',
      label: 'Mediterránea',
      description: 'Pastas, ensaladas, salmón, frittata.',
      emoji: '🌊'
   }
]

/** Ingredientes destacados para chips del Step 5.5 (no exhaustivo, son atajos). */
export const FAVORITE_INGREDIENT_SUGGESTIONS = [
   { id: 'chicken-breast', label: 'pollo' },
   { id: 'eggs', label: 'huevos' },
   { id: 'beef-lean', label: 'carne magra' },
   { id: 'fish-tilapia', label: 'pescado blanco' },
   { id: 'tuna-can', label: 'atún en lata' },
   { id: 'shrimp', label: 'camarones' },
   { id: 'lentils-cooked', label: 'lentejas' },
   { id: 'black-beans', label: 'frijoles' },
   { id: 'greek-yogurt', label: 'yogurt griego' },
   { id: 'queso-fresco', label: 'queso fresco' },
   { id: 'rice-white', label: 'arroz' },
   { id: 'potato', label: 'papa' },
   { id: 'sweet-potato', label: 'camote' },
   { id: 'plantain', label: 'plátano maduro' },
   { id: 'arepa-blanca', label: 'arepa' },
   { id: 'tortilla-maiz', label: 'tortilla' },
   { id: 'pasta-cooked', label: 'pasta' },
   { id: 'oats', label: 'avena' },
   { id: 'quinoa', label: 'quinua' },
   { id: 'bread-whole', label: 'pan integral' },
   { id: 'avocado', label: 'aguacate' },
   { id: 'peanut-butter', label: 'mantequilla de maní' },
   { id: 'broccoli', label: 'brócoli' },
   { id: 'spinach', label: 'espinaca' },
   { id: 'tomato', label: 'tomate' },
   { id: 'banana', label: 'banana' },
   { id: 'apple', label: 'manzana' },
   { id: 'mango', label: 'mango' }
] as const

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
