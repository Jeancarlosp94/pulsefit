# 📜 Changelog — PulseFit

Todos los cambios notables de este proyecto se documentan aquí.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
La versión sigue el roadmap de fases (no semver tradicional).

---

## [Documentación] — 2026-06-10

### 📚 Agregado
- `CHANGELOG.md` (raíz, este archivo) — historial completo Sprint 0 → 7.1.
- `files/PROJECT_STATE.md` — snapshot one-pager del estado actual.
- `.claude/skills/pulsefit/SKILL.md` — skill local con convenciones + 6 bugs recurrentes documentados.
- `files/MEMORY.md` actualizado con bitácora comprimida de los 8 sprints.

**Commit:** `7b0fba2`

---

## [Sprint 7.3] — 2026-06-10

### ✨ Agregado (Sprint 7.3A — Vista de ejecución de entrenamiento)
- **`WorkoutSessionView`** completo: una vez que se generó la rutina, el botón **"Empezar entrenamiento"** activa una vista enfocada en la ejecución:
  - Header sticky con progreso "2/5 ejercicios" + botón Salir con confirmación.
  - **Lista vertical de bloques** — cada bloque expandido por default con su tip + link "Ver técnica" + "Última vez: 3×8 @ 22.5 kg" si hay historial.
  - **Por cada serie**: fila con inputs separados de **peso (kg, step 0.25)** y **reps logradas** + botón ✓ que la marca como hecha (visual primary + bloquea edición).
  - **Cronómetro de descanso flotante** (`RestTimer`): aparece al marcar una serie como hecha y cuenta hacia atrás desde `rest_sec` del bloque. Cambia a color primary cuando faltan ≤ 5 segundos. Cierre manual con X.
  - **Selector de RPE** (10 botones 1-10) que aparece solo cuando TODAS las series del ejercicio están hechas + botón **"Guardar ejercicio"** que llama `useLogSet` una vez con el resumen (sets_completed = doneSets.length, reps_completed = promedio, weight_kg = máximo).
  - Card final **"¡Sesión completa! 💪"** cuando todos los ejercicios fueron guardados.
  - Warmup y cool-down se muestran informativos en los extremos.
- Estado de la sesión vive en el componente (no se persiste si el usuario sale a mitad). Los ejercicios YA guardados quedan en `workout_logs`.
- Sugerencia de progresión inicial (Sprint 3) pre-rellena el peso del primer set.

### ✨ Agregado (Sprint 7.3B — Limpiar plan + FAB Quick Actions)
- **Botón "Limpiar plan"** en PlanPage (al lado de "Lista de compras"). Dialog de confirmación. `fntDeleteCurrentMealPlan` → `DELETE FROM meal_plans WHERE user_id = auth.uid()`. Después del DELETE, el cache de react-query se limpia y vuelve a aparecer "Generar mi plan". **Solo toca `meal_plans` — logs y perfil quedan intactos.**
- **`QuickActionFAB`** en HomePage (botón flotante coral en esquina inferior derecha): tap → menú de 3 acciones:
  - 💧 **+ Agua**: suma 1 vaso al instante (optimistic update del `WaterTrackerCard`).
  - ⚖️ **Peso**: abre `WeightLogDialog`.
  - 🏋️ **Entrenar**: navega a `/registrar`.
- Backdrop con blur cuando está abierto. El botón principal rota 45° y se convierte en X.

**Commit:** próximo push

---

## [Sprint 7.2] — 2026-06-10

### ✨ Agregado (Sprint 7.2A — Registro de comida en 3 taps)
- **`MealLogDialog`** con flujo de 3 botones grandes:
  - ✅ **Sí, lo comí** → tap único, registra `planned` con macros del plan.
  - 🔄 **Comí algo distinto** → muestra las otras recetas del mismo meal_type del plan + opción "Otra cosa — describe" con form de macros custom.
  - ❌ **No comí esta comida** → registra `skipped` sin juicio.
