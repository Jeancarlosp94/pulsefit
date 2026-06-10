-- Sprint 7.2B: log de hidratación + peso para registro rápido.
-- Pensado siguiendo el patrón de meal_logs y workout_logs.

-- =========================================================
--  WATER_LOGS — registro de vasos de agua
-- =========================================================
-- Un usuario puede sumar/restar vasos a lo largo del día. Cada tap
-- genera una fila con delta +1 o -1 (no agregamos: la suma del día
-- se calcula en el cliente). Esto permite "deshacer" sin lógica extra.

DROP TABLE IF EXISTS water_logs CASCADE;

CREATE TABLE water_logs (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   logged_at timestamptz NOT NULL DEFAULT now(),
   /* +1 al tap'ear "agregué un vaso", -1 al deshacer. */
   delta_glasses int NOT NULL CHECK (delta_glasses IN (-1, 1))
);

CREATE INDEX water_logs_user_date_idx
   ON water_logs (user_id, logged_at DESC);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own water logs"
   ON water_logs FOR SELECT
   USING (auth.uid() = user_id);
CREATE POLICY "users insert own water logs"
   ON water_logs FOR INSERT
   WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own water logs"
   ON water_logs FOR DELETE
   USING (auth.uid() = user_id);

-- =========================================================
--  WEIGHT_LOGS — registro de peso (una entrada por día)
-- =========================================================
-- Un registro por fecha (UNIQUE por user_id + log_date). El usuario
-- puede actualizar el del día si se midió más tarde.

DROP TABLE IF EXISTS weight_logs CASCADE;

CREATE TABLE weight_logs (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   log_date date NOT NULL DEFAULT current_date,
   weight_kg numeric(5, 2) NOT NULL CHECK (weight_kg BETWEEN 20 AND 300),
   notes text,
   logged_at timestamptz NOT NULL DEFAULT now(),
   UNIQUE(user_id, log_date)
);

CREATE INDEX weight_logs_user_date_idx
   ON weight_logs (user_id, log_date DESC);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own weight logs"
   ON weight_logs FOR SELECT
   USING (auth.uid() = user_id);
CREATE POLICY "users insert own weight logs"
   ON weight_logs FOR INSERT
   WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own weight logs"
   ON weight_logs FOR UPDATE
   USING (auth.uid() = user_id);
CREATE POLICY "users delete own weight logs"
   ON weight_logs FOR DELETE
   USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
