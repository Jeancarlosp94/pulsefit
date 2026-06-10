-- Fase 8: rehacer rescue_events con schema simplificado para el motor
-- de Rescates. La tabla original del schema inicial tenía campos legacy
-- (original_plan jsonb, alternative_chosen jsonb) que no calzan con el
-- nuevo flujo. Aplicamos el patrón DROP+CREATE limpio (skill trampa #1).

DROP TABLE IF EXISTS rescue_events CASCADE;

CREATE TABLE rescue_events (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   event_date date NOT NULL DEFAULT current_date,
   event_time timestamptz NOT NULL DEFAULT now(),
   domain text NOT NULL CHECK (domain IN ('workout', 'meal', 'emotional')),
   trigger_type text NOT NULL,
   reason text,
   alternatives_offered jsonb NOT NULL,
   alternative_chosen jsonb,
   user_completed boolean
);

CREATE INDEX rescue_events_user_date_idx
   ON rescue_events (user_id, event_date DESC);

ALTER TABLE rescue_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own rescue events"
   ON rescue_events FOR SELECT
   USING (auth.uid() = user_id);

CREATE POLICY "users insert own rescue events"
   ON rescue_events FOR INSERT
   WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own rescue events"
   ON rescue_events FOR UPDATE
   USING (auth.uid() = user_id);

CREATE POLICY "users delete own rescue events"
   ON rescue_events FOR DELETE
   USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
