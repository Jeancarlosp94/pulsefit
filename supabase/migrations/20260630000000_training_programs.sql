-- Sprint 11.10: Sistema de Programas "Crear mi PulseFit".
--
-- Permite al usuario armar un programa multi-fase con meta clara, duración
-- (semanas), y una modalidad por fase (hiit, yoga, barre, gym, calistenia,
-- hybrid). La app recalcula y ajusta cada semana basándose en adherencia.
--
-- Ejemplo de uso (caso usuario que pidió esta feature):
--   - Programa: "Bajar 5 kg en 3 meses"
--   - Fase 1 (semanas 1-4): HIIT 3x/semana (adaptación)
--   - Fase 2 (semanas 5-8): Yoga 2x + Cardio 2x (recovery focus)
--   - Fase 3 (semanas 9-12): Gym 3x + Cardio 1x (progressive overload)
--
-- DROP+CREATE limpio (patrón del skill: tabla nueva = DROP+CREATE, no IF NOT EXISTS).

DROP TABLE IF EXISTS training_phases CASCADE;
DROP TABLE IF EXISTS training_programs CASCADE;

CREATE TABLE training_programs (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
   created_at timestamptz NOT NULL DEFAULT now(),
   updated_at timestamptz NOT NULL DEFAULT now(),

   /* Nombre que el usuario elige: "Mi PulseFit verano", "Bajar 5 kg", etc. */
   name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),

   /* Meta: 'lose_weight' | 'gain_muscle' | 'feel_better' | 'event' | 'maintenance'. */
   goal_type text NOT NULL CHECK (
      goal_type IN ('lose_weight', 'gain_muscle', 'feel_better', 'event', 'maintenance')
   ),

   /* Target opcional: peso objetivo (kg) o fecha del evento. */
   target_weight_kg numeric(5, 2),
   target_date date,

   /* Duración total en semanas (1-52). */
   total_weeks int NOT NULL CHECK (total_weeks BETWEEN 1 AND 52),

   /* Fecha de inicio del programa (puede ser hoy o futuro). */
   start_date date NOT NULL DEFAULT current_date,

   /* Estado: 'active' | 'completed' | 'paused' | 'cancelled'. */
   status text NOT NULL DEFAULT 'active' CHECK (
      status IN ('active', 'completed', 'paused', 'cancelled')
   ),

   /* Notas del usuario (opcional). */
   notes text
);

CREATE INDEX training_programs_user_status_idx
   ON training_programs (user_id, status, created_at DESC);

-- Fases del programa: cada una con su modalidad + duración.
CREATE TABLE training_phases (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   program_id uuid NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
   /* Orden de la fase dentro del programa (1, 2, 3, ...). */
   phase_order int NOT NULL CHECK (phase_order BETWEEN 1 AND 12),

   /* Nombre de la fase: "Adaptación", "Volumen", "Recovery", etc. */
   phase_name text NOT NULL CHECK (length(phase_name) BETWEEN 1 AND 60),

   /* Modalidad principal de entrenamiento. */
   modality text NOT NULL CHECK (
      modality IN (
         'hiit',
         'gym',
         'calistenia',
         'yoga',
         'barre',
         'pilates',
         'running',
         'cycling',
         'swimming',
         'sport',
         'hybrid'
      )
   ),

   /* Duración de la fase en semanas. */
   weeks int NOT NULL CHECK (weeks BETWEEN 1 AND 26),

   /* Frecuencia: cuántas sesiones por semana de esta modalidad (1-7). */
   sessions_per_week int NOT NULL CHECK (sessions_per_week BETWEEN 1 AND 7),

   /* Intensidad target (sustituye RPE por ser más fácil de entender por modalidad). */
   intensity_target text NOT NULL DEFAULT 'moderate' CHECK (
      intensity_target IN ('light', 'moderate', 'intense')
   ),

   /* Focus muscular o de objetivo: 'full_body' | 'upper' | 'lower' | 'core' | 'cardio'. */
   focus text NOT NULL DEFAULT 'full_body' CHECK (
      focus IN ('full_body', 'upper', 'lower', 'core', 'cardio')
   ),

   /* Descripción de la fase (qué busca lograr). */
   description text,

   UNIQUE (program_id, phase_order)
);

CREATE INDEX training_phases_program_idx
   ON training_phases (program_id, phase_order);

-- RLS
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own programs"
   ON training_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own programs"
   ON training_programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own programs"
   ON training_programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own programs"
   ON training_programs FOR DELETE USING (auth.uid() = user_id);

-- Phases heredan permisos a través del program. RLS transitivo:
CREATE POLICY "users read own phases"
   ON training_phases FOR SELECT USING (
      EXISTS (
         SELECT 1 FROM training_programs p
         WHERE p.id = training_phases.program_id AND p.user_id = auth.uid()
      )
   );
CREATE POLICY "users insert own phases"
   ON training_phases FOR INSERT WITH CHECK (
      EXISTS (
         SELECT 1 FROM training_programs p
         WHERE p.id = training_phases.program_id AND p.user_id = auth.uid()
      )
   );
CREATE POLICY "users update own phases"
   ON training_phases FOR UPDATE USING (
      EXISTS (
         SELECT 1 FROM training_programs p
         WHERE p.id = training_phases.program_id AND p.user_id = auth.uid()
      )
   );
CREATE POLICY "users delete own phases"
   ON training_phases FOR DELETE USING (
      EXISTS (
         SELECT 1 FROM training_programs p
         WHERE p.id = training_phases.program_id AND p.user_id = auth.uid()
      )
   );

NOTIFY pgrst, 'reload schema';
