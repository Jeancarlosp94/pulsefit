-- ============================================================================
-- PulseFit · Consent timestamps (Fase 4)
-- ----------------------------------------------------------------------------
-- Agrega timestamps de aceptación de términos y privacidad. Permite que
-- usuarios de Google OAuth (que no pasaron por el form de register) acepten
-- los términos en el Step 1 del onboarding, y persiste evidencia legal.
-- ============================================================================

ALTER TABLE profiles
   ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
   ADD COLUMN IF NOT EXISTS accepted_privacy_at TIMESTAMPTZ;

-- Índice para auditoría: encontrar rápido usuarios sin consent registrado.
CREATE INDEX IF NOT EXISTS idx_profiles_consent_missing
   ON profiles(id)
   WHERE accepted_terms_at IS NULL OR accepted_privacy_at IS NULL;
