# 📍 Estado actual del proyecto PulseFit

> **Última actualización:** 2026-06-10 — Sprint 7.1 cerrado
> **Última verificación:** 402/402 tests verdes · 0 lint errors · build OK
> **HEAD:** `4fa7623` (hotfix meal_logs)

---

## 🎯 Dónde estamos

**Roadmap original (11 fases):**

| Fase | Estado | Notas |
|---|---|---|
| 1-3 | ✅ Completas | Setup + Auth + PWA + Tests |
| 3.5-3.6 | ✅ Completas | Offline + CI/CD |
| 4 | ✅ Completa | Onboarding + nutrition-engine |
| 5 | ✅ Completa + 2 sprints de hardening | meal-generator + Edge Function `generate-meal-options` |
| 6 | ✅ Completa + 2 sprints de hardening | routine-generator + Edge Function `generate-workout-session` + Plan Semanal Dinámico |
| **7** | 🟡 **30% — Sprint 7.1 cerrado** | Home dinámico con estado del día. Faltan 7.2/7.3/7.4 |
| 8 | ⏳ Pendiente | Rescates adaptativos ("Hoy no puedo") |
| 9 | ⏳ Pendiente | Progreso real con gráficas + logros |
| 10 | ⏳ Pendiente | Revisión semanal con IA |
| 11 | ⏳ Pendiente | Patrones implícitos + Beta cerrada |

---

## 🚨 Acciones del usuario PENDIENTES

### Migraciones SQL por aplicar (Supabase SQL Editor)

| Archivo | Para qué | Estado |
|---|---|---|
| `20260614000000_create_workout_logs.sql` | Sprint 3 — log de cargas | ❌ Falló (column exercise_id missing) |
| `20260615000000_create_meal_logs.sql` | Sprint 7.1 — log de comidas | ❌ Falló (column logged_at missing) |
| **`20260615000001_recreate_workout_logs_clean.sql`** | 🛠️ Hotfix — DROP+CREATE limpio | ⏳ **Pendiente** |
| **`20260615000002_recreate_meal_logs_clean.sql`** | 🛠️ Hotfix — DROP+CREATE limpio | ⏳ **Pendiente** |

Las **migraciones a correr ahora son las 2 últimas** (los hotfixes). Las primeras quedaron como historial de qué pasó pero no llegaron a aplicarse limpias.

### Edge Functions deployadas vs no deployadas

| Función | Producción | Última versión local |
|---|---|---|
| `generate-meal-options` | ✅ Deployada (Sprint 5.x) | `4fa7623` |
| `generate-meal-plan` | ✅ Deployada (Fase 6) | `4fa7623` |
| `generate-workout-session` | ⚠️ Posiblemente desactualizada | `4fa7623` |

Para **redeployar todo lo último** (después de aplicar las migraciones):

```powershell
cd "C:\Users\jeanc\OneDrive\Escritorio\pulsefit app"
npx supabase functions deploy generate-meal-plan --project-ref jhktlubijlyzswldmncu
npx supabase functions deploy generate-meal-options --project-ref jhktlubijlyzswldmncu
npx supabase functions deploy generate-workout-session --project-ref jhktlubijlyzswldmncu
```

---

## 🏗️ Inventario rápido (estado tras Sprint 7.1)

### Frontend (`client-pulsefit/src/`)

| Carpeta | Highlights |
|---|---|
| `api/` | `fntAuth`, `fntMeals` (single-meal), `fntMealPlan`, `fntMealLogs` (Sprint 7.1), `fntSwapIngredient` (Sprint 2.1), `fntWorkouts`, `fntWorkoutLogs` (Sprint 3), `fntResetAccount` (Sprint 4) |
| `components/` | Dialogs: `MealsPerDay`, `ShoppingList`, `SwapIngredient`, `LogSet`, `FavoritesEditor`, `ResetAccount`, `InfoTooltip`. `home/` con `WelcomeCard`, `MealsRowCard`, `MacrosProgressCard`, `MacroBar` |
| `features/meal-generator/` | 17 archivos: types, ingredient-pool, component-selector, nutritional-target, plate-validator, compose-prompt, fallback-templates, seed-ingredients, **seed-canonical-dishes** (Sprint 0.2), **shopping-list + shopping-units** (Sprint 1.1), **ingredient-alternatives** (Sprint 2.1), **weekly-distributor** (Fase 6) |
| `features/routine-generator/` | 11 archivos: types, session-planner, exercise-pool, exercise-selector, set-rep-calculator, compose-prompt, routine-validator, fallback-templates, seed-exercises (33 ejercicios + videos), **progression-suggester** (Sprint 3), **find-video** (Sprint 2.2) |
| `features/nutrition-engine/` | 8 archivos: tmb, get, target-kcal, macros, safety, hydration, recalc-triggers, summary |
| `features/home-engine/` | **Nuevo Sprint 7.1**: `today-state.ts` con computeTodayState + getTimeGreeting + getContextMessage |
| `features/workout-engine/` | Stub vacío (placeholder) |
| `features/rescue-engine/` | Stub vacío (placeholder) |
| `features/review-engine/` | Stub vacío (placeholder) |
| `hooks/` | `useAuth`, `useTheme`, `useErrorHandling`, `useOnlineStatus`, `useGenerateMeal`, `useGenerateWorkout`, `useMealPlan`, `useMealLogs` (Sprint 7.1), `useWorkoutLogs` (Sprint 3), **`useTodayState`** (Sprint 7.1) |

