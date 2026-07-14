-- Sprint 11.18b: separar POLICY de profiles en SELECT/INSERT/UPDATE/DELETE
-- explícitas con WITH CHECK.
--
-- BUG REPORTADO
-- Otro usuario intentó ingresar y recibió 401 (42501 insufficient
-- privileges) al hacer UPSERT en /rest/v1/profiles.
--
-- CAUSA
-- La policy original era:
--   CREATE POLICY "users_own_profile" ON profiles
--     FOR ALL USING (auth.uid() = id);
--
-- Sin WITH CHECK, Postgres 15+ rechaza INSERT/UPSERT porque necesita
-- validar que la fila QUE SE INSERTA cumple el check (no solo la fila
-- vieja como en UPDATE). Con `FOR ALL USING (...)` sin WITH CHECK, el
-- INSERT queda bloqueado silenciosamente.
--
-- Además, el flujo del nuevo usuario es:
--   1. auth.signup() crea auth.users
--   2. Trigger handle_new_user() intenta crear profiles con SECURITY DEFINER
--   3. Si el trigger falla o corre parcial, fntUpdateProfile hace UPSERT
--      defensivo (que es lo que se ve en el log del bug).
--
-- FIX
-- Dropear la policy única y crear 4 policies explícitas:
--   - SELECT: USING (auth.uid() = id)
--   - INSERT: WITH CHECK (auth.uid() = id)  ← lo que faltaba
--   - UPDATE: USING (auth.uid() = id) WITH CHECK (auth.uid() = id)
--   - DELETE: USING (auth.uid() = id)
--
-- Idempotente: cada policy con DROP IF EXISTS + CREATE.

DROP POLICY IF EXISTS "users_own_profile" ON profiles;
DROP POLICY IF EXISTS "users read own profile" ON profiles;
DROP POLICY IF EXISTS "users insert own profile" ON profiles;
DROP POLICY IF EXISTS "users update own profile" ON profiles;
DROP POLICY IF EXISTS "users delete own profile" ON profiles;

CREATE POLICY "users read own profile"
   ON profiles FOR SELECT
   USING (auth.uid() = id);

CREATE POLICY "users insert own profile"
   ON profiles FOR INSERT
   WITH CHECK (auth.uid() = id);

CREATE POLICY "users update own profile"
   ON profiles FOR UPDATE
   USING (auth.uid() = id)
   WITH CHECK (auth.uid() = id);

CREATE POLICY "users delete own profile"
   ON profiles FOR DELETE
   USING (auth.uid() = id);

NOTIFY pgrst, 'reload schema';
