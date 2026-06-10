-- Fase 7: log de comidas para registro rápido + estado del día.
-- Cada fila = una decisión del usuario sobre una comida específica de un
-- día específico de su plan vigente.
--
-- Status:
--   - 'planned':   comió lo planeado (tap único en el card de la comida)
--   - 'substituted': comió algo distinto (tap en alternativa)
--   - 'skipped':   no comió esa comida
--
-- Para 'substituted' guardamos el nombre y macros del plato real,
-- distintos del plan original.

CREATE TABLE IF NOT EXISTS meal_logs (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   logged_at timestamptz NOT NULL DEFAULT now(),

   /* Cuando viene del plan vigente: referencia al plan + day_index + meal_type. */
   plan_id uuid REFERENCES meal_plans(id) ON DELETE SET NULL,
   day_index int CHECK (day_index BETWEEN 0 AND 30),
   meal_type text CHECK (meal_type IN ('breakfast','snack_am','lunch','snack_pm','dinner')),

   status text NOT NULL CHECK (status IN ('planned','substituted','skipped')),

   /* Nombre del plato consumido (puede diferir del plan si status='substituted'). */
   recipe_name text,
   /* Macros del plato consumido. Si 'planned', vienen del plan; si 'substituted'
    * de lo que el usuario eligió; si 'skipped', null. */
   kcal int,
   protein_g int,
   carbs_g int,
   fats_g int,

   notes text
);

CREATE INDEX IF NOT EXISTS meal_logs_user_date_idx
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
