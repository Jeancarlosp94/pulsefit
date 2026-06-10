-- Fase 9: seed inicial de logros con tono compasivo (firmado por Lucía + Valentina).
-- Sin logros de tipo "perdiste X kg" para no reforzar obsesión con balanza.
-- Premiamos consistencia, flexibilidad y autocuidado.

INSERT INTO achievements (code, name, description, icon, criteria) VALUES
   ('first_week', 'Primera semana', 'Completaste tu primera semana en PulseFit', '🌱', '{"days_active": 7}'::jsonb),
   ('first_workout', 'Primer entrenamiento', 'Completaste tu primer entrenamiento registrado', '💪', '{"workouts_completed": 1}'::jsonb),
   ('first_meal_log', 'Primera comida registrada', 'Registraste tu primera comida del plan', '🥗', '{"meals_logged": 1}'::jsonb),
   ('streak_3', 'Tres días seguidos', 'Registraste 3 días seguidos', '✨', '{"streak_days": 3}'::jsonb),
   ('streak_7', 'Una semana al hilo', 'Registraste 7 días seguidos', '🔥', '{"streak_days": 7}'::jsonb),
   ('streak_30', 'Un mes constante', 'Registraste 30 días en total', '⭐', '{"streak_days": 30}'::jsonb),
   ('hydration_week', 'Bien hidratada/o', 'Llegaste a tu meta de agua 7 días', '💧', '{"hydration_target_days": 7}'::jsonb),
   ('mood_check_week', 'Te escuchaste', 'Registraste tu ánimo 7 días seguidos', '🌿', '{"mood_check_days": 7}'::jsonb),
   ('weight_log_month', 'Constancia consciente', 'Registraste tu peso al menos 4 veces en un mes', '⚖️', '{"weight_logs_month": 4}'::jsonb),
   ('first_pr', 'Primer record personal', 'Subiste carga en un ejercicio', '🏆', '{"first_pr": true}'::jsonb),
   ('balanced_week', 'Semana balanceada', 'Cumpliste >70% adherencia 1 semana', '⚖️', '{"adherence_week": 70}'::jsonb),
   ('three_months', 'Tres meses', 'Llevas 3 meses de viaje', '🌳', '{"days_active": 90}'::jsonb)
ON CONFLICT (code) DO NOTHING;

NOTIFY pgrst, 'reload schema';