### Backend (`supabase/`)

| Tipo | Cuántos | Detalle |
|---|---|---|
| Migraciones SQL | **13** | 1 schema inicial + 12 incrementales (3 son hotfixes DROP+CREATE) |
| Edge Functions | **3** | `generate-meal-plan`, `generate-meal-options`, `generate-workout-session` |
| Shared modules | **6** | `cors`, `llm-providers`, `meal-engine`, `routine-engine`, `seed-ingredients`, `seed-exercises` |

### Tablas en producción (tras todas las migraciones)

**Con RLS por user_id:**
- `profiles` (con `meals_per_day`, `family_size`, `favorite_*`, target_kcal/macros, etc.)
- `meal_plans` (jsonb `recipes_by_meal_type` + `daily_schedule`)
- `meal_logs` (Sprint 7.1)
- `workout_logs` (Sprint 3)
- `daily_logs` (legacy, sin uso activo)
- `rescue_events` (legacy, esperando Fase 8)
- `pattern_insights` (rate limit + analytics)
- `reviews` (legacy, esperando Fase 10)
- `user_achievements`, `notifications`

**Públicas (RLS SELECT true):**
- `foods_cache`, `exercises_catalog`, `restaurant_guides`, `achievements`

**Legacy sin uso activo (candidatas a deprecar):**
- `meal_plan_items`, `workout_plan_items`, `workout_plans` — los planes ahora viven todo en jsonb dentro de `meal_plans`.

---

## ⚠️ Issues conocidos

### Activos
- **`generate-workout-session` posiblemente desactualizada**: el espejo Deno tiene cambios pendientes desde Sprint 2.2 (videos en seed-exercises). Conviene redeployar.
- **Reps del motor de rutinas pueden ser string `"8-12"`**: el cliente parsea con `Number.parseInt(String(b.reps).match(/\d+/)?.[0] ?? '8', 10)` cuando los pasa a `suggestNextWeight`.
- **Tablas legacy** (`meal_plan_items`, `workout_plan_items`, `workout_plans`, `daily_logs`): existen del schema inicial pero ninguna Edge Function las usa. Pendiente decidir si limpiar.

### Resueltos en este sprint
- ✅ ERROR 42703 `column exercise_id does not exist` → hotfix `20260615000001`
- ✅ ERROR 42703 `column logged_at does not exist` → hotfix `20260615000002`

---

## 📊 Métricas técnicas

- **Tests:** 402 (vs 113 al cerrar Fase 6) — +289 en los sprints 0-7.1.
- **Build size:** ~900 KiB precache.
- **Type-check:** strict OK.
- **Lint:** 0 errores, 2 warnings inocuos de react-refresh en `form.tsx` (pattern shadcn).
- **Cobertura motores críticos:** `weekly-distributor` 233 tests, `meal-generator` 43, `routine-generator` 29, `nutrition-engine` 30, `today-state` 13, `progression-suggester` 11, `shopping-list` 13, `find-video` 7.

---

## 🔮 Próximos pasos sugeridos

1. **AHORA:** Aplicar las 2 migraciones hotfix → probar el log de comida desde Home → probar el log de set desde Registrar.
2. **Sprint 7.2:** Dialog de 3 opciones al tap'ear una comida del Home + búsqueda de alimentos para "comí otra cosa".
3. **Sprint 7.3:** `WorkoutSessionPage` con cronómetro + checkboxes por set + FAB de Quick Actions.
4. **Sprint 7.4:** Mood check + microinteracciones + tests E2E del flow.

Después de 7.x:
- **Fase 9 (Progreso)** sería el siguiente pico de impacto — ya tenemos los datos crudos en logs.
- **Fase 8 (Rescates)** es valioso pero menos urgente sin Fase 9 lista.

---

## 📞 ¿Cómo seguir esta documentación al día?

- **CHANGELOG.md (raíz)** — actualizar después de cada commit visible al usuario.
- **PROJECT_STATE.md (este archivo)** — actualizar al cierre de cada sprint con la fecha + commit HEAD.
- **MEMORY.md** — bitácora cronológica detallada (no es el lugar para el status, ese es este archivo).
- **.claude/skills/pulsefit/SKILL.md** — actualizar solo si se descubre una nueva convención o un bug recurrente.
