-- Sprint 11.5A: columnas de seguridad clínica en profiles.
-- ALTER TABLE ADD COLUMN IF NOT EXISTS es idempotente y seguro sobre la
-- tabla profiles que está estable en producción (NO usamos DROP+CREATE).

ALTER TABLE profiles
   /* Fecha de nacimiento para validar edad ≥ 18. */
   ADD COLUMN IF NOT EXISTS date_of_birth date,

   /* Flag de historial de TCA: si true → modo intuitivo activado, sin
    * mostrar métricas calóricas ni sugerir déficit en revisión semanal. */
   ADD COLUMN IF NOT EXISTS eating_disorder_history boolean DEFAULT false NOT NULL,

   /* Estilo de vida para defaults sensatos del motor (Sprint 11.5B). */
   ADD COLUMN IF NOT EXISTS lifestyle text CHECK (
      lifestyle IS NULL OR lifestyle IN
      ('estudiante', 'oficinista', 'mama_papa', 'freelance', 'migrante', 'atleta_amateur')
   ),

   /* Bebidas y tabaco (Sprint 11.5B). Sin juicio, contexto para el motor. */
   ADD COLUMN IF NOT EXISTS alcohol_frequency text CHECK (
      alcohol_frequency IS NULL OR alcohol_frequency IN
      ('none', 'social', 'weekly', 'daily')
   ),
   ADD COLUMN IF NOT EXISTS tobacco_user boolean DEFAULT false,

   /* País actual (puede diferir de "región de origen culinaria"). */
   ADD COLUMN IF NOT EXISTS country_code text;

NOTIFY pgrst, 'reload schema';
