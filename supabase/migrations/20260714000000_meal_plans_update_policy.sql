-- Sprint 11.17: agregar POLICY de UPDATE a meal_plans.
--
-- Bug reportado: usuario hace tap "Cambiar proteína" en el plan, elige
-- alternativa, y el cambio NO se guarda (silencio total, sin error visible).
--
-- Causa: la tabla meal_plans tenía RLS activo con policies para
-- SELECT / INSERT / DELETE únicamente. UPDATE quedó bloqueado por RLS,
-- así que fntSwapIngredient escribía y Postgres lo rechazaba en silencio
-- (0 filas afectadas + .single() falla).
--
-- Fix: agregar policy "users update own meal plans" con auth.uid() = user_id.
-- Idempotente: DROP IF EXISTS + CREATE por si la corriste alguna vez manual.

DROP POLICY IF EXISTS "users update own meal plans" ON meal_plans;

CREATE POLICY "users update own meal plans"
   ON meal_plans FOR UPDATE
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
