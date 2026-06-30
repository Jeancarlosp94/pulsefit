-- Sprint 11.7: tipos de actividad expandidos en workout_logs.
--
-- Hasta ahora workout_logs solo soportaba 'strength' (sets/reps/peso/RPE).
-- Esto excluía a Esteban (juega fútbol los sábados) y Brigitte (4 horas de
-- bachata) que reportaron que la app "no contaba" su actividad real.
--
-- Solución: ampliar workout_logs con activity_type + campos opcionales.
-- Las columnas de strength (exercise_id, sets_completed, reps_completed,
-- weight_kg, rpe_actual) se vuelven nullable para tipos no-strength.
--
-- ALTER ADD COLUMN IF NOT EXISTS es idempotente. NO usamos DROP+CREATE
-- porque workout_logs ya tiene datos en producción.

ALTER TABLE workout_logs
   /* Tipo de actividad. Default 'strength' para compatibilidad. */
   ADD COLUMN IF NOT EXISTS activity_type text DEFAULT 'strength' NOT NULL,
   /* Nombre libre para sport/dance/movement (ej "Fútbol", "Bachata"). */
   ADD COLUMN IF NOT EXISTS activity_name text,
   /* Duración en minutos (para no-strength). */
   ADD COLUMN IF NOT EXISTS duration_min int CHECK (duration_min IS NULL OR duration_min BETWEEN 1 AND 600),
   /* Intensidad subjetiva 1-5 (sustituye RPE para no-strength). */
   ADD COLUMN IF NOT EXISTS intensity int CHECK (intensity IS NULL OR intensity BETWEEN 1 AND 5);

/* Hacer nullable las columnas de strength (eran NOT NULL).
 * Para tipos no-strength estas columnas no aplican. */
ALTER TABLE workout_logs ALTER COLUMN exercise_id DROP NOT NULL;
ALTER TABLE workout_logs ALTER COLUMN exercise_name DROP NOT NULL;
ALTER TABLE workout_logs ALTER COLUMN sets_completed DROP NOT NULL;
ALTER TABLE workout_logs ALTER COLUMN reps_completed DROP NOT NULL;
ALTER TABLE workout_logs ALTER COLUMN weight_kg DROP NOT NULL;

/* Constraint coherencia: activity_type='strength' requiere exercise_id.
 * Tipos no-strength requieren activity_name + duration_min. */
ALTER TABLE workout_logs
   ADD CONSTRAINT workout_logs_activity_coherence CHECK (
      (activity_type = 'strength' AND exercise_id IS NOT NULL)
      OR (activity_type IN ('cardio', 'sport', 'dance', 'movement')
          AND activity_name IS NOT NULL
          AND duration_min IS NOT NULL)
   );

NOTIFY pgrst, 'reload schema';