- `HomePage` ahora abre el dialog en lugar de hacer log directo al tap.

### ✨ Agregado (Sprint 7.2B — Hidratación + peso)
- **Migración `water_logs` y `weight_logs`** con DROP+CREATE limpio (siguiendo el patrón documentado en el skill para evitar el bug `IF NOT EXISTS`):
  - `water_logs`: filas con `delta_glasses` ∈ {-1, 1}. La suma del día se calcula en cliente. Permite deshacer sin lógica extra.
  - `weight_logs`: una entrada por día con `UNIQUE(user_id, log_date)`. Soporta upsert. `weight_kg` validado 20-300 kg.
- **`WaterTrackerCard`** en HomePage: fila visual de chips de vasos (target derivado de peso × 35 ml ÷ 250 ml, default 8). Botones `+ / -` con **optimistic update** — el contador reacciona al instante. Toast "Vaso registrado 💧" en cada tap positivo.
- **`WeightLogDialog`** abierto desde card "Registrar peso" del Home: input con step 0.1 kg, muestra delta vs último registro ("+0.3 kg vs 2026-06-08"), notas opcionales, mensaje compasivo de cierre ("Mira la tendencia, no un solo número 🌿"). Upsert vía `onConflict: 'user_id,log_date'`.
- API + hooks: `fntWaterLogs.ts`, `fntWeightLogs.ts`, `useTodayWater`, `useAddWater` (con optimistic), `useRecentWeights`, `useLogWeight`.

### Acciones del usuario
- Aplicar migración `20260616000000_create_water_and_weight_logs.sql` en Supabase SQL Editor.

---

## [Sprint 7.1] — 2026-06-10

### ✨ Agregado
- **Fase 7 — Home dinámico + estado del día**: HomePage rediseñado con `WelcomeCard` (saludo dinámico por hora del día + mensaje contextual), `MealsRowCard` (scroll horizontal de comidas de hoy con estado visual), `MacrosProgressCard` (4 barras de progreso reactivas), `MacroBar` reusable.
- **Motor `features/home-engine/`**: `computeTodayState(plan, logs, now)` calcula el snapshot del día (dayIndex con rotación, meals con status pending/planned/substituted/skipped, macros consumidas).
- **Helpers**: `getTimeGreeting(hour)` y `getContextMessage(state)` en español neutro LATAM.
- **Nueva tabla SQL `meal_logs`**: registro de decisiones (`planned` | `substituted` | `skipped`) con plan_id, day_index, meal_type, macros y notes. RLS por user_id.
- **API + hooks**: `fntMealLogs.ts`, `useTodayMealLogs`, `useLogMeal`, `useDeleteMealLog`, `useTodayState` (compuesto).
- 13 tests nuevos para `today-state` (escenarios: sin plan / con logs / skipped no suma / logs de otro día / rotación dayIndex).

### 🐛 Fix
- Hotfix `workout_logs`: ERROR 42703 "column exercise_id does not exist" → migración `20260615000001_recreate_workout_logs_clean.sql` con DROP+CREATE limpio.
- Hotfix `meal_logs`: ERROR 42703 "column logged_at does not exist" → migración `20260615000002_recreate_meal_logs_clean.sql` con DROP+CREATE limpio.

### Acciones del usuario
- Aplicar migraciones `20260615000000` + `20260615000001` + `20260615000002` en Supabase SQL Editor.

**Commits:** `5ac9458`, `9e69789`, `4fa7623`

---

## [Sprint 4] — 2026-06-09

### ✨ Agregado
- **Editor de favoritos en Perfil** (`FavoritesEditor`): card "Mis gustos" con chips multi-select de 6 cocinas y 28 ingredientes destacados. Para usuarios que pasaron el onboarding sin esa sección.
- **Reset de cuenta** (`ResetAccountDialog`): reemplaza el botón "Eliminar mi cuenta" que mostraba "Pronto podrás...". Dialog con 2 opciones:
  - 🔄 Solo rehacer el cuestionario (conserva planes y logs)
  - 🗑️ Borrar todo y empezar de cero (borra `meal_plans`, `workout_logs`, preferencias)
