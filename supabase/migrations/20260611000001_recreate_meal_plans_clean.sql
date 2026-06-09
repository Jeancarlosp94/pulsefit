-- Fase 6 hotfix #2 — recrear meal_plans desde cero porque la tabla quedó con
-- columnas legacy de un schema previo (week_start_date NOT NULL, posiblemente otras)
-- que rompen el INSERT de la Edge Function generate-meal-plan.
--
-- DESTRUCTIVO: borra cualquier plan previo. Como no se pudo generar ningún plan
-- exitoso todavía (todos los intentos fallaron por el bug), no hay datos que perder.
--
-- Si en el futuro hay datos importantes en meal_plans, NO correr este script —
-- usar una migración con ALTER TABLE específico en su lugar.

DROP TABLE IF EXISTS meal_plans CASCADE;

CREATE TABLE meal_plans (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   created_at timestamptz NOT NULL DEFAULT now(),

   days int NOT NULL CHECK (days BETWEEN 1 AND 7),
   meals_per_day int NOT NULL CHECK (meals_per_day BETWEEN 2 AND 5),

   target_kcal int NOT NULL,
   target_protein_g int NOT NULL,
   target_carbs_g int NOT NULL,
   target_fats_g int NOT NULL,

   excluded_ingredient_ids text[] NOT NULL DEFAULT '{}',

   recipes_by_meal_type jsonb NOT NULL,
   daily_schedule jsonb NOT NULL,

   source text NOT NULL CHECK (source IN ('ai', 'fallback', 'mixed'))
);

CREATE INDEX meal_plans_user_id_created_at_idx
   ON meal_plans (user_id, created_at DESC);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own meal plans"
   ON meal_plans FOR SELECT
   USING (auth.uid() = user_id);

CREATE POLICY "users create own meal plans"
   ON meal_plans FOR INSERT
   WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own meal plans"
   ON meal_plans FOR DELETE
   USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
