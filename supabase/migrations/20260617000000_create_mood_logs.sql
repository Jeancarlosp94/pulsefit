-- Sprint 7.4: registro de ánimo y energía del día.
-- Una sola entrada por día (UNIQUE por user_id + log_date).
-- Cada nivel es int 1-5 con caritas:
--   1 = 😟 muy bajo
--   2 = 😕 bajo
--   3 = 😐 neutro
--   4 = 🙂 bien
--   5 = 😄 muy bien
-- Si el usuario actualiza más tarde, hacemos upsert.

DROP TABLE IF EXISTS mood_logs CASCADE;

CREATE TABLE mood_logs (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   log_date date NOT NULL DEFAULT current_date,
   energy_level int NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
   mood_level int NOT NULL CHECK (mood_level BETWEEN 1 AND 5),
   notes text,
   logged_at timestamptz NOT NULL DEFAULT now(),
   UNIQUE(user_id, log_date)
);

CREATE INDEX mood_logs_user_date_idx
   ON mood_logs (user_id, log_date DESC);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own mood logs"
   ON mood_logs FOR SELECT
   USING (auth.uid() = user_id);

CREATE POLICY "users insert own mood logs"
   ON mood_logs FOR INSERT
   WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own mood logs"
   ON mood_logs FOR UPDATE
   USING (auth.uid() = user_id);

CREATE POLICY "users delete own mood logs"
   ON mood_logs FOR DELETE
   USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
