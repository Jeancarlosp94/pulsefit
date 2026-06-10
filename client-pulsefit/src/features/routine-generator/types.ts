/**
 * Tipos del generador híbrido de rutinas (Fase 6).
 * Source of truth: files/generadores-hibridos.md secciones 5-7 + files/reglas-fitness.md.
 */

import type { ItfActivityLevel, ItfFitnessLevel } from '@/features/nutrition-engine'

export type ItfSessionFocus = 'full_body' | 'upper' | 'lower' | 'push' | 'pull' | 'legs' | 'core'

export type ItfExercisePattern =
   | 'squat'
   | 'hinge'
   | 'push_horizontal'
   | 'push_vertical'
   | 'pull_horizontal'
   | 'pull_vertical'
   | 'lunge'
   | 'core'
   | 'carry'

export type ItfExerciseDifficulty =
   | 'beginner'
   | 'intermediate'
   | 'advanced'
   /** ejercicios extra prohibidos para principiantes absolutos. */
   | 'forbidden_absolute_beginner'

export interface ItfExercise {
   id: string
   name: string
   pattern: ItfExercisePattern
   muscleGroups: string[]
   equipmentRequired: string[] // intersección con perfil.equipment
   difficulty: ItfExerciseDifficulty
   /** Zonas potencialmente afectadas si hay lesión: lumbar, rodilla, hombro, etc. */
   affectedZones: string[]
   description: string
   formTips: string[]
   alternatives: string[] // ids de ejercicios alternativos
   isCompound: boolean
   /** YouTube URL curada por Carlos. Demuestra la técnica correcta.
    * Canales preferidos: FitnessFAQs, Jeff Nippard, AthleanX, Squat University. */
   videoUrl?: string
}

export interface ItfPrescribedExercise {
   exerciseId: string
   name: string
   sets: number
   /** Reps en formato libre porque puede ser "10" o "30 segundos" o "10 por lado". */
   reps: string
   restSec: number
   /** RPE objetivo de Lucía/Carlos (6-7 principiantes, 7-8 intermedios). */
   prescribedRpe: number
   isCompound: boolean
   /** Categoría de orden: warmup → compound → accessory → core → cooldown. */
   orderCategory: 'compound' | 'accessory' | 'core'
}

export interface ItfWarmup {
   duration_min: number
   movements: string[]
}

export interface ItfCooldown {
   duration_min: number
   movements: string[]
}

export interface ItfOrganizedBlock {
   exercise_id: string
   name: string
   sets: number
   reps: string
   rest_sec: number
   /** Tip motivacional breve agregado por IA (máx 120 chars). */
   tip: string
}

export interface ItfOrganizedSession {
   warmup: ItfWarmup
   blocks: ItfOrganizedBlock[]
   cooldown: ItfCooldown
   estimated_total_min: number
}

export interface ItfGeneratedSession {
   session: ItfOrganizedSession
   prescribed: ItfPrescribedExercise[]
   focus: ItfSessionFocus
   source: 'ai' | 'ai_retry' | 'fallback'
}

export type ItfRoutineValidationReason =
   | 'invalid_json'
   | 'missing_top_fields'
   | 'block_count_mismatch'
   | 'exercise_modified'
   | 'tip_too_short'
   | 'tip_too_long'
   | 'forbidden_words_in_tip'
   | 'medical_advice_in_tip'
   | 'warmup_out_of_range'
   | 'cooldown_out_of_range'
   | 'total_time_unrealistic'

export type ItfRoutineValidationResult =
   | { valid: true; session: ItfOrganizedSession }
   | { valid: false; reason: ItfRoutineValidationReason; detail?: string }

export interface ItfUserContextForWorkout {
   activityLevel: ItfActivityLevel
   fitnessLevel: ItfFitnessLevel
   equipment: string[]
   injuredZones: string[]
   availableMinutes: number
   /** Día del programa: usado para descarga forzada cada 5 semanas. */
   weekInBlock: number
}

/**
 * Mapa de focus → patrones musculares incluidos.
 * Se usa en exercise-selector para filtrar el pool.
 */
export const FOCUS_PATTERNS: Record<ItfSessionFocus, ItfExercisePattern[]> = {
   full_body: [
      'squat',
      'hinge',
      'push_horizontal',
      'push_vertical',
      'pull_horizontal',
      'pull_vertical',
      'core'
   ],
   upper: ['push_horizontal', 'push_vertical', 'pull_horizontal', 'pull_vertical', 'core'],
   lower: ['squat', 'hinge', 'lunge'],
   push: ['push_horizontal', 'push_vertical', 'core'],
   pull: ['pull_horizontal', 'pull_vertical', 'core'],
   legs: ['squat', 'hinge', 'lunge', 'carry'],
   core: ['core']
}