- API `fntResetAccount.ts` con `fntResetOnboardingOnly` + `fntResetAllData`.

### 🌎 Cambiado
- **Sweep masivo voseo → español neutro LATAM** (tuteo):
  - `vos → tú`, `tenés → tienes`, `podés → puedes`, `querés → quieres`
  - `tocá → toca`, `marcá → marca`, `empezá → empieza`, `probá → prueba`
  - `cocinás → cocinas`, `sentís → sientes`, `rendís → rindes`, `necesitás → necesitas`
  - `configuralo → configúralo`, `editá → edita`, `volvé → vuelve`, `esperá → espera`
- 10+ archivos afectados: `InfoTooltip` (5 entradas del glosario), `ShoppingListDialog`, `SwapIngredientDialog`, `PlanPage`, `HomePage`, `ProfilePage`, `Step5Diet`, `RegistrarPage`, `useErrorHandling`, `progression-suggester`.

**Commit:** `cf8608d`

---

## [Sprint 3] — 2026-06-09

### ✨ Agregado
- **Log de cargas + progresión automática (double progression light)**:
  - Tabla SQL `workout_logs` con RLS por user_id (sets 1-10, reps 1-50, weight 0-500, RPE 1-10).
  - `progression-suggester.ts` con 4 ramas: `first_time` / `progress` (+2.5 kg compounds / +1.25 kg accesorios / +1 rep bodyweight) / `maintain` (último RPE > target) / `deload` (-10% si > 14 días sin entrenar).
  - Respeta `isDeloadWeek` del programa.
  - `LogSetDialog`: form con series + reps + peso (step 0.25 kg) + selector RPE 1-10 + notas.
  - RegistrarPage muestra "Última vez: 3×8 @ 22.5 kg (RPE 7)" + box con sugerencia contextual + botón "Registrar set" por ejercicio.
- 11 tests nuevos del `suggestNextWeight` cubriendo todas las ramas.

### Acciones del usuario
- Aplicar migración `20260614000000_create_workout_logs.sql`.

**Commit:** `53a4fbb`

---

## [Sprint 2] — 2026-06-09

### ✨ Agregado (Sprint 2.1 — Sustitución de ingrediente)
- **Sustituir 1 ingrediente sin regenerar el plan completo** — pedido por Mariana, Diego y Joaquín:
  - `ItfMealAssignment.componentOverrides`: override por día específico, no afecta otros días con la misma receta.
  - `findIngredientAlternatives()`: filtra por categoría + meal_type + excluded, prioriza favoritos del usuario.
  - `rescaleGrams()`: mantiene kcal aproximadas del slot al cambiar ingrediente.
  - `SwapIngredientDialog`: hasta 6 alternativas con ⭐ para favoritos.
  - `fntSwapIngredient` hace UPDATE de `meal_plans.daily_schedule` (RLS). Sin Edge Function, latencia < 300 ms.

### ✨ Agregado (Sprint 2.2 — Pool ejercicios + videos)
- **Pool de ejercicios 21 → 33**: + sentadilla búlgara, hip thrust DB, kettlebell swing, face-pull, band pull-apart, dead bug, bird dog, plancha lateral, hollow hold, curl bíceps, extensión tríceps, calf raise.
- **Videos curados** (`videoUrl` opcional en `ItfExercise`): YouTube links de Squat University / Jeff Nippard / FitnessFAQs / AthleanX en TODOS los 33 ejercicios.
- `findVideoUrlForExercise(name)` con match normalizado (case-insensitive, sin acentos, fuzzy substring).
- RegistrarPage muestra link "▶ Ver técnica en YouTube" por bloque si encuentra match.

**Commits:** `066c03e`, `ea91455`

