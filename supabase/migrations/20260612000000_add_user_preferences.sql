-- Sprint 0.2: capturar gustos personales del usuario en onboarding.
-- Permite que el motor priorice ingredientes/platos/cocinas que la persona
-- realmente disfruta, no solo lo que la IA invente.

ALTER TABLE profiles
   ADD COLUMN IF NOT EXISTS favorite_ingredient_ids text[] NOT NULL DEFAULT '{}';

ALTER TABLE profiles
   ADD COLUMN IF NOT EXISTS favorite_dish_ids text[] NOT NULL DEFAULT '{}';

-- Cocinas favoritas (multi-select): andina, mexicana, cono_sur, brasileña, asiatica, mediterranea
ALTER TABLE profiles
   ADD COLUMN IF NOT EXISTS favorite_cuisines text[] NOT NULL DEFAULT '{}';

NOTIFY pgrst, 'reload schema';
