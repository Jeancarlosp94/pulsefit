# 📍 Estado actual del proyecto PulseFit

> **Última actualización:** 2026-06-10 — Fase 7 COMPLETA (Sprint 7.4 cerrado)
> **Última verificación:** 402/402 tests verdes · 0 lint errors · build OK
> **HEAD:** push pendiente de Sprint 7.4

---

## 🎯 Dónde estamos

**Roadmap original (11 fases):**

| Fase | Estado | Notas |
|---|---|---|
| 1-3 | ✅ Completas | Setup + Auth + PWA + Tests |
| 3.5-3.6 | ✅ Completas | Offline + CI/CD |
| 4 | ✅ Completa | Onboarding + nutrition-engine |
| 5 | ✅ Completa + 2 sprints de hardening | meal-generator + Edge Function `generate-meal-options` |
| 6 | ✅ Completa + 2 sprints de hardening | routine-generator + Edge Function + Plan Semanal Dinámico |
| **7** | **✅ COMPLETA** (7.1 / 7.2 / 7.3 / 7.4) | Home dinámico + registro rápido (comida 3 taps + agua + peso + ejecución entrenamiento + mood + microinteracciones + FAB) |
| 8 | ⏳ Pendiente | Rescates adaptativos ("Hoy no puedo") |
| 9 | ⏳ Pendiente | Progreso real con gráficas + logros |
| 10 | ⏳ Pendiente | Revisión semanal con IA |
| 11 | ⏳ Pendiente | Patrones implícitos + Beta cerrada |

---

## 🚨 Acciones del usuario PENDIENTES

### Una migración por aplicar

| Archivo | Para qué | Estado |
|---|---|---|
| `20260617000000_create_mood_logs.sql` | Sprint 7.4 — registro de ánimo y energía | ⏳ **Pendiente** |

### Migraciones recientes ya aplicadas ✅

- `20260615000001_recreate_workout_logs_clean.sql` (Sprint 3 hotfix)
- `20260615000002_recreate_meal_logs_clean.sql` (Sprint 7.1 hotfix)
- `20260616000000_create_water_and_weight_logs.sql` (Sprint 7.2)

### Edge Functions

| Función | Producción |
|---|---|
| `generate-meal-options` | ✅ Deployada |
| `generate-meal-plan` | ✅ Deployada |
| `generate-workout-session` | ⚠️ Posiblemente desactualizada (espejo Deno con cambios pendientes desde Sprint 2.2) |

Redeploy opcional:
```powershell
cd "C:\Users\jeanc\OneDrive\Escritorio\pulsefit app"
npx supabase functions deploy generate-workout-session --project-ref jhktlubijlyzswldmncu
```

---

## 🏗️ Inventario rápido (estado tras Sprint 7.4)

### Frontend (`client-pulsefit/src/`)

| Carpeta | Highlights tras Sprint 7 |
|---|---|
| `api/` | `fntAuth`, `fntMeals`, `fntMealPlan` (+ `fntDeleteCurrentMealPlan` Sprint 7.3), `fntMealLogs` (Sprint 7.1), `fntSwapIngredient`, `fntWorkouts`, `fntWorkoutLogs`, `fntResetAccount`, **`fntWaterLogs` + `fntWeightLogs`** (Sprint 7.2), **`fntMoodLogs`** (Sprint 7.4) |
| `components/` | Dialogs: `MealsPerDay`, `ShoppingList`, `SwapIngredient`, `LogSet`, `FavoritesEditor`, `ResetAccount`, `InfoTooltip`, **`MealLogDialog`** (Sprint 7.2), **`WeightLogDialog`** (Sprint 7.2), **`QuickActionFAB`** (Sprint 7.3). Subcarpetas: `home/` con `WelcomeCard`, `MealsRowCard`, `MacrosProgressCard`, `MacroBar`, **`WaterTrackerCard`** (Sprint 7.2), **`MoodCheckCard`** (Sprint 7.4). `workout/` con **`WorkoutSessionView`** + **`RestTimer`** (Sprint 7.3) |
| `features/meal-generator/` | 17 archivos: types, ingredient-pool, component-selector, nutritional-target, plate-validator, compose-prompt, fallback-templates, seed-ingredients, **seed-canonical-dishes** (Sprint 0.2), **shopping-list + shopping-units** (Sprint 1.1), **ingredient-alternatives** (Sprint 2.1), **weekly-distributor** (Fase 6) |
| `features/routine-generator/` | 11 archivos: types, session-planner, exercise-pool, exercise-selector, set-rep-calculator, compose-prompt, routine-validator, fallback-templates, seed-exercises (33 ejercicios + videos), **progression-suggester** (Sprint 3), **find-video** (Sprint 2.2) |
| `features/nutrition-engine/` | 8 archivos: tmb, get, target-kcal, macros, safety, hydration, recalc-triggers, summary |
| `features/home-engine/` | Sprint 7.1: `today-state.ts` con computeTodayState + getTimeGreeting + getContextMessage |
| `features/workout-engine/` | Stub vacío (Fase 8/9) |
| `features/rescue-engine/` | Stub vacío (Fase 8) |
| `features/review-engine/` | Stub vacío (Fase 10) |
| `hooks/` | `useAuth`, `useTheme`, `useErrorHandling`, `useOnlineStatus`, `useGenerateMeal`, `useGenerateWorkout`, `useMealPlan` (+ `useDeleteMealPlan` Sprint 7.3), `useMealLogs` (Sprint 7.1), `useWorkoutLogs` (Sprint 3), `useTodayState` (Sprint 7.1), **`useWaterLogs` + `useWeightLogs`** (Sprint 7.2), **`useMoodLogs`** (Sprint 7.4) |

