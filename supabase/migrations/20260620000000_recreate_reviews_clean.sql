-- Fase 10: rehacer reviews con schema simplificado para el motor
-- de Revisión Semanal. La tabla del schema inicial tenía campos legacy
-- (period_start, period_end, applied_changes) que no calzan con el flujo
-- on-demand. DROP+CREATE limpio (skill trampa #1).

DROP TABLE IF EXISTS reviews CASCADE;

CREATE TABLE reviews (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   created_at timestamptz NOT NULL DEFAULT now(),
   week_start date NOT NULL,
   week_end date NOT NULL,
   metrics jsonb NOT NULL,
   adjustments jsonb NOT NULL,
   summary jsonb NOT NULL,
   accepted_adjustment_ids text[] DEFAULT '{}',
   applied_at timestamptz,
   user_decision text CHECK (user_decision IN ('accepted_all', 'partial', 'rejected', 'pending'))
);

CREATE INDEX reviews_user_created_idx
   ON reviews (user_id, created_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own reviews"
   ON reviews FOR SELECT
   USING (auth.uid() = user_id);

CREATE POLICY "users insert own reviews"
   ON reviews FOR INSERT
   WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own reviews"
   ON reviews FOR UPDATE
   USING (auth.uid() = user_id);

CREATE POLICY "users delete own reviews"
   ON reviews FOR DELETE
   USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
