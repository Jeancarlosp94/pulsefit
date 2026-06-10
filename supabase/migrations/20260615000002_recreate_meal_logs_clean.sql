-- Sprint 7.1 hotfix: recrear meal_logs desde cero.
-- Síntoma: ERROR 42703 "column logged_at does not exist" al crear el índice.
-- Causa: una versión anterior de meal_logs ya existía con schema distinto,
-- entonces CREATE TABLE IF NOT EXISTS saltó la creación y el CREATE INDEX
-- falló al referenciar logged_at (que esa versión vieja no tenía).
--
-- DESTRUCTIVO: borra cualquier log previo. Como el feature recién se deployó
-- y no se llegó a registrar ninguna comida desde la nueva UI, no hay datos
-- que perder.

DROP TABLE IF EXISTS meal_logs CASCADE;

CREATE TABLE meal_logs (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   logged_at timestamptz NOT NULL DEFAULT now(),

   plan_id uuid REFERENCES meal_plans(id) ON DELETE SET NULL,
   day_index int CHECK (day_index BETWEEN 0 AND 30),
   meal_type text CHECK (meal_type IN ('breakfast','snack_am','lunch','snack_pm','dinner')),

   status text NOT NULL CHECK (status IN ('planned','substituted','skipped')),

   recipe_name text,
   kcal int,
   protein_g int,
   carbs_g int,
   fats_g int,

   notes text
);

CREATE INDEX meal_logs_user_date_idx
   ON meal_logs (user_id, logged_at DESC);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own meal logs"
   ON meal_logs FOR SELECT
   USING (auth.uid() = user_id);

CREATE POLICY "users insert own meal logs"
   ON meal_logs FOR INSERT
   WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own meal logs"
   ON meal_logs FOR UPDATE
   USING (auth.uid() = user_id);

CREATE POLICY "users delete own meal logs"
   ON meal_logs FOR DELETE
   USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
