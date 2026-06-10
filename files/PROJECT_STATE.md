# 📍 Estado actual del proyecto PulseFit

> **Última actualización:** 2026-06-10 — Fases 7, 8, 9 COMPLETAS
> **Última verificación:** 402/402 tests verdes · 0 lint errors · build OK

---

## 🎯 Dónde estamos

| Fase | Estado | Notas |
|---|---|---|
| 1-3.6 | ✅ Completas | Setup + Auth + PWA + Offline + CI/CD |
| 4 | ✅ Completa | Onboarding + nutrition-engine |
| 5 | ✅ Completa + hardening | meal-generator + Edge Function |
| 6 | ✅ Completa + hardening | routine-generator + Plan Semanal Dinámico |
| **7** | **✅ COMPLETA** | Home dinámico + registro rápido (Sprints 7.1-7.4) |
| **8** | **✅ COMPLETA** | Sistema de Rescates Adaptativos |
| **9** | **✅ COMPLETA** | Progreso real con gráficas + 12 logros |
| 10 | ⏳ Pendiente | Revisión semanal con IA Groq |
| 11 | ⏳ Pendiente | Patrones implícitos + Beta cerrada |

---

## 🚨 Acciones del usuario PENDIENTES

3 migraciones por aplicar en **Supabase SQL Editor**:

| Archivo | Fase |
|---|---|
| `20260617000000_create_mood_logs.sql` | Sprint 7.4 — mood (energía + ánimo) |
| `20260618000000_seed_achievements.sql` | Fase 9 — inserta 12 logros |
| `20260619000000_recreate_rescue_events_clean.sql` | Fase 8 — recrea tabla rescue_events |

Todas son DROP+CREATE limpio o INSERT idempotente. Cero impacto en datos existentes.

### Edge Functions

| Función | Producción |
|---|---|
| `generate-meal-options` | ✅ Deployada |
| `generate-meal-plan` | ✅ Deployada |
| `generate-workout-session` | ⚠️ Posiblemente desactualizada |

---

## 🏗️ Inventario rápido tras Fases 7-9

### Frontend nuevo desde cierre de Fase 6

| Carpeta | Highlights |
|---|---|
| `features/home-engine/` | today-state (Sprint 7.1) |
| `features/achievement-engine/` | checkAchievements + queries de catálogo y user (Fase 9) |
| `features/rescue-engine/` | workout-rescues + meal-rescues + emotional-rescues + router (Fase 8) |
| `components/home/` | WelcomeCard, MealsRowCard, MacrosProgressCard, WaterTrackerCard, MoodCheckCard |
| `components/workout/` | WorkoutSessionView, RestTimer (Sprint 7.3) |
| `components/charts/` | WeightChart, WellbeingChart, StrengthChart, AdherenceCard (Fase 9) |
| `components/` raíz | MealLogDialog, WeightLogDialog, QuickActionFAB, **RescueDialog** (Fase 8) |
| `api/` nuevos | fntMealLogs, fntWaterLogs, fntWeightLogs, fntMoodLogs, fntProgress, **fntRescueEvents** |
| `hooks/` nuevos | useTodayState, useMealLogs, useWaterLogs, useWeightLogs, useMoodLogs, useProgress (×4), useAchievements (×3), **useRescue** |

### Backend

| Tipo | Cuántos |
|---|---|
| Migraciones SQL | **17** (1 schema inicial + 16 incrementales) |
| Edge Functions | **3** |
| Shared modules | **6** |

### Tablas en producción (todas con RLS por user_id)

**De usuario:**
- `profiles`, `meal_plans`, `meal_logs`, `workout_logs`
- `water_logs`, `weight_logs`, `mood_logs` (Sprint 7.2 + 7.4)
- `rescue_events` (Fase 8, recreado)
- `user_achievements`, `notifications`
- `pattern_insights`, `daily_logs`, `reviews` (legacy esperando Fase 10/11)

**Públicas (RLS SELECT true):**
- `foods_cache`, `exercises_catalog`, `restaurant_guides`, `achievements` (con 12 logros sembrados)

---

## 📊 Métricas técnicas

- **Tests:** 402 Vitest unitarios + 5 E2E specs.
- **Build size:** ~950 KiB precache.
- **Type-check:** strict OK.
- **Lint:** 0 errores, 2-3 warnings inocuos.

---

## 🔮 Próximos pasos sugeridos

Quedan **Fase 10 (Revisión semanal IA)** y **Fase 11 (Patrones implícitos + Beta cerrada)**.

- **Fase 10** — la app le muestra al usuario un resumen de su semana (qué cumplió, qué no, en qué debería ajustar el plan) generado con IA. Aprovecha TODOS los datos crudos de Fases 7-9.
- **Fase 11** — detectar patrones implícitos (ej: "comes peor los lunes", "te saltas el entrenamiento los miércoles") + preparar para beta cerrada.

---

## 📞 ¿Cómo seguir esta documentación al día?

- **CHANGELOG.md (raíz)** — actualizar después de cada commit visible al usuario.
- **PROJECT_STATE.md (este archivo)** — actualizar al cierre de cada fase.
- **MEMORY.md** — bitácora cronológica detallada.
- **.claude/skills/pulsefit/SKILL.md** — actualizar solo si se descubre una nueva convención o un bug recurrente.
