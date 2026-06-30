/**
 * Tipos auto-generados desde el esquema de Supabase.
 *
 * ⚠️ **No editar a mano:** este archivo se regenera con `pnpm types:db`
 * (que ejecuta `supabase gen types typescript --local > src/interface/database.ts`).
 *
 * Esta versión es un placeholder manual mínimo creado durante Fase 3 para
 * que el cliente tenga tipos hasta que el dev tenga Docker + Supabase local
 * corriendo y pueda regenerar.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface ProfileRow {
   id: string
   email: string | null
   name: string | null
   age: number | null
   sex: 'male' | 'female' | 'prefer_not_to_say' | null
   height_cm: number | null
   initial_weight_kg: number | null
   current_weight_kg: number | null
   target_weight_kg: number | null
   target_date: string | null
   goal: 'lose' | 'gain' | 'maintain' | 'feel_better' | null
   activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
   fitness_level: 'absolute_beginner' | 'beginner' | 'intermediate' | 'advanced' | null
   available_days: number[] | null
   available_minutes: number | null
   equipment: string[] | null
   cooks_at_home: 'yes' | 'sometimes' | 'rarely' | null
   dietary_restrictions: string[] | null
   allergies: string | null
   disliked_foods: string[] | null
   budget_level: 'low' | 'medium' | 'high' | null
   medical_conditions: string[] | null
   tmb: number | null
   get_kcal: number | null
   target_kcal: number | null
   target_protein_g: number | null
   target_carbs_g: number | null
   target_fats_g: number | null
   onboarding_completed: boolean
   region: string
   locale: string
   accepted_terms_at: string | null
   accepted_privacy_at: string | null
   meals_per_day: number
   favorite_cuisines: string[]
   favorite_ingredient_ids: string[]
   /** Cuántas personas comen del plan (1-8). Multiplica gramos y lista de compras. */
   family_size: number
   /** Sprint 11.5A — columnas de seguridad clínica. */
   date_of_birth: string | null
   eating_disorder_history: boolean
   lifestyle:
      | 'estudiante'
      | 'oficinista'
      | 'mama_papa'
      | 'freelance'
      | 'migrante'
      | 'atleta_amateur'
      | null
   alcohol_frequency: 'none' | 'social' | 'weekly' | 'daily' | null
   tobacco_user: boolean | null
   country_code: string | null
   /** Sprint 11.6: si true, el pattern-engine no marca patrones de "varía más". */
   monotonous_meals_preferred: boolean
   created_at: string
   updated_at: string
}

export type ProfileInsert = Partial<ProfileRow> & { id: string }
export type ProfileUpdate = Partial<ProfileRow>

export interface DailyLogRow {
   id: string
   user_id: string
   log_date: string
   weight_kg: number | null
   energy_level: number | null
   mood_level: number | null
   sleep_hours: number | null
   water_ml: number | null
   steps: number | null
   notes: string | null
   created_at: string
}
export type DailyLogInsert = Partial<Omit<DailyLogRow, 'id' | 'created_at'>> & {
   user_id: string
   log_date: string
}
export type DailyLogUpdate = Partial<Omit<DailyLogRow, 'id' | 'created_at'>>

export interface MealLogRow {
   id: string
   user_id: string
   log_date: string
   meal_type: string | null
   status: 'planned_completed' | 'substituted' | 'skipped' | 'extra' | null
   planned_item_id: string | null
   actual_meal_name: string | null
   actual_kcal: number | null
   actual_protein_g: number | null
   actual_carbs_g: number | null
   actual_fats_g: number | null
   photo_url: string | null
   notes: string | null
   created_at: string
}
export type MealLogInsert = Partial<Omit<MealLogRow, 'id' | 'created_at'>> & {
   user_id: string
   log_date: string
}
export type MealLogUpdate = Partial<Omit<MealLogRow, 'id' | 'created_at'>>

/** Sprint 3 + Sprint 11.7: schema real de workout_logs después de hotfixes. */
export interface WorkoutLogRow {
   id: string
   user_id: string
   logged_at: string
   /** Sprint 11.7 — tipo de actividad. */
   activity_type: 'strength' | 'cardio' | 'sport' | 'dance' | 'movement'
   /* Strength (nullable post-11.7): */
   exercise_id: string | null
   exercise_name: string | null
   sets_completed: number | null
   reps_completed: number | null
   weight_kg: number | null
   rpe_actual: number | null
   /* Sprint 11.7 — no-strength: */
   activity_name: string | null
   duration_min: number | null
   intensity: number | null
   notes: string | null
   session_id: string | null
}
export type WorkoutLogInsert = Partial<Omit<WorkoutLogRow, 'id'>> & {
   user_id: string
   activity_type: WorkoutLogRow['activity_type']
}
export type WorkoutLogUpdate = Partial<Omit<WorkoutLogRow, 'id'>>

export interface RescueEventRow {
   id: string
   user_id: string
   event_date: string
   event_time: string
   trigger_type:
      | 'workout_skip'
      | 'meal_change'
      | 'no_cooking'
      | 'eating_out'
      | 'low_mood'
      | 'no_energy'
      | 'injury'
      | 'craving'
      | null
   reason: string | null
   original_plan: Json | null
   alternatives_offered: Json | null
   alternative_chosen: Json | null
   user_completed: boolean | null
}
export type RescueEventInsert = Partial<Omit<RescueEventRow, 'id' | 'event_time'>> & {
   user_id: string
   event_date: string
}
export type RescueEventUpdate = Partial<Omit<RescueEventRow, 'id'>>

export interface Database {
   public: {
      Tables: {
         profiles: { Row: ProfileRow; Insert: ProfileInsert; Update: ProfileUpdate; Relationships: [] }
         daily_logs: {
            Row: DailyLogRow
            Insert: DailyLogInsert
            Update: DailyLogUpdate
            Relationships: []
         }
         meal_logs: {
            Row: MealLogRow
            Insert: MealLogInsert
            Update: MealLogUpdate
            Relationships: []
         }
         workout_logs: {
            Row: WorkoutLogRow
            Insert: WorkoutLogInsert
            Update: WorkoutLogUpdate
            Relationships: []
         }
         rescue_events: {
            Row: RescueEventRow
            Insert: RescueEventInsert
            Update: RescueEventUpdate
            Relationships: []
         }
      }
      Views: Record<never, never>
      Functions: Record<never, never>
      Enums: Record<string, never>
      CompositeTypes: Record<string, never>
   }
}

/* Helper genérico shadcn-style para extraer tipos. */
export type Tables<T extends keyof Database['public']['Tables']> =
   Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
   Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
   Database['public']['Tables'][T]['Update']
