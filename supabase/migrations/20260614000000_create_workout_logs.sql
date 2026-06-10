-- Sprint 3: log de cargas para progresión automática
-- Carlos marcó como crítico: "sin tracking de cargas el usuario hace 3×8 de
-- goblet squat eternamente con la misma carga, se aburre, churn a los 6 meses".
--
-- Cada fila = UN ejercicio registrado en UNA sesión específica.
-- Hace fácil: mostrar "Última vez: 3×8 @ 22.5kg" en la próxima sesión,
-- y derivar sugerencia de carga ("hoy probá 25kg") según la lógica de
-- double progression (Sprint 3.2 helper).

CREATE TABLE IF NOT EXISTS workout_logs (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   logged_at timestamptz NOT NULL DEFAULT now(),

   /* Identificación del ejercicio. exercise_id es el slug del seed
    * (ej. 'goblet-squat'). Guardamos también el nombre legible por si el
    * seed se reorganiza en el futuro. */
   exercise_id text NOT NULL,
   exercise_name text NOT NULL,

   sets_completed int NOT NULL CHECK (sets_completed BETWEEN 1 AND 10),
   reps_completed int NOT NULL CHECK (reps_completed BETWEEN 1 AND 50),
   weight_kg numeric(5, 2) NOT NULL CHECK (weight_kg BETWEEN 0 AND 500),
   rpe_actual int CHECK (rpe_actual BETWEEN 1 AND 10),

   /* Notas libres del usuario ("se sintió pesado", "rodilla molestó"). */
   notes text,

   /* Referencia opcional a la sesión generada (puede ser null para entradas manuales). */
   session_id uuid
);

CREATE INDEX IF NOT EXISTS workout_logs_user_exercise_date_idx
   ON workout_logs (user_id, exercise_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS workout_logs_user_date_idx
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