### Backend (`supabase/`)

| Tipo | Cuántos | Detalle |
|---|---|---|
| Migraciones SQL | **15** | 1 schema inicial + 14 incrementales (3 hotfixes destructivos) |
| Edge Functions | **3** | `generate-meal-plan`, `generate-meal-options`, `generate-workout-session` |
| Shared modules | **6** | `cors`, `llm-providers`, `meal-engine`, `routine-engine`, `seed-ingredients`, `seed-exercises` |

### Tablas en producción

**Con RLS por user_id:**
- `profiles` (`meals_per_day`, `family_size`, `favorite_*`, target_kcal/macros, etc.)
- `meal_plans` (jsonb `recipes_by_meal_type` + `daily_schedule`)
- `meal_logs` (Sprint 7.1)
- `workout_logs` (Sprint 3)
- `water_logs` (Sprint 7.2) — filas con delta_glasses
- `weight_logs` (Sprint 7.2) — UNIQUE por día
- `mood_logs` (Sprint 7.4) — UNIQUE por día
- `pattern_insights` (rate limit + analytics)
- `daily_logs`, `rescue_events`, `reviews` (legacy del schema inicial — esperando Fases 8/10)
- `user_achievements`, `notifications`

**Públicas (RLS SELECT true):**
- `foods_cache`, `exercises_catalog`, `restaurant_guides`, `achievements`

**Legacy sin uso activo:**
- `meal_plan_items`, `workout_plan_items`, `workout_plans` — los planes ahora viven en jsonb dentro de `meal_plans`.

---

## ⚠️ Issues conocidos

### Activos
- **`generate-workout-session` posiblemente desactualizada**: espejo Deno con cambios pendientes desde Sprint 2.2 (videos en seed-exercises). Conviene redeployar.
- **Tablas legacy** (`meal_plan_items`, `workout_plan_items`, `workout_plans`, `daily_logs`): existen del schema inicial pero ninguna Edge Function las usa.

### Resueltos en Fase 7
- ✅ ERROR 42703 `column exercise_id does not exist` → hotfix `20260615000001`
- ✅ ERROR 42703 `column logged_at does not exist` → hotfix `20260615000002`
- ✅ HomePage placeholder "Fase 7" → reemplazado por dashboard real reactivo
- ✅ "tap único registra al instante" → reemplazado por dialog de 3 opciones

---

## 📊 Métricas técnicas

- **Tests:** 402 (+13 del today-state, +11 del progression-suggester, +13 del shopping-list, +7 del find-video vs Fases anteriores).
- **Build size:** ~920 KiB precache.
- **Type-check:** strict OK.
- **Lint:** 0 errores, 2-3 warnings inocuos.
- **Cobertura motores críticos:** `weekly-distributor` 233, `meal-generator` 43, `routine-generator` 29, `nutrition-engine` 30, `today-state` 13, `progression-suggester` 11, `shopping-list` 13, `find-video` 7.
- **Tests E2E:** 5 specs (auth.spec + nuevo home-flow.spec del Sprint 7.4).

---

## 🔮 Próximos pasos sugeridos

1. **AHORA:** Aplicar `20260617000000_create_mood_logs.sql` → probar Home con MoodCheckCard + animaciones suaves al cargar.
2. **Después:** Elegir Fase 8 (Rescates: "Hoy no puedo") o Fase 9 (Progreso real con gráficas usando datos crudos ya capturados de mood/weight/water/meals/workouts).
3. **Recomendación personal:** Fase 9 primero porque tenemos TODOS los datos crudos para alimentar gráficas reales. Fase 8 (rescates) puede esperar hasta tener métricas que validen el comportamiento.

---

## 📞 ¿Cómo seguir esta documentación al día?

- **CHANGELOG.md (raíz)** — actualizar después de cada commit visible al usuario.
- **PROJECT_STATE.md (este archivo)** — actualizar al cierre de cada sprint con la fecha + commit HEAD.
- **MEMORY.md** — bitácora cronológica detallada (no es el lugar para el status, ese es este archivo).
- **.claude/skills/pulsefit/SKILL.md** — actualizar solo si se descubre una nueva convención o un bug recurrente.
