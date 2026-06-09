-- ============================================================================
-- PulseFit · Configuración de comidas por día (Fase 4.5)
-- ----------------------------------------------------------------------------
-- Permite al usuario decidir cuántas comidas hace por día (2-5). Cambia la
-- distribución calórica del plan y qué meal_types se muestran en /plan.
-- Decisión de Lucía documentada en files/formulas-nutricion.md.
-- ============================================================================

ALTER TABLE profiles
   ADD COLUMN IF NOT EXISTS meals_per_day INT DEFAULT 3
      CHECK (meals_per_day BETWEEN 2 AND 5);

-- Default 3 para usuarios existentes (más sano y universal según Lucía).
UPDATE profiles SET meals_per_day = 3 WHERE meals_per_day IS NULL;

-- Refrescar el schema cache de PostgREST para que la columna esté disponible
-- inmediatamente al cliente.
NOTIFY pgrst, 'reload schema';
