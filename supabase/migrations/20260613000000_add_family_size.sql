-- Sprint 1.2: persistir el "modo familia" (cuántas personas come del plan).
-- Default 1 = solo el usuario. Cuando family_size > 1, todas las cantidades
-- de la lista de compras y de las recetas se multiplican × N.

ALTER TABLE profiles
   ADD COLUMN IF NOT EXISTS family_size int NOT NULL DEFAULT 1
      CHECK (family_size BETWEEN 1 AND 8);

NOTIFY pgrst, 'reload schema';
