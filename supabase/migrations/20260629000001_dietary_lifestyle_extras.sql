-- Sprint 11.6: extras de inclusión cultural + estilo de vida.
-- ALTER TABLE ADD COLUMN IF NOT EXISTS sobre profiles estable (no DROP+CREATE).

ALTER TABLE profiles
   /* Sprint 11.6: usuarios como Renzo (siempre pollo y arroz) o Hugo
    * (carnívoro paraguayo) prefieren monotonía consciente. Si esto es
    * true, el pattern-engine NO marcará "frequently_substituted" ni
    * "struggles_with_meals" como problema. */
   ADD COLUMN IF NOT EXISTS monotonous_meals_preferred boolean DEFAULT false NOT NULL;

NOTIFY pgrst, 'reload schema';
