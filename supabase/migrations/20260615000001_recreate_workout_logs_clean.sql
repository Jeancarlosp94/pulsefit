-- Sprint 3 hotfix: recrear workout_logs desde cero.
-- Síntoma: ERROR 42703 "column exercise_id does not exist" al crear el índice.
-- Causa: una versión anterior de la tabla workout_logs estaba parcialmente
-- creada (sin la columna exercise_id), entonces CREATE TABLE IF NOT EXISTS
-- saltó la creación y el CREATE INDEX falló al referenciar la columna nueva.
--
-- DESTRUCTIVO: borra cualquier log previo. Como nunca se llegó a registrar
-- un set (el feature recién se deployó), no hay datos que perder.

DROP TABLE IF EXISTS workout_logs CASCADE;

CREATE TABLE workout_logs (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   logged_at timestamptz NOT NULL DEFAULT now(),

   exercise_id text NOT NULL,
   exercise_name text NOT NULL,

   sets_completed int NOT NULL CHECK (sets_completed BETWEEN 1 AND 10),
   reps_completed int NOT NULL CHECK (reps_completed BETWEEN 1 AND 50),
   weight_kg numeric(5, 2) NOT NULL CHECK (weight_kg BETWEEN 0 AND 500),
   rpe_actual int CHECK (rpe_actual BETWEEN 1 AND 10),

   notes text,
   session_id uuid
);

CREATE INDEX workout_logs_user_exercise_date_idx
   ON workout_logs (user_id, exercise_id, logged_at DESC);

CREATE INDEX workout_logs_user_date_idx
   ON workout_logs (user_id, logged_at DESC);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own workout logs"
   ON workout_logs FOR SELECT
   USING (auth.uid() = user_id);

CREATE POLICY "users insert own workout logs"
   ON workout_logs FOR INSERT
   WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own workout logs"
   ON workout_logs FOR UPDATE
   USING (auth.uid() = user_id);

CREATE POLICY "users delete own workout logs"
   ON workout_logs FOR DELETE
   USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
