-- ============================================================================
-- PulseFit · Esquema inicial (Fase 3)
-- ----------------------------------------------------------------------------
-- Tablas, RLS, triggers y catálogos públicos. Sigue al 100% el spec en
-- files/guia-completa.md sección "📚 Esquema SQL completo".
-- ============================================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USUARIOS Y PERFIL
-- ============================================
CREATE TABLE profiles (
   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
   email TEXT UNIQUE,
   name TEXT,
   age INT CHECK (age >= 13 AND age <= 120),
   sex TEXT CHECK (sex IN ('male', 'female', 'prefer_not_to_say')),
   height_cm DECIMAL(5,2),
   initial_weight_kg DECIMAL(5,2),
   current_weight_kg DECIMAL(5,2),
   target_weight_kg DECIMAL(5,2),
   target_date DATE,
   goal TEXT CHECK (goal IN ('lose', 'gain', 'maintain', 'feel_better')),
   activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
   fitness_level TEXT CHECK (fitness_level IN ('absolute_beginner', 'beginner', 'intermediate', 'advanced')),
   available_days INT[],
   available_minutes INT,
   equipment TEXT[],
   cooks_at_home TEXT CHECK (cooks_at_home IN ('yes', 'sometimes', 'rarely')),
   dietary_restrictions TEXT[],
   allergies TEXT,
   disliked_foods TEXT[],
   budget_level TEXT CHECK (budget_level IN ('low', 'medium', 'high')),
   medical_conditions TEXT[],
   tmb DECIMAL(7,2),
   get_kcal DECIMAL(7,2),
   target_kcal DECIMAL(7,2),
   target_protein_g DECIMAL(6,2),
   target_carbs_g DECIMAL(6,2),
   target_fats_g DECIMAL(6,2),
   onboarding_completed BOOLEAN DEFAULT FALSE,
   region TEXT DEFAULT 'LATAM',
   locale TEXT DEFAULT 'es',
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PLANES DE COMIDA
-- ============================================
CREATE TABLE meal_plans (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   week_start_date DATE NOT NULL,
   is_active BOOLEAN DEFAULT TRUE,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_meal_plans_user_active ON meal_plans(user_id, is_active);

CREATE TABLE meal_plan_items (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
   day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
   meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack_am', 'snack_pm')),
   meal_name TEXT NOT NULL,
   ingredients JSONB,
   kcal DECIMAL(7,2),
   protein_g DECIMAL(6,2),
   carbs_g DECIMAL(6,2),
   fats_g DECIMAL(6,2),
   prep_time_min INT,
   difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
   recipe_steps TEXT[]
);

-- ============================================
-- PLANES DE ENTRENAMIENTO
-- ============================================
CREATE TABLE workout_plans (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   week_start_date DATE NOT NULL,
   is_active BOOLEAN DEFAULT TRUE,
   routine_type TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_workout_plans_user_active ON workout_plans(user_id, is_active);

CREATE TABLE workout_plan_items (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
   day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
   session_name TEXT,
   estimated_duration_min INT,
   exercises JSONB
);

-- ============================================
-- REGISTROS DIARIOS
-- ============================================
CREATE TABLE daily_logs (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   log_date DATE NOT NULL,
   weight_kg DECIMAL(5,2),
   energy_level INT CHECK (energy_level BETWEEN 1 AND 5),
   mood_level INT CHECK (mood_level BETWEEN 1 AND 5),
   sleep_hours DECIMAL(3,1),
   water_ml INT,
   steps INT,
   notes TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   UNIQUE(user_id, log_date)
);
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);

CREATE TABLE meal_logs (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   log_date DATE NOT NULL,
   meal_type TEXT,
   status TEXT CHECK (status IN ('planned_completed', 'substituted', 'skipped', 'extra')),
   planned_item_id UUID REFERENCES meal_plan_items(id),
   actual_meal_name TEXT,
   actual_kcal DECIMAL(7,2),
   actual_protein_g DECIMAL(6,2),
   actual_carbs_g DECIMAL(6,2),
   actual_fats_g DECIMAL(6,2),
   photo_url TEXT,
   notes TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, log_date DESC);

CREATE TABLE workout_logs (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   log_date DATE NOT NULL,
   planned_session_id UUID,
   status TEXT CHECK (status IN ('completed', 'partial', 'rescued', 'skipped')),
   duration_min INT,
   exercises_completed JSONB,
   rpe_average DECIMAL(3,1),
   pain_reported TEXT[],
   notes TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, log_date DESC);

-- ============================================
-- RESCATES Y PATRONES
-- ============================================
CREATE TABLE rescue_events (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   event_date DATE NOT NULL,
   event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   trigger_type TEXT CHECK (trigger_type IN ('workout_skip', 'meal_change', 'no_cooking', 'eating_out', 'low_mood', 'no_energy', 'injury', 'craving')),
   reason TEXT,
   original_plan JSONB,
   alternatives_offered JSONB,
   alternative_chosen JSONB,
   user_completed BOOLEAN
);
CREATE INDEX idx_rescue_events_user ON rescue_events(user_id, event_date DESC);

CREATE TABLE pattern_insights (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   pattern_type TEXT,
   description TEXT,
   data JSONB,
   detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   applied BOOLEAN DEFAULT FALSE
);

-- ============================================
-- REVISIONES SEMANALES
-- ============================================
CREATE TABLE reviews (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   review_date DATE NOT NULL,
   period_start DATE,
   period_end DATE,
   metrics JSONB,
   observations TEXT[],
   proposed_changes JSONB,
   user_decision TEXT CHECK (user_decision IN ('accepted_all', 'partial', 'rejected', 'pending')),
   applied_changes JSONB,
   ai_message TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CATÁLOGOS PÚBLICOS
-- ============================================
CREATE TABLE foods_cache (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   external_id TEXT,
   source TEXT CHECK (source IN ('openfoodfacts', 'usda', 'manual', 'local')),
   name TEXT NOT NULL,
   brand TEXT,
   serving_size_g DECIMAL(7,2),
   kcal_per_100g DECIMAL(7,2),
   protein_per_100g DECIMAL(6,2),
   carbs_per_100g DECIMAL(6,2),
   fats_per_100g DECIMAL(6,2),
   region TEXT,
   search_count INT DEFAULT 0,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_foods_search ON foods_cache USING gin(to_tsvector('spanish', name));

CREATE TABLE exercises_catalog (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   external_id TEXT,
   name TEXT NOT NULL,
   muscle_groups TEXT[],
   equipment_required TEXT[],
   difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
   video_url TEXT,
   gif_url TEXT,
   description TEXT,
   form_tips TEXT[],
   alternatives UUID[]
);

CREATE TABLE restaurant_guides (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   cuisine_type TEXT NOT NULL,
   recommended_orders JSONB,
   avoid_list TEXT[],
   tips TEXT
);

-- ============================================
-- GAMIFICACIÓN
-- ============================================
CREATE TABLE achievements (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   code TEXT UNIQUE NOT NULL,
   name TEXT NOT NULL,
   description TEXT,
   icon TEXT,
   criteria JSONB
);

CREATE TABLE user_achievements (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   achievement_id UUID REFERENCES achievements(id),
   unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   UNIQUE(user_id, achievement_id)
);

CREATE TABLE notifications (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   type TEXT,
   title TEXT,
   body TEXT,
   scheduled_for TIMESTAMP WITH TIME ZONE,
   sent_at TIMESTAMP WITH TIME ZONE,
   read_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Datos privados por usuario.
CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_meal_plans" ON meal_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_meal_plan_items" ON meal_plan_items FOR ALL USING (
   EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_items.plan_id AND meal_plans.user_id = auth.uid()
   )
);
CREATE POLICY "users_own_workout_plans" ON workout_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_workout_plan_items" ON workout_plan_items FOR ALL USING (
   EXISTS (
      SELECT 1 FROM workout_plans
      WHERE workout_plans.id = workout_plan_items.plan_id AND workout_plans.user_id = auth.uid()
   )
);
CREATE POLICY "users_own_daily_logs" ON daily_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_meal_logs" ON meal_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_workout_logs" ON workout_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_rescue_events" ON rescue_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_pattern_insights" ON pattern_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_reviews" ON reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Catálogos públicos (lectura libre).
CREATE POLICY "public_foods_read" ON foods_cache FOR SELECT USING (true);
CREATE POLICY "public_exercises_read" ON exercises_catalog FOR SELECT USING (true);
CREATE POLICY "public_restaurants_read" ON restaurant_guides FOR SELECT USING (true);
CREATE POLICY "public_achievements_read" ON achievements FOR SELECT USING (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Crear perfil automáticamente al registrarse un usuario en auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
   INSERT INTO public.profiles (id, email, name)
   VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
   );
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mantener `updated_at` actualizado automáticamente en cada UPDATE.
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
   BEFORE UPDATE ON profiles
   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