---

## [Sprint 1] — 2026-06-09

### ✨ Agregado (Sprint 1.1 — Lista de compras)
- **Lista de compras automática** — pedida por Mariana + Diego + Joaquín:
  - `shopping-units.ts`: 60+ unidades comerciales LATAM ("3 pechugas (~600g)", "1 cebolla", "1 kg de arroz").
  - `shopping-list.ts`: agrega gramos por ingrediente sobre todos los días del plan, agrupa en 6 secciones por recorrido típico de super (🥩 → 🧀 → 🥫 → 🥬 → 🍎 → 🌾).
  - `ShoppingListDialog`: selector "¿Para cuántas personas cocinas?", tap-to-check items "ya tengo en casa", botón Copiar (clipboard) + Compartir (Web Share API con fallback).
- 13 tests nuevos.

### ✨ Agregado (Sprint 1.2 — Modo familia + tooltips)
- Migración `family_size` (1-8) en `profiles`.
- Card "¿Para cuántas personas cocinas?" en Perfil con 4 presets.
- **`InfoTooltip` reusable** con glosario de 10 entradas: kcal, macros, protein, carbs, fats, rpe, deload, tmb, get, target_kcal. Aplicado en Perfil ("Tus números"), Plan (kcal del día), Registrar (RPE objetivo).

**Commits:** `8cb3aa7`, `a398dff`

---

## [Sprint 0] — 2026-06-09

### ✨ Agregado (Sprint 0.1 — Validator + pool)
- `FORBIDDEN_PROCESSED_FOODS` reemplaza la lista genérica que bloqueaba `queso/mantequilla/jamón` (rompiendo cocina LATAM). Ahora bloquea solo: queso amarillo/cheddar/procesado/americano, margarina, tocino, panceta, jamón serrano/ibérico/crudo/ahumado, salchicha, chorizo, mortadela, salami, pepperoni, azúcar añadida/refinada.
- Pool de ingredientes 45 → 62: agrega cebolla, pimentón rojo, zanahoria, choclo, ají dulce, vainita, yuca, aceite de girasol, queso fresco, ricotta, mantequilla sin sal, jamón cocido low-sodium, +6 más.
- Re-tier: tofu / cottage / whey / granola / salmón → `high`; aguacate → `cheap`.
- Steps subidos a 20-250 chars.

### ✨ Agregado (Sprint 0.2 — Gustos personales)
- Migración `20260612000000_add_user_preferences.sql`: `favorite_cuisines`, `favorite_ingredient_ids` en `profiles`.
- Step 5 del onboarding ampliado con chips multi-select de 6 cocinas (Andina, Mexicana, Cono Sur, Brasileña, Asiática, Mediterránea) y 28 ingredientes destacados.
- **Recetario canónico `seed-canonical-dishes.ts`** con 28 platos LATAM firmados por Diego (lomo saltado, ceviche, chilaquiles, milanesa al horno, feijoada, pollo teriyaki, salmón al horno, frittata, etc.).
- `selectMultipleComponents` con boost de favoritos (sortFavFirst dentro de cada categoría).

### ✨ Agregado (Sprint 0.3 — UI quick wins)
- Fix banner Home spam (`needsMealsConfig` ya no aparece para quien eligió 3 conscientemente).
- HomePage limpio: 3 atajos clicables (Plan / Entrenar / Perfil) en lugar del placeholder "Fase 7".
- TopBar saludo neutro "Hola 👋" en lugar de "Bienvenida" femenino asumido.
- BottomNav: tab Progreso retirado hasta tener gráficas reales (Mariana + Joaquín lo reportaron como motivo de cerrar la app).

**Commits:** `11604ce`, `cad096c`, `aa8b8dc`

---

## [Fase 6] — 2026-06-08 — Plan Semanal Dinámico

