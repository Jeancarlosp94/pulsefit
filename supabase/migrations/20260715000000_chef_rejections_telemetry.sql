-- Sprint 11.18: telemetría de rechazos del Chef Diego.
--
-- Para SABER cuáles reglas se disparan más y priorizar mejoras al prompt,
-- guardamos cada rechazo. La tabla es "insert-only" desde la Edge Function
-- (usando service_role, sin RLS para escritura). Los admins pueden leer.
--
-- Uso pensado:
--   SELECT rule_name, COUNT(*) FROM chef_rejections
--   WHERE created_at > NOW() - INTERVAL '7 days'
--   GROUP BY rule_name ORDER BY COUNT(*) DESC;
--
--   → Sabemos qué regla dispara más y podemos ajustar el prompt o el motor.

DROP TABLE IF EXISTS chef_rejections CASCADE;

CREATE TABLE chef_rejections (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   created_at timestamptz NOT NULL DEFAULT now(),

   /* Nombre corto de la regla que rechazó (ej: 'nombre_no_coincide_ingredientes'). */
   rule_name text NOT NULL,
   /* Razón humano-legible que devolvió el Chef. */
   reason text NOT NULL,

   /* Nombre del plato rechazado (para análisis). */
   plate_name text,
   /* Nombres de ingredientes reales del plato (jsonb array). */
   ingredients jsonb,

   /* meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack_am' | 'snack_pm'. */
   meal_type text,
   /* Cocina cultural del contexto. */
   region text,

   /* Provider que generó el plato ('groq' | 'gemini' | 'fallback'). */
   provider text,
   /* Intento (1 = primer intento, 2 = retry, 3 = otro provider). */
   attempt int NOT NULL DEFAULT 1
);

CREATE INDEX chef_rejections_rule_created_idx
   ON chef_rejections (rule_name, created_at DESC);

CREATE INDEX chef_rejections_created_idx
   ON chef_rejections (created_at DESC);

/* RLS: los usuarios NO leen esta tabla. Solo el service_role escribe/lee.
 * Por seguridad activamos RLS y NO creamos policies para authenticated users. */
ALTER TABLE chef_rejections ENABLE ROW LEVEL SECURITY;

/* Policy para lectura solo con service_role (implícita — sin policy = solo service). */

NOTIFY pgrst, 'reload schema';
