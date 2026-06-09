-- Fase 6 hotfix: asegurar que meal_plans tenga TODAS las columnas que necesita la Edge Function.
-- La migración original 20260610000000 usaba CREATE TABLE IF NOT EXISTS, que NO ejecuta nada
-- si la tabla ya existía (incluso parcial). Este script es idempotente: solo agrega lo que falta.
--
-- Si la tabla NO existe, este script no la crea — usá la migración base primero. Acá solo
-- garantizamos las columnas. Después forzamos NOTIFY pgrst, 'reload schema' para que el
-- error PGRST204 desaparezca de inmediato.

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meal_plans') THEN
      RAISE NOTICE 'meal_plans no existe — corré la migración base 20260610000000 primero.';
      RETURN;
   END IF;
END $$;

ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS days int;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS meals_per_day int;

ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS target_kcal int;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS target_protein_g int;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS target_carbs_g int;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS target_fats_g int;

ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS excluded_ingredient_ids text[] NOT NULL DEFAULT '{}';
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS recipes_by_meal_type jsonb;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS daily_schedule jsonb;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS source text;

-- Índice si no existe
CREATE INDEX IF NOT EXISTS meal_plans_user_id_created_at_idx
   ON meal_plans (user_id, created_at DESC);

-- RLS si no estaba activado
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Policies idempotentes (drop + recreate por si la firma cambió)
DROP POLICY IF EXISTS "users read own meal plans" ON meal_plans;
CREATE POLICY "users read own meal plans"
   ON meal_plans FOR SELECT
   USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users create own meal plans" ON meal_plans;
CREATE POLICY "users create own meal plans"
   ON meal_plans FOR INSERT
   WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users delete own meal plans" ON meal_plans;
CREATE POLICY "users delete own meal plans"
   ON meal_plans FOR DELETE
   USING (auth.uid() = user_id);

-- CRÍTICO: forzar el reload del schema cache de PostgREST.
-- Sin esto, PostgREST sigue cacheando la versión vieja y tira PGRST204.
NOTIFY pgrst, 'reload schema';