### ✨ Agregado
- **Motor `routine-generator/` completo** (10 archivos + 29 tests):
  - 9 patrones de movimiento (squat, hinge, push_h/v, pull_h/v, lunge, core, carry).
  - `planSession` decide focus por nivel × días disponibles.
  - `set-rep-calculator` aplica reglas de Carlos (proteína/reps por nivel, descansos por rango).
  - 21 ejercicios iniciales (después ampliado a 33 en Sprint 2.2).
- **Edge Function `generate-workout-session`** con cascada Groq → Groq retry → Gemini → fallback templates.
- **Plan Semanal Dinámico (refactor Fase 5)**:
  - Nueva tabla `meal_plans` con `recipes_by_meal_type` (3 recetas × meal_type) + `daily_schedule` (N días con asignaciones).
  - `computeDailyDistribution` con jitter ±10% sobre `MEAL_DISTRIBUTIONS` base. Suma diaria **siempre EXACTAMENTE = target_kcal**.
  - Edge Function `generate-meal-plan` (15 prompts en paralelo para 5 meal_types × 3 estilos).
  - PlanPage refactorizado: selector días (1/3/7), botón único "Generar mi plan", tabs por día con kcal exacto, expandir comida muestra receta + ingredientes con gramos escalados.
- 224 tests nuevos del `weekly-distributor` (suma exacta por mealsPerDay × dayIndex × target).
- Fix snacks: mínimos adaptativos por categoría, grasa opcional si target.fatsG < 5, tolerancia ampliada para snacks.

### 🐛 Fix
- `FunctionsHttpError` del SDK expone Response directamente en `.context`, no en `.context.response`. Sweep en `fntMealPlan`, `fntMeals`, `fntWorkouts`.
- Hotfix migration `meal_plans` (2 versiones — schema legacy + columnas faltantes).
- Hardenizar `generate-meal-plan`: timeout 12 s por receta + try/catch granular.

**Commits:** `1469096`, `c336612`, `5d54081`, `2eb153a`, `3ab608c`, `1060be3`, `b5756a9`, `4ba9375`

---

## [Fase 5] — 2026-06-08 — Motor meal-generator híbrido

### ✨ Agregado
- **Motor `meal-generator/` completo** (10 archivos + 32 tests).
- **Edge Function `generate-meal-options`** con cascada Groq Llama 3.3 70B → Groq retry → Gemini 2.0 Flash → fallback templates.
- Validador `plate-validator.ts` con 9 reglas (palabras prohibidas, prep_time 5-60, steps 2-10, longitud 10-200, dificultad, etc.).
- Componentes selector con clamp 30-400 g, redondeo a 5 g.
- Fase 5.1: filtro por meal_type, variedad real (componentes distintos por opción), bloqueo de ingredientes, timeout cliente 15 s, 3 llamadas paralelas (Promise.all).
- Fase 5.2: pool 30 → 45 ingredientes, selectMultipleComponents v2 con filtro independiente por categoría, prompt más estricto (3-7 steps de 30-180 chars), validator tolerante (2-10 / 20-220).

### 🛠️ Fase 4.5
- Configuración `meals_per_day` (2-5) con migración SQL + banner Home + `MealsPerDayDialog` + distribución `MEAL_DISTRIBUTIONS` por número de comidas + `MEAL_MIN_KCAL` por meal_type. Fix bug "almuerzo 1200 kcal" con MIN_GRAMS_BY_CATEGORY adaptativo.

### 🐛 Fix (precursor del refactor mayor de Fase 6)
- `769462b`: primer fix del error handling de Edge Functions — normalizar `FunctionsHttpError.context.response` para extraer `{ msg, status }` reales. Agregar caso 429 (rate limit) en `useErrorHandling`. Mensaje específico cuando la Edge Function no está deployada ("Esa función todavía no está disponible 🍃"). _Nota: la versión correcta del SDK expone `.context` como Response directamente — eso se arregló definitivamente en el commit `3ab608c` de Fase 6._

