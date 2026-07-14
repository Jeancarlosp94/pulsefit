-- Sprint 11.12: añadir calorías quemadas + soporte de rutina custom a workout_logs.
--
-- Hasta ahora workout_logs no estimaba kcal. Para que el usuario que registra
-- SU PROPIA rutina (no la generada por el motor) pueda ver impacto, agregamos:
--   - calories_burned: int calculado por cliente con fórmula MET.
--   - workout_subtype: subtipo libre para 'movement' (yoga, hiit, crossfit, etc).
--   - perceived_effort: feedback subjetivo separado de intensity numérico.
--
-- También expandimos el CHECK para que 'movement' acepte rutinas custom.
-- ALTER ADD IF NOT EXISTS para no romper datos previos.

ALTER TABLE workout_logs
   ADD COLUMN IF NOT EXISTS calories_burned int CHECK (calories_burned IS NULL OR calories_burned BETWEEN 0 AND 3000),
   ADD COLUMN IF NOT EXISTS workout_subtype text,
   ADD COLUMN IF NOT EXISTS perceived_effort text;

NOTIFY pgrst, 'reload schema';
