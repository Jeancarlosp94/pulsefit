-- Fase 6: Plan Semanal Dinámico
-- Tabla que persiste planes de comidas completos (N días × N comidas × 3 recetas rotantes).
-- Decisiones de producto:
--   - 3 recetas por meal_type, rotan entre días (día 1=A, día 2=B, día 3=C, día 4=A, ...)
--   - Distribución calórica DINÁMICA por día (jitter ±10% sobre MEAL_DISTRIBUTIONS base)
--   - Suma diaria SIEMPRE = target_kcal exacto (constraint de producto, no DB)
--   - Persistencia: el plan completo en jsonb para evitar JOIN N+1 al leer

CREATE TABLE IF NOT EXISTS meal_plans (
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

   -- recipes_by_meal_type: { breakfast: [recipeA, recipeB, recipeC], lunch: [...], ... }
   -- Cada recipe: { name, description, prep_time_min, difficulty, steps[], components{protein,carb,fat,vegetable}, baseKcal, source }
   recipes_by_meal_type jsonb NOT NULL,

   -- daily_schedule: array de N días, cada uno con assignments por meal_type
   -- { day: 1, meals: { breakfast: { recipeIdx: 0, scaledKcal: 600, scaledGrams: {protein:120, carb:80, ...} }, ... } }
   daily_schedule jsonb NOT NULL,

   source text NOT NULL CHECK (source IN ('ai', 'fallback', 'mixed'))
);

CREATE INDEX IF NOT EXISTS meal_plans_user_id_created_at_idx
   ON meal_plans (user_id, created_at DESC);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Solo el dueño puede leer su plan
CREATE POLICY "users read own meal plans"
   ON meal_plans FOR SELECT
   USING (auth.uid() = user_id);

-- Solo el dueño puede crear sus planes
CREATE POLICY "users create own meal plans"
   ON meal_plans FOR INSERT
   WITH CHECK (auth.uid() = user_id);

-- Solo el dueño puede borrar (regenerar = nueva fila)
CREATE POLICY "users delete own meal plans"
   ON meal_plans FOR DELETE
   USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