**Commits:** `bb91751`, `4ca1303`, `7678b1e`, `280863d`, `309a21b`, `67f6ea8`, `769462b`

---

## [Fase 4] — 2026-06-08 — Onboarding + nutrition-engine

### ✨ Agregado
- **Motor `nutrition-engine/`** (8 archivos + 30 tests):
  - TMB Mifflin-St Jeor (male/female/neutral con promedio).
  - GET con factores estándar 1.2 / 1.375 / 1.55 / 1.725 / 1.9.
  - Target kcal: déficit 20% lose, superávit 12% gain.
  - Macros: proteína 2.0/1.8/1.6/1.2 g/kg por goal, grasas max(0.8 g/kg, 25% kcal), carbos cierran.
  - Safety: mínimos absolutos 1200/1500/1350 kcal, pérdida máx 1%/sem, plazo mín 2 sem.
  - Hidratación 35 ml × kg, mínimo 1500 ml.
- **Onboarding 7 pasos**: Welcome (consent) / Goals / Body / Activity / Diet / Schedule / Review.
- Migración SQL `accepted_terms_at` + `accepted_privacy_at` en `profiles`.
- Decisión: Google OAuth como autoregister, consent en Step 1 para todos.

**Commit:** `6949747`

---

## [Fases 1-3.6] — 2026-05-06 — Setup + auth + PWA + tests

### ✨ Agregado
- Vite 5 + React 18 + TS strict + Tailwind 3.4 + shadcn/ui.
- PWA con vite-plugin-pwa (manifest, iconos, service worker con runtime caching).
- Supabase: schema inicial (17 tablas con RLS, 2 triggers).
- Auth completo: email/password + Google OAuth, AuthRoute/NotAuthRoute, `useAuth`, `useErrorHandling` (401/404/400/422/offline).
- Offline first: Dexie + sync manager con encolado de operaciones.
- Testing: Vitest (22 tests iniciales) + Playwright e2e + CI GitHub Actions.
- Layout: AppShell + BottomNav (5 secciones, CTA central coral) + TopBar.

**Commits:** `bd84c34`, `f1484df`, `d95f54c`, `39afcd5`

---

## 🔮 Próximas releases (roadmap)

### [Sprint 7.2] — pendiente
- Reemplazar tap único en MealCard por dialog de 3 opciones (sí lo comí / comí otra cosa / saltada).
- Búsqueda de alimentos para "comí otra cosa" (pool + favoritos + recientes).
- Tablas + UI para agua (chips de vasos) y peso (registro diario).

### [Sprint 7.3] — pendiente
- `WorkoutSessionPage` con cronómetro entre series, checkboxes por set, video embedido.
- FAB de Quick Actions con bottom sheet (registrar peso / comida extra / agua / entrenamiento manual).

### [Sprint 7.4] — pendiente
- `MoodCheckCard` (energía + ánimo, slider 1-5) + tabla `mood_logs`.
- Microinteracciones con framer-motion (stagger cards, scale-down al tap, check verde animado).
- Tests E2E del flow completo.

### Fase 8 — pendiente
- Sistema de Rescates Adaptativos: "Hoy no puedo" → 3 alternativas inteligentes.

### Fase 9 — pendiente
- Progreso real: gráficas, comparativas "tú hace 30 días vs hoy", sistema de logros.

### Fase 10 — pendiente
- Revisión semanal con IA: ajusta plan según adherencia.

### Fase 11 — pendiente
- Detección de patrones implícitos + beta cerrada.

---

## 📚 Convenciones del changelog

- Cada release lleva la fecha real del commit.
- Etiquetas: ✨ Agregado · 🔄 Cambiado · 🐛 Fix · ⚠️ Deprecado · ❌ Removido · 🔒 Seguridad.
- Si una release requiere acción del usuario (migración SQL, redeploy Edge Function), va en una sección **"Acciones del usuario"** al final.
- Los commits de hotfix se listan dentro del sprint que los causó.
