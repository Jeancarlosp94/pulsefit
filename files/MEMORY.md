# 🧠 MEMORY.md — Memoria viva del proyecto PulseFit

> Este archivo es la **memoria viva del proyecto**. Se actualiza después de cada cambio significativo para que cualquier sesión futura (Claude Code, otro dev, tú mismo en una semana) sepa exactamente dónde estamos sin leer todo el repo.

> **Reglas para mantener este archivo:**
> 1. Después de cada cambio que toque más de 1 archivo, agregar entrada en "Bitácora".
> 2. Después de cada fase completada, mover su estado de "En progreso" → "Completada" y actualizar "Estado actual".
> 3. Decisiones de arquitectura importantes van en "Decisiones tomadas".
> 4. Bugs conocidos o deuda técnica → "Issues conocidos".
> 5. Próximas tareas → "Pendientes inmediatos".
> 6. **Mantener este archivo cronológico (más reciente arriba)** en la sección Bitácora.

---

## 🎯 Estado actual

**Fase actual:** **Fases 7, 8, 9, 10 COMPLETAS**. Solo queda Fase 11 (Patrones implícitos + Beta cerrada) del roadmap original.

📋 **Para el snapshot completo** ver [PROJECT_STATE.md](PROJECT_STATE.md). El changelog técnico vive en [CHANGELOG.md (raíz)](../CHANGELOG.md).

- [x] Fase 1 — Setup base ✅
- [x] Fase 2 — Diseño y componentes base ✅
- [x] Fase 3 — Auth + Estructura + PWA operativa ✅
- [x] Fase 3.5 — Offline y PWA polish ✅
- [x] Fase 3.6 — Testing y CI/CD ✅
- [x] Fase 4 — Onboarding completo + nutrition-engine ✅
- [x] Fase 5 — meal-generator + Edge Function ✅ (+ Sprint 5.1/5.2 hardening)
- [x] Fase 6 — routine-generator + Edge Function + Plan Semanal Dinámico ✅
- [x] Sprints 0-4 — mejoras post-review consolidado (5 reviewers) ✅
- [x] Fase 7 — Home dinámico + registro rápido ✅ (Sprints 7.1/7.2/7.3/7.4)
- [x] Fase 8 — Sistema de rescates adaptativos ✅ (motor + RescueDialog + tabla rescue_events)
- [x] Fase 9 — Progreso real con gráficas + logros ✅ (4 tabs + Recharts + 12 achievements)
- [x] Fase 10 — Revisión semanal + IA Groq ✅ (motor + Edge Function + WeeklyReviewPage)
- [ ] Fase 11 — Patrones implícitos + Beta cerrada 👈 SIGUIENTE

**Última actualización:** 2026-06-10
**Última tarea trabajada:** Fase 10 (Revisión semanal con IA Groq) cerrada. 10/11 fases del roadmap completas. Solo queda Fase 11. Push próximo.
**Verificación final:** ✅ 402/402 tests, ✅ lint 0 errores, ✅ build OK.
**Producción:** repo en `Jeancarlosp94/pulsefit` (GitHub), Supabase prod `jhktlubijlyzswldmncu`, app en Vercel (auto-deploy en cada push a main). Edge Functions `generate-meal-plan` y `generate-meal-options` deployadas. `generate-workout-session` puede estar desactualizada (espejo Deno con cambios pendientes desde Sprint 2.2).

---

## 📌 Pendientes inmediatos

### 🚨 Inmediato — usuario debe aplicar la última migración

En **Supabase SQL Editor**:

- `supabase/migrations/20260617000000_create_mood_logs.sql` — Sprint 7.4 — tabla mood_logs.
- `supabase/migrations/20260618000000_seed_achievements.sql` — Fase 9 — inserta 12 logros LATAM.
- `supabase/migrations/20260619000000_recreate_rescue_events_clean.sql` — Fase 8 — recrea rescue_events con schema simplificado.
- `supabase/migrations/20260620000000_recreate_reviews_clean.sql` — Fase 10 — recrea reviews con schema simplificado.
- **Deploy Edge Function `weekly-review`** — Fase 10: `npx supabase functions deploy weekly-review --project-ref jhktlubijlyzswldmncu`.

Las 3 son DROP+CREATE limpio + un INSERT idempotente (la del seed). Cero impacto en datos existentes.

### Acciones del usuario CUMPLIDAS (ya aplicadas)

- ✅ `20260615000001_recreate_workout_logs_clean.sql`
- ✅ `20260615000002_recreate_meal_logs_clean.sql`
- ✅ `20260616000000_create_water_and_weight_logs.sql`

### Próxima fase a planear

**Fase 8 (Sistema de Rescates) vs Fase 9 (Progreso con gráficas)**:
- Fase 8 — "Hoy no puedo cocinar" → 3 alternativas inteligentes. Diferenciador del producto.
- Fase 9 — gráficas reales con los datos crudos ya capturados (weight, mood, mealLogs, workoutLogs, water). Visible para el usuario, retroalimenta motivación.

El usuario decide cuál arrancar después de probar Sprint 7.4.

---

## 🏗️ Decisiones de arquitectura tomadas

### Stack principal
- **Frontend:** React 18.3 + TypeScript 5.6 strict + Vite 5.4.
- **PWA:** vite-plugin-pwa 0.21 (Workbox).
- **UI:** shadcn/ui + Tailwind CSS 3.4, sin Antd ni MUI.
- **Backend:** Supabase (Postgres + Auth + Edge Functions + Storage).
- **No hay backend Express tradicional.**
- **Hosting:** Vercel (free tier) para frontend, Supabase free tier para backend.
- **Costo objetivo año 1:** menos de $30 (solo dominio).

### Convenciones de código (aplicadas en ESLint + Prettier)
- Indentación 3 espacios, comillas simples, sin punto y coma.
- Alias `@` → `src/`.
- Funciones API con prefijo `fnt`.
- Interfaces con prefijo `Itf`/`itf`.
- Estado servidor → react-query. Estado UI → Zustand. Offline → Dexie.

### Identidad
- Nombre: **PulseFit**.
- Paleta: verde salvia + mostaza suave + coral cálido. Sin rojos punitivos.
- Tipografía: Inter + DM Serif Display.
- Modo oscuro nativo desde día 1.
- Mobile-first absoluto (375px).
- Logo PWA: SVG verde salvia con onda de pulso blanca + punto coral. Generado en [client-pulsefit/public/favicon.svg](../client-pulsefit/public/favicon.svg).

### Producto
- Sin roles múltiples. Solo autenticado/no autenticado + flag `onboarding_completed`.
- Lenguaje compasivo obligatorio en toda la UI.
- Sistema de rescates adaptativos como diferenciador clave.
- Validaciones de seguridad nutricional según fórmulas de Lucía (mín 1200 kcal mujeres, 1500 hombres, déficit máx 25%, pérdida máx 1% peso/semana).
- Reglas de progresión fitness según Carlos (RPE-based, descansos forzados, ejercicios prohibidos para principiantes absolutos).

### Estrategia de generación de contenido (decidida 2026-05-06)

PulseFit usa un enfoque **HÍBRIDO** para generar planes de comidas y rutinas (Fases 5 y 6 del roadmap, no solo Fase 10):

1. **APIs externas** (Open Food Facts, wger) aportan datos validados de ingredientes y ejercicios.
2. **Motor determinístico** aplica fórmulas de Lucía y reglas de Carlos para calcular macros, seleccionar componentes y prescribir series/reps.
3. **IA generativa** (Groq + Llama 3.3 free tier) compone creativamente sobre componentes pre-seleccionados: nombre del plato + pasos de preparación, orden de ejercicios + tips por ejercicio.
4. **Validador estricto** rechaza outputs de IA que modifiquen cantidades, ingredientes, series o reps. Reintenta una vez con prompt más estricto.
5. **Fallback con plantillas** garantiza que la app NUNCA queda sin plan, aunque Groq esté caído.

La IA **NUNCA** toma decisiones médicas, nutricionales o biomecánicas. Solo combina y narra creativamente sobre datos ya validados.

Costo estimado: **$0** (free tier de Groq alcanza para ~553 generaciones diarias completas, suficiente para 1000 usuarios activos).

Detalle completo (flujos paso a paso, prompts exactos a Groq, reglas del validador, plantillas de fallback, métricas de monitoreo) en [`files/generadores-hibridos.md`](generadores-hibridos.md).

### Decisiones tomadas durante Fase 1
- **Vite 5 + React 18, no Vite 8 + React 19.** El template `pnpm create vite` arrancó con React 19 + Vite 8 pero la guía exige Vite 5/React 18. Se sobrescribió `package.json` antes del primer install.
- **Tailwind 3.4, no Tailwind 4.** shadcn/ui no soporta aún la sintaxis CSS-only de Tailwind 4 al 100% en producción.
- **ESLint 9 flat config** con `typescript-eslint` v8 unificado, no la API legacy. `@eslint/js` fijado en 9.x para alinear con eslint 9.x.
- **`core.hooksPath`** apuntando a `client-pulsefit/.husky/` porque el repo git vive en la raíz pero las hooks pertenecen al subproyecto.
- **Iconos PWA generados con `@vite-pwa/assets-generator` v1** desde un único SVG fuente. Hay un peer dep warning con vite-plugin-pwa 0.21 (espera assets-generator ^0.2) pero funciona en la práctica; se ejecuta solo cuando hay que regenerar iconos.
- **Build target ES2022** para que `await` top-level y demás features modernas funcionen sin transpilar de más; soporta iOS 16+ y Chrome 94+ (cubre todos los dispositivos del público objetivo).
- **`src/test/setup.ts`** monta jest-dom + cleanup de testing-library tras cada test (configurado en vite.config.ts → test.setupFiles).

---

## 📜 Bitácora de cambios

### 2026-06-10 — Fase 10 (Revisión Semanal con IA)
- Motor `features/review-engine/`: analyzer + adjustment-rules + summary-validator + fallback-templates. 100% determinístico salvo el texto narrativo, que viene de IA.
- `analyzeWeek` calcula 11 métricas: adherencia comidas, # entrenamientos, RPE promedio, cambio peso, mood (energía + ánimo), rescates, agua promedio, racha.
- `proposeAdjustments` aplica reglas de Lucía + Carlos: 8 tipos de ajuste con priority high/medium/low.
- `validateReviewSummary` rechaza output IA con palabras prohibidas o longitudes fuera de rango.
- Edge Function `weekly-review` con cascada Groq → Gemini → null. System prompt prohíbe inventar números y exige tono compasivo. JSON estricto.
- Migración `20260620000000_recreate_reviews_clean.sql` con DROP+CREATE. Schema: jsonb (metrics + adjustments + summary) + accepted_adjustment_ids text[] + user_decision.
- `fntComposeWeeklyReview` orquesta perfil + 7 queries paralelas + analyzer + rules + Edge Function + fallback. `fntApplyReviewAdjustments` ajusta `target_kcal` (solo si kcal_increase/decrease aceptado).
- `WeeklyReviewPage` en `/revision`: card greeting + summary + chips highlights + grid 2×4 métricas + lista ajustes con toggles y badges priority + botón "Aplicar y empezar nueva semana".
- Card "Revisar mi semana" en HomePage (border primary, antes de atajo Perfil) navega a /revision.

### 2026-06-10 — Fase 8 (Sistema de Rescates Adaptativos)
- Motor `features/rescue-engine/` 100% determinístico con 3 sub-motores (workout/meal/emotional). 13 triggers × 3 alternativas cada uno.
- Migración `20260619000000_recreate_rescue_events_clean.sql` (DROP+CREATE) reemplaza tabla legacy. Schema simplificado: domain + trigger_type + jsonb alternatives.
- `RescueDialog` con flujo 3 pasos (dominio → trigger → 3 opciones). Botón "Ninguna me sirve hoy" registra el evento sin alternativa elegida.
- Card "Hoy no puedo" en HomePage (border secondary, posición entre macros y hidratación).
- Tono firmado por Lucía + Carlos: cero juicio, severity=warn muestra banner sugiriendo profesional para binge/low_mood_streak.

### 2026-06-10 — Fase 9 (Progreso real con gráficas + logros)
- API `fntProgress` con queries para weight history, wellbeing (energía+ánimo), adherence summary (racha + % comidas + entrenos), strength progress (top 3 ejercicios).
- 4 componentes de gráficas con Recharts: WeightChart (LineChart 90d), WellbeingChart (LineChart dual 30d), StrengthChart (LineChart por ejercicio), AdherenceCard (4 stats con racha).
- Comparativa "hace 30 días" en el tab Peso con delta calculado client-side.
- Migración `20260618000000_seed_achievements.sql` con 12 logros LATAM (sin "perdiste X kg"). Premia consistencia, hidratación, flexibilidad.
- Motor `features/achievement-engine/checkAchievements` evalúa criteria simples vs catálogo y desbloquea nuevos.
- `useDetectNewAchievements` se monta en ProgresoPage → invalida cache + toast por cada logro nuevo.
- ProgresoPage rediseñada con 4 tabs (Peso · Bienestar · Fuerza · Logros) + AdherenceCard arriba.
- Tab Progreso reactivado en BottomNav (estaba oculto desde Sprint 0.3).

### 2026-06-10 — Sprint 7.4 (cierre Fase 7: mood + microinteracciones + E2E)
- Migración `mood_logs` (energy_level 1-5, mood_level 1-5, notes, UNIQUE por día). Upsert.
- API `fntMoodLogs` + hooks `useTodayMood` / `useLogMood`.
- `MoodCheckCard` en HomePage: 2 grupos de 5 botones con caritas (😟 😕 😐 🙂 😄). Aparece solo si NO respondió hoy. Después de guardar, se reemplaza por versión colapsada compacta con los 2 emojis. Mensaje "Solo te lo preguntamos una vez al día 🌿".
- Microinteracciones framer-motion en HomePage: stagger sutil de cards al cargar (cada una 50ms después, fade-in + slide-up 8px en 250ms) + scale-down 0.97 al tap en cards interactivas. Respeta prefers-reduced-motion.
- Test E2E nuevo `home-flow.spec.ts` con 5 specs (guards de auth, español neutro, no voseo, no punitivismo).
- **Fase 7 COMPLETA**. Push próximo.

### 2026-06-10 — Sprint 7.3 (vista de ejecución + limpiar plan + FAB)
- `WorkoutSessionView`: vista enfocada en ejecutar la rutina generada. Header con progreso "X/Y ejercicios" + salir con confirm. Lista vertical de bloques. SetRow por serie con inputs peso+reps + botón ✓ que activa cronómetro flotante. Selector RPE al completar todas las series + "Guardar ejercicio" que llama useLogSet con resumen agregado.
- `RestTimer` flotante sticky en bottom: countdown desde rest_sec, cambia a primary cuando faltan ≤5s, toast al completar.
- Sugerencia de progresión (Sprint 3) pre-rellena peso del primer set.
- `fntDeleteCurrentMealPlan` + `useDeleteMealPlan`. Botón "Limpiar plan" en PlanPage con confirm. Solo borra `meal_plans` (RLS), no toca logs ni perfil.
- `QuickActionFAB` en HomePage (botón coral flotante esquina derecha). Backdrop con blur + 3 acciones rápidas: + Agua (optimistic) / Peso (dialog) / Entrenar (navega). Rotación 45° del botón principal al abrir.
- Push `bd3d120`.

### 2026-06-10 — Sprint 7.2 (registro rápido: comida + agua + peso)
- `MealLogDialog` con 3 botones grandes: ✅ Sí lo comí (planned) / 🔄 Comí algo distinto (substituted con buscador de alternativas del plan + custom macros) / ❌ No comí esto (skipped).
- Migración `water_logs` (filas con delta_glasses ∈ {-1,1}) + `weight_logs` (UNIQUE por día, upsert). DROP+CREATE limpio.
- `WaterTrackerCard` con chips de vasos (target = peso × 35ml ÷ 250) + botones ± con optimistic update.
- `WeightLogDialog` con input step 0.1 kg, delta vs último, notas, mensaje compasivo.
- Push `9eda081`.

### 2026-06-10 — Sprint 7.1 (Home dinámico + estado del día)
- Migración `meal_logs` con RLS por user_id (status `planned`/`substituted`/`skipped`, plan_id+day_index+meal_type, macros, notes). Hotfix posterior por mismo bug de `IF NOT EXISTS` que ya conocíamos.
- Motor `features/home-engine/today-state.ts`: `computeTodayState(plan, logs, now)` calcula dayIndex con rotación, meals con estado por meal_type, macros consumidas sumando solo logs no-skipped + helpers `getTimeGreeting(hour)` y `getContextMessage(state)`.
- API `fntMealLogs` + hooks `useTodayMealLogs`, `useLogMeal`, `useDeleteMealLog`, `useTodayState` (compuesto plan+logs).
- UI `components/home/`: `WelcomeCard`, `MealsRowCard` (scroll horizontal con MealMiniCard por meal_type), `MacrosProgressCard` (4 barras: kcal/protein/carbs/fats), `MacroBar` reusable.
- Refactor `HomePage.tsx`: welcome + atajos contextuales según hasPlan + cards reactivas.
- 13 tests nuevos. Suite: 402/402 verde. Push `5ac9458`. Hotfixes posteriores `9e69789` y `4fa7623`.

### 2026-06-09 — Sprint 4 (español neutro + favoritos en Perfil + reset cuenta)
- Sweep masivo voseo → tuteo neutro LATAM en 10+ archivos (toasts, InfoTooltip, dialogs, páginas).
- `FavoritesEditor` en ProfilePage: card "Mis gustos" con chips multi-select de 6 cocinas + 28 ingredientes. Para usuarios que pasaron el onboarding sin esa sección.
- `ResetAccountDialog` reemplaza el "Eliminar mi cuenta" no funcional. 2 opciones: `fntResetOnboardingOnly` (conserva planes/logs) o `fntResetAllData` (borra meal_plans + workout_logs + preferencias).
- Push `cf8608d`. Suite 389/389.

### 2026-06-09 — Sprint 3 (log de cargas + progresión)
- Migración `workout_logs` (RLS por user_id, sets/reps/weight/RPE) — falló más tarde, hotfix en Sprint 7.1.
- `progression-suggester.ts` implementa double progression light: first_time / progress (+2.5 kg compounds / +1.25 kg accesorios / +1 rep bodyweight) / maintain / deload (-10% si > 14 días). Respeta `isDeloadWeek`.
- `LogSetDialog` con form (sets+reps+kg step 0.25 + RPE 10 botones + notas). RegistrarPage muestra "Última vez 3×8 @ 22.5 kg" + sugerencia + botón. 11 tests nuevos.
- Push `53a4fbb`.

### 2026-06-09 — Sprint 2 (sustitución ingrediente + pool ejercicios +12 + videos)
- 2.1: `componentOverrides` por día en `meal_plans.daily_schedule`. `findIngredientAlternatives` + `rescaleGrams` + `SwapIngredientDialog`. Update SQL directo (sin Edge Function), latencia < 300 ms. Resuelve la queja transversal "no quiero pollo hoy".
- 2.2: pool ejercicios 21 → 33 (+ sentadilla búlgara, hip thrust, kettlebell swing, face-pull, band pull-apart, dead bug, bird dog, hollow hold, curl, extensión tríceps, calf raise). `videoUrl` en TODOS los 33 (YouTube curados). `findVideoUrlForExercise` con match fuzzy normalizado.
- Push `066c03e` + `ea91455`.

### 2026-06-09 — Sprint 1 (lista de compras + modo familia + tooltips)
- 1.1: `shopping-units.ts` (60+ unidades comerciales LATAM), `shopping-list.ts` agrega gramos × días, agrupa por sección de super. `ShoppingListDialog` con familyMultiplier + tap-to-check + Copy/Share. 13 tests.
- 1.2: migración `family_size` en profiles. ProfilePage muestra card "¿Para cuántas personas cocinas?" (1-4). `InfoTooltip` reusable con glosario de 10 entradas (kcal, macros, RPE, etc.) aplicado en Perfil/Plan/Registrar.
- Push `8cb3aa7` + `a398dff`.

### 2026-06-09 — Sprint 0 (mejoras post review consolidado)
- 0.1: `FORBIDDEN_PROCESSED_FOODS` reemplaza la lista que bloqueaba palabras genéricas (queso/mantequilla/jamón) rompiendo cocina LATAM. Pool 45 → 62 ingredientes (+cebolla, pimentón, zanahoria, choclo, ají, vainita, yuca, aceite girasol, queso fresco, ricotta, mantequilla sin sal, jamón cocido low-sodium). Re-tier: tofu/cottage/whey/granola/salmón → `high`; aguacate → `cheap`. Steps 20-250 chars.
- 0.2: migración `favorite_cuisines` + `favorite_ingredient_ids` en profiles. Step 5 onboarding ampliado con chips. Recetario canónico `seed-canonical-dishes.ts` con 28 platos LATAM firmados por Diego. `selectMultipleComponents` con boost de favoritos.
- 0.3: fix banner Home spam, HomePage limpio con 3 atajos, TopBar saludo neutro, BottomNav sin Progreso (placeholder).
- Push `11604ce` + `cad096c` + `aa8b8dc`.

### 2026-06-08 (noche) — Fase 6 completada (routine-generator + Edge Function workout-session)

**Mesa de expertos sobre Gemini 2.5:**
- Analizadas cuotas de Gemini 2.5 Pro/Flash/Flash-Lite vs Gemini 2.0 Flash.
- Decisión: mantener Gemini 2.0 Flash como fallback (1500 RPD vs 500 de 2.5 Flash). La tarea es estructurada y no necesita razonamiento profundo. Validador estricto compensa cualquier desliz.
- Cascada Fase 6 inalterada: Groq → Groq retry → Gemini 2.0 → fallback templates.

**Motor `src/features/routine-generator/` (10 archivos, 29 tests verdes):**
- [types.ts](../client-pulsefit/src/features/routine-generator/types.ts): SessionFocus (full_body/upper/lower/push/pull/legs/core), ExercisePattern (9 patrones), PrescribedExercise, OrganizedSession + FOCUS_PATTERNS mapping.
- [session-planner.ts](../client-pulsefit/src/features/routine-generator/session-planner.ts): `planSession` decide focus por nivel × días disponibles (AB→full_body, intermediate 5+ días→PPL). Semana 5 fuerza descarga RPE=5.
- [exercise-pool.ts](../client-pulsefit/src/features/routine-generator/exercise-pool.ts): filtra por focus + dificultad + equipment + lesiones. Excluye `forbidden_absolute_beginner` para AB.
- [exercise-selector.ts](../client-pulsefit/src/features/routine-generator/exercise-selector.ts): rotación con seed determinístico, plantilla por tiempo (15→2c+1core, 30→3c+1a+1core, 45→4c+2a+1core, 60→5c+2a+1core, 90→5c+3a+2core).
- [set-rep-calculator.ts](../client-pulsefit/src/features/routine-generator/set-rep-calculator.ts): aplica reglas de Carlos — proteínas/reps por nivel, descansos por rango de reps (1-5→150s, 6-12→75s, 12+→45s; AB siempre 90s). Descarga: -1 serie, +20% descanso.
- [compose-prompt.ts](../client-pulsefit/src/features/routine-generator/compose-prompt.ts): SYSTEM_PROMPT con reglas inviolables + buildUserPrompt con JSON exhaustivo.
- [routine-validator.ts](../client-pulsefit/src/features/routine-generator/routine-validator.ts): 11 reglas. exercise_modified si cambia sets/reps/rest/name; tip_too_short/long; forbidden_words_in_tip (punitivas); medical_advice_in_tip (cura/previene/diagnóstico); warmup_out_of_range; cooldown_out_of_range; total_time_unrealistic (±40%).
- [fallback-templates.ts](../client-pulsefit/src/features/routine-generator/fallback-templates.ts): orden por categoría (compound→accessory→core) + TIPS_BY_PATTERN (10 patrones genéricos cálidos).
- [seed-exercises.ts](../client-pulsefit/src/features/routine-generator/seed-exercises.ts): 21 ejercicios — 3 squat, 3 hinge, 3 push_horizontal, 2 push_vertical, 2 pull_horizontal, 2 pull_vertical, 2 lunge, 3 core, 1 carry. Cada uno con id/name/pattern/muscleGroups/equipmentRequired/difficulty/affectedZones/isCompound.

**Edge Function `supabase/functions/generate-workout-session/`:**
- [_shared/routine-engine.ts](../supabase/functions/_shared/routine-engine.ts): motor portado a Deno (~440 líneas, mirror del frontend).
- [_shared/seed-exercises.ts](../supabase/functions/_shared/seed-exercises.ts): mirror del seed.
- [generate-workout-session/index.ts](../supabase/functions/generate-workout-session/index.ts): orquestador. Flujo: auth → profile → rate limit (10/día vía pattern_insights) → planSession → filterExercisePool → selectExercises → prescribePrograma → cascada (runCascade Groq→Groq retry→Gemini→fallback) → log a pattern_insights con tipo `workout_generated` o `ai_fallback_used_workout`.

**Frontend:**
- [src/interface/itfWorkouts.ts](../client-pulsefit/src/interface/itfWorkouts.ts): ItfWorkoutGenerationResponse + ItfGenerateWorkoutParams.
- [src/api/fntWorkouts.ts](../client-pulsefit/src/api/fntWorkouts.ts): fntGenerateWorkoutSession invoca la Edge Function.
- [src/hooks/useGenerateWorkout.ts](../client-pulsefit/src/hooks/useGenerateWorkout.ts): useMutation con toasts compasivos diferenciados (fallback / semana descarga / OK).
- [src/pages/registrar/RegistrarPage.tsx](../client-pulsefit/src/pages/registrar/RegistrarPage.tsx): UI demo con selector Auto/Focus override, generate button, resumen (foco/duración/RPE), card alerta deload o fallback si aplica, warmup card con movimientos, blocks (N tarjetas con name/sets×reps/tip italic/descanso), cooldown card.

**Verificación final:**
- ✅ `pnpm test` → 113/113 verdes (29 nuevos del routine-generator + 84 previos).
- ✅ `pnpm lint` → 0 errores.
- ✅ `pnpm build` → 804 KiB precache.
- ✅ `pnpm exec tsc -b --noEmit` → 0 errores strict.

**Deploy:**
- Commit `1469096` pusheado a `main`. Vercel auto-redeploya frontend.
- Ambas Edge Functions (Fase 5 + Fase 6) pendientes de deploy (login interactivo).

**Próximo paso real:** deploy de ambas funciones, luego Fase 7 (Home dinámico + registro rápido en 3 taps + cron nocturno).

### 2026-06-08 (tarde) — Fase 5 completada (meal-generator + Edge Function + cascada Groq/Gemini)

**Mesa de expertos sobre LLM:**
- Debate Diego/Sara/Miguel/Andrea/Roberto/Lucía. Decisión: Groq + Llama 3.3 70B Versatile como primario, Gemini 2.0 Flash como fallback.
- Razones: latencia top de Groq (~0.5s), free tier amplio (14.4k req/día), JSON mode nativo, instruction-following 95%. Gemini cubre el caso de Groq caído sin compartir rate limit.
- Cascada: Groq → Groq retry con prompt más estricto → Gemini → fallback templates.

**Motor `src/features/meal-generator/` (10 archivos, 32 tests verdes):**
- [types.ts](../client-pulsefit/src/features/meal-generator/types.ts): Itf* del dominio + MEAL_DISTRIBUTION (25/35/30/5/5).
- [nutritional-target.ts](../client-pulsefit/src/features/meal-generator/nutritional-target.ts): `computeMealTarget` distribuye macros diarias por meal_type.
- [ingredient-pool.ts](../client-pulsefit/src/features/meal-generator/ingredient-pool.ts): filtra por dietary_restrictions (vegan/vegetarian/pescatarian/gluten_free/lactose_free/kosher/halal), dislikedFoods, allergies, budget_level. Prioriza por región.
- [component-selector.ts](../client-pulsefit/src/features/meal-generator/component-selector.ts): `selectComponents` con cantidades clamp 30-400g, redondeo a 5g.
- [compose-prompt.ts](../client-pulsefit/src/features/meal-generator/compose-prompt.ts): SYSTEM_PROMPT + buildUserPrompt + maxPrepTimeForUser (15/25/35 según cooksAtHome).
- [plate-validator.ts](../client-pulsefit/src/features/meal-generator/plate-validator.ts): 9 reglas (JSON, conteo 3, campos, ingredientes permitidos con heurística, prep_time 5-60, steps 2-10, longitud 10-200, dificultad, palabras prohibidas).
- [fallback-templates.ts](../client-pulsefit/src/features/meal-generator/fallback-templates.ts): 3 plantillas (bowl, al ajillo, salteado). El propio fallback pasa la validación del motor.
- [seed-ingredients.ts](../client-pulsefit/src/features/meal-generator/seed-ingredients.ts): 26 ingredientes LATAM con macros reales.

**Edge Function `supabase/functions/generate-meal-options/`:**
- [_shared/cors.ts](../supabase/functions/_shared/cors.ts): corsHeaders + jsonRes reutilizables.
- [_shared/meal-engine.ts](../supabase/functions/_shared/meal-engine.ts): motor portado a Deno (~430 líneas, mirror del frontend).
- [_shared/seed-ingredients.ts](../supabase/functions/_shared/seed-ingredients.ts): mirror del seed.
- [_shared/llm-providers.ts](../supabase/functions/_shared/llm-providers.ts): createGroqProvider (modelo llama-3.3-70b-versatile, response_format JSON) + createGeminiProvider (gemini-2.0-flash, responseMimeType JSON). Timeout 8s con AbortController.
- [generate-meal-options/index.ts](../supabase/functions/generate-meal-options/index.ts): orquestador. Flujo completo: auth → profile → rate limit (30/día via pattern_insights) → computeMealTarget → filterIngredientPool → selectComponents → cascada (runCascade) → log a pattern_insights con tipo `meal_generated` o `ai_fallback_used`.

**Frontend:**
- [src/interface/itfMeals.ts](../client-pulsefit/src/interface/itfMeals.ts): ItfMealGenerationResponse, ItfGenerateMealParams, ItfMealComponentSummary.
- [src/api/fntMeals.ts](../client-pulsefit/src/api/fntMeals.ts): fntGenerateMealOptions invoca la Edge Function. Maneja errores con contexto.
- [src/hooks/useGenerateMeal.ts](../client-pulsefit/src/hooks/useGenerateMeal.ts): useMutation con toasts compasivos (mensaje distinto cuando source==='fallback').
- [src/pages/plan/PlanPage.tsx](../client-pulsefit/src/pages/plan/PlanPage.tsx): UI demo con selector de meal_type, generate button, target macros, tabs de 3 opciones, ingredientes con cantidades y pasos numerados.

**Verificación final:**
- ✅ `pnpm test` → 84/84 verdes (32 nuevos del meal-generator + 52 previos).
- ✅ `pnpm lint` → 0 errores.
- ✅ `pnpm build` → 797 KiB precache.
- ✅ `pnpm exec tsc -b --noEmit` → 0 errores strict.

**Deploy:**
- Commit `bb91751` pusheado a `main`. Vercel auto-redeploya el frontend.
- Edge Function NO se deployó automáticamente: requiere `npx supabase login` interactivo + `functions deploy`. Documentado en Pendientes inmediatos.

**Próximo paso real:** deploy de la Edge Function, luego arrancar Fase 6 (motor `routine-generator`).

### 2026-06-08 — Fase 4 completada (Onboarding 7 pasos + motor nutrition-engine) y en producción

**Decisión arquitectónica al inicio de Fase 4:**
- Google OAuth funciona como autoregister: usuario nuevo se crea automáticamente vía trigger `handle_new_user`. El consent (términos + privacidad) se captura en Step 1 del onboarding para todos por igual — flujo unificado email/Google.

**Migración SQL nueva:**
- [supabase/migrations/20260608000000_add_consent_timestamps.sql](../supabase/migrations/20260608000000_add_consent_timestamps.sql): agrega `accepted_terms_at` y `accepted_privacy_at` a `profiles`. Idempotente (IF NOT EXISTS).
- Falta aplicar en Supabase prod manualmente vía SQL Editor.

**Motor `nutrition-engine` (8 archivos + 30 tests):**
- [tmb.ts](../client-pulsefit/src/features/nutrition-engine/tmb.ts): Mifflin-St Jeor para male/female/prefer_not_to_say (este último usa promedio).
- [get.ts](../client-pulsefit/src/features/nutrition-engine/get.ts): factores de actividad estándar 1.2 / 1.375 / 1.55 / 1.725 / 1.9.
- [target-kcal.ts](../client-pulsefit/src/features/nutrition-engine/target-kcal.ts): déficit 20% lose, superávit 12% gain, GET intacto para maintain y feel_better.
- [macros.ts](../client-pulsefit/src/features/nutrition-engine/macros.ts): proteína 2.0/1.8/1.6/1.2 g/kg por goal, grasas máx(0.8g/kg, 25% kcal), carbos cierran el balance (nunca negativos).
- [safety.ts](../client-pulsefit/src/features/nutrition-engine/safety.ts): límites no negociables: min 1200 kcal female / 1500 male / 1350 neutral, pérdida máx 1%/sem, plazo mín 2 sem, goal_inverted. Mensajes compasivos con suggestedAdjustment.
- [hydration.ts](../client-pulsefit/src/features/nutrition-engine/hydration.ts): 35ml × kg, redondeo a 50ml, mínimo 1500ml.
- [recalc-triggers.ts](../client-pulsefit/src/features/nutrition-engine/recalc-triggers.ts): detecta cuándo recalcular (Δpeso ≥2kg, 4 semanas, cambio de activity o goal).
- [summary.ts](../client-pulsefit/src/features/nutrition-engine/summary.ts): orquestador puro `computeNutritionSummary` que devuelve TODO lo que se persiste en `profiles`.
- [nutrition-engine.test.ts](../client-pulsefit/src/features/nutrition-engine/nutrition-engine.test.ts): 30 tests cubriendo TMB, GET, target kcal, macros, safety, hidratación, recalc-triggers y summary.

**Store + validaciones + componentes shared:**
- [src/store/onboarding.ts](../client-pulsefit/src/store/onboarding.ts): `useOnboardingStore` Zustand persist con step + data + next/back/update/reset.
- [src/validations/onboardingSchemas.ts](../client-pulsefit/src/validations/onboardingSchemas.ts): 7 schemas zod (uno por step) con mensajes en español compasivo (nunca "obligatorio", siempre "necesitamos saber").
- [src/config/onboarding-options.ts](../client-pulsefit/src/config/onboarding-options.ts): catálogos centralizados (GOAL, SEX, ACTIVITY, FITNESS_LEVEL, COOKS, BUDGET, EQUIPMENT, MEDICAL, DIETARY_RESTRICTIONS, WEEK_DAYS).
- Componentes [src/components/onboarding/](../client-pulsefit/src/components/onboarding/): StepProgress, OnboardingFooter, OnboardingLayout, OptionCard.

**Las 7 páginas del wizard:**
- Step 1 — Welcome con términos + privacidad (checkboxes obligatorios).
- Step 2 — Objetivo (cards con emojis) + meta peso/fecha si lose/gain.
- Step 3 — Cuerpo (edad, sexo, altura, peso, condiciones médicas).
- Step 4 — Actividad (nivel actividad + fitness level).
- Step 5 — Dieta (cocina, restricciones, alergias, presupuesto).
- Step 6 — Horario (botones de días en círculo, slider de minutos, equipamiento con "none/gym_full" exclusivos).
- Step 7 — Review (cálculo en vivo, validación visible con CTA "Ajustar mi meta" si falla, persist a `profiles` + reset store + redirect a /home).

**Sub-router:**
- [src/pages/onboarding/OnboardingRouter.tsx](../client-pulsefit/src/pages/onboarding/OnboardingRouter.tsx): rutas /onboarding/1..7 + redirect a /1 por default.
- `App.tsx` reemplaza `OnboardingShell` por `OnboardingRouter` en la ruta `/onboarding/*`.

**Verificación final:**
- ✅ `pnpm test` → 52/52 verdes (30 nuevos del motor + 22 previos).
- ✅ `pnpm lint` → 0 errores, 2 warnings inocuos de react-refresh.
- ✅ `pnpm build` → 787 KiB precache, sw.js generado.
- ✅ `pnpm exec tsc -b --noEmit` → 0 errores strict.

**Deploy:**
- Commit `6949747` pusheado a `main`. Vercel auto-redeploya.
- Hay que aplicar la migración SQL nueva manualmente en Supabase prod antes de que el onboarding pueda persistir los timestamps de consent (los demás campos ya están en la tabla original).

**Próximo paso:** aplicar SQL + probar onboarding completo en producción, luego arrancar Fase 5 (motor `meal-generator` siguiendo `generadores-hibridos.md`).

### 2026-05-06 — Estrategia de generadores híbridos definida

- Decidida estrategia híbrida **API + reglas + IA + validación + fallback** para los motores `meal-generator` (Fase 5) y `routine-generator` (Fase 6).
- Creado [files/generadores-hibridos.md](generadores-hibridos.md) con 12 secciones: filosofía, flujo paso a paso de comidas (7 etapas), prompt exacto a Groq para comidas (con few-shot), validador de comidas, flujo paso a paso de rutinas, prompt exacto a Groq para rutinas (con few-shot), validador de rutinas, sistema de fallback, caché y optimización de costos, Edge Functions involucradas, tests obligatorios, métricas de monitoreo.
- Actualizado [files/SKILL.md](SKILL.md):
  - Línea nueva en "Cuándo leer cada archivo de referencia" apuntando a `generadores-hibridos.md`.
  - Sección nueva "Cuándo se usa IA generativa y cuándo NO" con tabla de SÍ/NO y regla de oro.
  - Sección "Stack obligatorio" especifica que Groq solo se llama desde Edge Functions específicas, nunca desde cliente.
- Actualizado [files/sistema-rescates.md](sistema-rescates.md): sección "Capa de IA generativa" reescrita para reflejar que IA entra en Fases 5/6/10 (no solo Fase 10) + cross-reference a `generadores-hibridos.md` + nota en "Rescates de comida" sobre cómo el rescate llama al generador híbrido.
- Actualizado [files/formulas-nutricion.md](formulas-nutricion.md): sección final nueva "Integración con generador híbrido" — fórmulas y validaciones son la primera capa del motor; IA no recalcula.
- Actualizado [files/reglas-fitness.md](reglas-fitness.md): sección final nueva "Integración con generador híbrido" — reglas de Carlos son la primera capa; IA solo organiza orden + tips.
- Actualizado [files/guia-completa.md](guia-completa.md):
  - Roadmap (sección 10): Fases 5 y 6 ahora dicen "con generador híbrido (X + Groq + validador + fallback)".
  - Sección 13 nueva "Estructura de los motores generadores híbridos" con árbol de carpetas, Edge Functions, características obligatorias, variables de entorno y tareas concretas para Fases 5 y 6.
- IA generativa entra en **Fases 5 y 6** (antes solo Fase 10).
- **Próximo paso real del roadmap:** continuar lo que sigue después de Fase 3 — el dueño tiene que ejecutar las 3 acciones manuales documentadas en "Pendientes inmediatos" (Docker + Supabase local, Lighthouse, Vercel/Supabase de producción) y luego arrancar Fase 4 (Onboarding + cálculos nutricionales). La implementación real de los generadores híbridos se hará al llegar a Fases 5 y 6 siguiendo `generadores-hibridos.md`.

### 2026-05-06 — Fases 2 + 3 + 3.5 + 3.6 completadas (41 tareas en una sesión)

**Fase 2 — Diseño y componentes base (13 tareas):**
- 16 primitivos shadcn/ui personalizados con paleta PulseFit en [client-pulsefit/src/components/ui/](../client-pulsefit/src/components/ui/): button (con variant `accent` coral), input, label, card, dialog, tabs, slider, select, checkbox, radio-group, progress, avatar, separator, switch, form (con react-hook-form), dropdown-menu.
- Radix primitives instalados (14 paquetes `@radix-ui/react-*`).
- [src/themes/tokens.ts](../client-pulsefit/src/themes/tokens.ts) con paleta y `loaderMessages` rotativos compasivos.
- [src/store/ui.ts](../client-pulsefit/src/store/ui.ts) Zustand persist con `theme` (light/dark/system).
- [src/hooks/useTheme.ts](../client-pulsefit/src/hooks/useTheme.ts) sincroniza store con `<html class='dark'>` + `meta theme-color`.
- [src/layout/AppShell.tsx](../client-pulsefit/src/layout/AppShell.tsx), [BottomNav.tsx](../client-pulsefit/src/layout/BottomNav.tsx) (5 secciones, CTA central coral destacado), [TopBar.tsx](../client-pulsefit/src/layout/TopBar.tsx) (saludo dinámico).
- [TitleUI](../client-pulsefit/src/components/TitleUI.tsx) (DM Serif), [LoaderUI](../client-pulsefit/src/components/LoaderUI.tsx) (mensajes rotativos), [EmptyState](../client-pulsefit/src/components/EmptyState.tsx) (cálido), [ErrorBoundary](../client-pulsefit/src/components/ErrorBoundary.tsx) (mensaje compasivo + recargar).
- Sonner Toaster integrado al tema en `AppWithCustomization`.
- Barrel `src/components/index.ts` actualizado.

**Fase 3 — Auth + Estructura + PWA operativa (17 tareas):**
- [src/api/supabaseConf.ts](../client-pulsefit/src/api/supabaseConf.ts) con `persistSession`, `autoRefreshToken`, storageKey `pulsefit-auth`.
- [supabase/migrations/20260101000000_initial_schema.sql](../supabase/migrations/20260101000000_initial_schema.sql) — esquema completo (17 tablas, 16 policies RLS, 2 triggers `handle_new_user` y `update_updated_at`).
- [src/interface/database.ts](../client-pulsefit/src/interface/database.ts) placeholder manual (Docker no disponible para regenerar; está versionado para que `pnpm dev` funcione sin Docker).
- [src/interface/itfAuth.ts](../client-pulsefit/src/interface/itfAuth.ts) con `ItfUser`, `ItfSession`, `ItfProfile`, payloads.
- [src/api/fntAuth.ts](../client-pulsefit/src/api/fntAuth.ts) con `fntSignIn`, `fntSignUp`, `fntSignOut`, `fntSignInWithGoogle`, `fntForgotPassword`, `fntGetProfile`, `fntUpdateProfile`.
- [src/store/auth.ts](../client-pulsefit/src/store/auth.ts) Zustand persist + `initAuthSubscription` que escucha `onAuthStateChange`.
- [src/hooks/useAuth.ts](../client-pulsefit/src/hooks/useAuth.ts), [useErrorHandling.ts](../client-pulsefit/src/hooks/useErrorHandling.ts) (401/404/400/422/offline/genérico).
- [src/validations/authSchemas.ts](../client-pulsefit/src/validations/authSchemas.ts) zod con mensajes en español compasivo.
- [LoginPage](../client-pulsefit/src/pages/auth/LoginPage.tsx), [RegisterPage](../client-pulsefit/src/pages/auth/RegisterPage.tsx), [ForgotPasswordPage](../client-pulsefit/src/pages/auth/ForgotPasswordPage.tsx) con shadcn forms + zod inline + Google OAuth.
- [AuthRoute](../client-pulsefit/src/routes/AuthRoute.tsx), [NotAuthRoute](../client-pulsefit/src/routes/NotAuthRoute.tsx) con guard de sesión + onboarding.
- [App.tsx](../client-pulsefit/src/App.tsx) reescrito con BrowserRouter completo.
- Páginas placeholder: [LandingPage](../client-pulsefit/src/pages/LandingPage.tsx), [OnboardingShell](../client-pulsefit/src/pages/onboarding/OnboardingShell.tsx) (barra 0/7), [HomePage](../client-pulsefit/src/pages/home/HomePage.tsx), [ProfilePage](../client-pulsefit/src/pages/profile/ProfilePage.tsx) (datos básicos, toggle tema, cerrar sesión con dialog, eliminar cuenta placeholder), [PlanPage](../client-pulsefit/src/pages/plan/PlanPage.tsx), [RegistrarPage](../client-pulsefit/src/pages/registrar/RegistrarPage.tsx), [ProgresoPage](../client-pulsefit/src/pages/progreso/ProgresoPage.tsx), [RescatePage](../client-pulsefit/src/pages/rescate/RescatePage.tsx), [NotFoundPage](../client-pulsefit/src/pages/NotFoundPage.tsx).
- [AppWithCustomization](../client-pulsefit/src/AppWithCustomization.tsx) con QueryClientProvider (offlineFirst networkMode), ErrorBoundary, Sonner integrado al tema, `useTheme` + `useOnlineStatus` + sync-manager + tracking PWA, toasts compasivos para offline/online.

**Fase 3.5 — Offline (5 tareas, Lighthouse pendiente):**
- [src/lib/dexie-db.ts](../client-pulsefit/src/lib/dexie-db.ts) con tablas espejo (profiles, daily_logs, meal_logs, workout_logs, rescue_events) + `pending_ops`.
- [src/lib/sync-manager.ts](../client-pulsefit/src/lib/sync-manager.ts) con `enqueueOp`, `flushQueue`, `startSyncManager`, descarte tras 5 reintentos.
- [src/hooks/useOnlineStatus.ts](../client-pulsefit/src/hooks/useOnlineStatus.ts) detecta `navigator.onLine` + dispara sync + flag `justReconnected` (5s).
- Service worker con runtime caching: app shell `CacheFirst`, fonts `CacheFirst` (1 año), Supabase API `NetworkFirst` (timeout 8s), imágenes `CacheFirst` (30 días).
- [src/lib/pwa.ts](../client-pulsefit/src/lib/pwa.ts) con `initPWAInstallTracking`, `promptInstall`, `isStandalone`, `subscribeServiceWorkerUpdates`.

**Fase 3.6 — Testing + CI/CD (5 tareas):**
- 22 tests unitarios (mínimo era 5) en 6 archivos: [supabaseConf.test.ts](../client-pulsefit/src/api/supabaseConf.test.ts), [authSchemas.test.ts](../client-pulsefit/src/validations/authSchemas.test.ts) (9 tests), [auth.test.ts](../client-pulsefit/src/store/auth.test.ts) (3 tests con mocks), [useAuth.test.ts](../client-pulsefit/src/hooks/useAuth.test.ts) (3 tests), [ErrorBoundary.test.tsx](../client-pulsefit/src/components/ErrorBoundary.test.tsx) (3 tests), smoke.test.ts (2 tests). Algunos verifican explícitamente AUSENCIA de palabras punitivas ("fallaste"/"incorrecto"/"error").
- [tests/e2e/auth.spec.ts](../client-pulsefit/tests/e2e/auth.spec.ts) — 7 escenarios Playwright (landing → register, validación inline en login, redirect rutas privadas, navegación forgot, 404 compasivo, mismatch passwords).
- [.github/workflows/ci.yml](../.github/workflows/ci.yml) con jobs `quality` (lint+typecheck+test+build) y `e2e` (Playwright mobile-chrome).
- [client-pulsefit/vercel.json](../client-pulsefit/vercel.json) con framework Vite, SPA fallback, headers de cache.
- [README.md](../README.md) (raíz, español, setup <10min) + [DEVELOPMENT.md](../DEVELOPMENT.md) (guía operativa) + [PHASE_3_REPORT.md](../PHASE_3_REPORT.md) (cierre formal de Fase 3 con checklist de aceptación).

**Verificación final:**
- ✅ `pnpm build` → 6.66s, 19 entradas precache (747 KiB), sw.js generado.
- ✅ `pnpm lint` → 0 errores (2 warnings inocuos de react-refresh en archivos shadcn).
- ✅ `pnpm test` → 22/22 verdes en 6 archivos en 2.45s.
- ✅ `pnpm exec tsc -b --noEmit` → 0 errores en strict mode.

**Total tareas trabajadas en sesión:** 53 (las 12 de Fase 1 ya cerradas + 13 + 17 + 5 + 5 + 1 generación de PHASE_3_REPORT).

### 2026-05-06 — Fase 1 completada (setup base)

**Qué se construyó:**
- Proyecto Vite + React 18 + TS estricto inicializado en `client-pulsefit/`.
- `npx supabase init` ejecutado en la raíz; `supabase/config.toml` creado.
- `package.json` reescrito con todas las dependencias del spec (production + dev) usando versiones estables React 18 / Vite 5.
- Tailwind 3.4 con `darkMode: 'class'`, paleta PulseFit en CSS variables HSL ([client-pulsefit/src/styles/globals.css](../client-pulsefit/src/styles/globals.css), [client-pulsefit/tailwind.config.js](../client-pulsefit/tailwind.config.js), [client-pulsefit/postcss.config.js](../client-pulsefit/postcss.config.js)).
- vite-plugin-pwa configurado con manifest completo (nombre PulseFit, theme `#6B8E5A`, background `#FAFAF7`, locale `es`, `display: standalone`, runtime caching para fonts/Supabase/imágenes).
- Iconos PWA generados desde [client-pulsefit/public/favicon.svg](../client-pulsefit/public/favicon.svg) y movidos a [client-pulsefit/public/icons/](../client-pulsefit/public/icons/) (icon-64, icon-192, icon-512, icon-maskable-512, apple-touch-icon).
- Estructura completa de carpetas en `src/` (api, components, components/ui, components/shared, features/{nutrition,workout,rescue,review}-engine, hooks, store, routes, interface, layout, themes, utils, validations, config, lib, styles, pages/{auth,onboarding,home,profile,plan,registrar,progreso,rescate}). Cada subdir con su `index.ts` placeholder para barrel exports.
- `tsconfig.app.json` strict + alias `@/*` + types para vite/vite-pwa-client/vitest/node.
- `vite.config.ts` con alias `@`, plugin React, plugin PWA, configuración de Vitest (jsdom, setupFiles, globals).
- ESLint flat config con reglas obligatorias (3 espacios, comillas simples, sin punto y coma) + integración con Prettier.
- `.prettierrc.json` y `.prettierignore` alineados con las convenciones.
- Husky 9 inicializado en `client-pulsefit/.husky/` con pre-commit que ejecuta `lint-staged`. Git iniciado en raíz, `core.hooksPath = client-pulsefit/.husky` para que funcione desde root.
- Vitest configurado (smoke test pasa: `src/test/smoke.test.ts`).
- Playwright configurado con proyectos mobile-chrome, mobile-safari, desktop-chrome (mobile-first).
- `index.html` actualizado a `lang='es'` con todos los meta tags PWA y `<link rel='preconnect'>` para Google Fonts (Inter + DM Serif Display).
- `App.tsx` y `main.tsx` reducidos a placeholder mínimo que solo verifica que Tailwind y la paleta están funcionando.
- `.env.example` (commitable) + `.env.local` (gitignored) creados.
- `.gitignore` raíz y `.gitignore` de cliente actualizados.

**Verificación final:**
- ✅ `pnpm build` corre limpio (1.41s, 19 entradas en precache, 157 KiB).
- ✅ `pnpm lint` pasa sin warnings.
- ✅ `pnpm test` pasa (2 tests verdes).
- ✅ `pnpm exec tsc -b --noEmit` sin errores.

**Archivos clave creados/modificados:**
- [client-pulsefit/package.json](../client-pulsefit/package.json)
- [client-pulsefit/vite.config.ts](../client-pulsefit/vite.config.ts)
- [client-pulsefit/tailwind.config.js](../client-pulsefit/tailwind.config.js)
- [client-pulsefit/postcss.config.js](../client-pulsefit/postcss.config.js)
- [client-pulsefit/eslint.config.js](../client-pulsefit/eslint.config.js)
- [client-pulsefit/.prettierrc.json](../client-pulsefit/.prettierrc.json)
- [client-pulsefit/tsconfig.app.json](../client-pulsefit/tsconfig.app.json)
- [client-pulsefit/tsconfig.node.json](../client-pulsefit/tsconfig.node.json)
- [client-pulsefit/playwright.config.ts](../client-pulsefit/playwright.config.ts)
- [client-pulsefit/index.html](../client-pulsefit/index.html)
- [client-pulsefit/src/styles/globals.css](../client-pulsefit/src/styles/globals.css)
- [client-pulsefit/src/main.tsx](../client-pulsefit/src/main.tsx)
- [client-pulsefit/src/App.tsx](../client-pulsefit/src/App.tsx)
- [client-pulsefit/src/test/setup.ts](../client-pulsefit/src/test/setup.ts)
- [client-pulsefit/.husky/pre-commit](../client-pulsefit/.husky/pre-commit)
- [supabase/config.toml](../supabase/config.toml)

### 2026-05-06 — Inicialización del proyecto (estado anterior)
- Skill `pulsefit-dev` instalada.
- `MEMORY.md` creado.
- Guía completa de desarrollo en `references/guia-completa.md`.

---

## 🐛 Issues conocidos

- **Peer dep warning:** `vite-plugin-pwa@0.21.2` espera `@vite-pwa/assets-generator@^0.2.6` pero tenemos `1.0.2`. Solo es warning; los iconos se generaron OK. Si en una futura fase falla la generación, downgradeear assets-generator a 0.2.6 o subir vite-plugin-pwa a 1.x.
- **Husky en CI:** la primera vez que se clone el repo en CI, hay que correr `pnpm install` desde `client-pulsefit/` y luego `git config --local core.hooksPath client-pulsefit/.husky` desde la raíz. Documentado en README.
- **ESLint config legacy compatibility:** se incluyen `@typescript-eslint/parser` y `@typescript-eslint/eslint-plugin` legacy en devDeps por si se necesitan, pero la config actual usa solo el meta paquete `typescript-eslint` v8.
- **Build script de sharp ignorado por pnpm:** se hace `pnpm rebuild sharp` en setup. Si se ve un error al regenerar iconos, correr `pnpm rebuild sharp` antes.
- **Cast `as never` en `fntUpdateProfile`:** `client-pulsefit/src/api/fntAuth.ts` línea 79 tiene `update(patch as never)` por limitación del placeholder de tipos. Desaparece al ejecutar `pnpm types:db` con Supabase local corriendo (Docker requerido).
- **`database.ts` placeholder versionado:** está commiteado (no en `.gitignore`) para que el repo arranque sin Docker. Cualquier cambio del esquema en `supabase/migrations/` requiere regenerar este archivo después de aplicar la migración.
- **Build chunk único > 500 KiB:** Vite emite warning. Optimizar con `manualChunks` en Fase 4 si Lighthouse Performance < 90.
- **2 warnings `react-refresh/only-export-components`** en `button.tsx` (variantes CVA) y `form.tsx` (hook `useFormField`). Son inocuos: solo afectan HMR de Vite, no la UX final. Patrón estándar de shadcn.
- **Sesión bash con cambios de directorio:** durante el desarrollo de Fase 2 se ejecutó accidentalmente `pnpm add` desde el root (creó stray `package.json`). Se limpió, pero recordatorio: SIEMPRE verificar `pwd` antes de `pnpm add` desde subagentes/sesiones largas.

### Deuda observada en auditoría 2026-06-10

- **Tablas legacy del schema inicial sin uso activo:** `meal_plan_items`, `workout_plan_items`, `workout_plans`, `daily_logs`. Los planes ahora viven en jsonb dentro de `meal_plans`. Pendiente decidir si limpiar.
- **Stubs vacíos:** `features/workout-engine/`, `features/rescue-engine/`, `features/review-engine/` solo tienen `index.ts` vacío. Esperando Fases 8/10/11.
- **Mirror Deno desactualizado:** los espejos `_shared/meal-engine.ts`, `_shared/routine-engine.ts`, `_shared/seed-*` tienen que sincronizarse a mano cuando cambia el frontend. Sin CI que valide.
- **Bug recurrente de `CREATE TABLE IF NOT EXISTS`:** pasó 3 veces (meal_plans, workout_logs, meal_logs). Documentado en `.claude/skills/pulsefit/SKILL.md` trampa #1.

### Resueltos
- ✅ Hotfix FunctionsHttpError (`error.context` es la Response directamente).
- ✅ Hotfix mínimos calóricos `MEAL_MIN_KCAL` aplicado iterativamente en `weekly-distributor`.
- ✅ Bug "almuerzo 1200 kcal" con MIN_GRAMS_BY_CATEGORY adaptativo.
- ✅ Validator FORBIDDEN_PROCESSED_FOODS reemplaza lista genérica que rompía cocina LATAM.
- ✅ Banner Home spam (`needsMealsConfig` ya no aparece para quien eligió 3).
- ✅ Saludo "Bienvenida" femenino → "Hola 👋" neutro.

---

## 📚 Estructura del proyecto (a mantener actualizada)

```
pulsefit app/
├── .git/                           # repo raíz
├── .gitignore
├── files/                          # skill docs (SKILL.md, MEMORY.md, references)
├── client-pulsefit/                # Frontend PWA (React 18 + Vite 5)
│   ├── public/
│   │   ├── favicon.svg             # logo PulseFit
│   │   ├── favicon.ico
│   │   └── icons/                  # PNGs generados (192, 512, maskable, apple-touch)
│   ├── src/
│   │   ├── main.tsx                # bootstrap React 18 (placeholder)
│   │   ├── App.tsx                 # placeholder Fase 1
│   │   ├── api/                    # Cliente Supabase + funciones fnt*
│   │   ├── pages/                  # Páginas por dominio
│   │   │   ├── auth/
│   │   │   ├── onboarding/
│   │   │   ├── home/
│   │   │   ├── profile/
│   │   │   ├── plan/
│   │   │   ├── registrar/
│   │   │   ├── progreso/
│   │   │   └── rescate/
│   │   ├── components/             # TitleUI, LoaderUI, EmptyState, ErrorBoundary (Fase 2)
│   │   │   ├── shared/
│   │   │   └── ui/                 # shadcn/ui personalizado (Fase 2)
│   │   ├── features/
│   │   │   ├── nutrition-engine/
│   │   │   ├── workout-engine/
│   │   │   ├── rescue-engine/
│   │   │   └── review-engine/
│   │   ├── hooks/                  # useAuth, useErrorHandling, useOnlineStatus, useTheme (Fase 3)
│   │   ├── store/                  # Zustand auth, ui (Fase 3)
│   │   ├── routes/                 # AuthRoute, NotAuthRoute (Fase 3)
│   │   ├── interface/              # Itf* + database.ts (Fase 3)
│   │   ├── layout/                 # AppShell, BottomNav, TopBar (Fase 2)
│   │   ├── themes/                 # tokens (Fase 2)
│   │   ├── utils/
│   │   ├── validations/            # Esquemas zod
│   │   ├── config/
│   │   ├── lib/                    # dexie-db, sync-manager, pwa (Fase 3.5)
│   │   ├── styles/
│   │   │   └── globals.css         # paleta + base + reset
│   │   └── test/
│   │       ├── setup.ts            # jest-dom + cleanup
│   │       └── smoke.test.ts
│   ├── tests/
│   │   └── e2e/                    # Playwright (Fase 3.6)
│   ├── .husky/
│   │   └── pre-commit              # lint-staged
│   ├── .env.example
│   ├── .env.local                  # gitignored
│   ├── .gitignore
│   ├── .prettierrc.json
│   ├── .prettierignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── playwright.config.ts
│   ├── postcss.config.js
│   ├── pwa-assets.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
└── supabase/
    ├── config.toml
    ├── .temp/                      # gitignored
    ├── migrations/                 # (se crean en Fase 3)
    ├── functions/                  # Edge Functions Deno (Fase 5+)
    └── seed/                       # (Fase 4+)
```

---

## 🔑 Variables de entorno requeridas

### Frontend (`.env.local` en `client-pulsefit/`)
```
VITE_SUPABASE_URL=http://127.0.0.1:54321  # default supabase local
VITE_SUPABASE_ANON_KEY=eyJh...            # default supabase local
VITE_POSTHOG_KEY=
VITE_SENTRY_DSN=
VITE_APP_ENV=development
```

### Backend (Supabase)
Configurar en dashboard de Supabase (producción) o vía `supabase secrets set`:
```
GROQ_API_KEY=                       # Free tier de Groq para IA (Fase 10)
OPENFOODFACTS_USER_AGENT=           # Para Open Food Facts (Fase 5)
SUPABASE_SERVICE_ROLE_KEY=          # Solo Edge Functions, nunca cliente
```

---

## 🚀 Comandos frecuentes

```bash
# Frontend (desde client-pulsefit/)
pnpm dev                            # vite dev server en :5173 con --host
pnpm build                          # build producción + sw.js
pnpm preview                        # preview del build
pnpm lint                           # eslint
pnpm format                         # eslint --fix + prettier
pnpm type-check                     # tsc --noEmit
pnpm test                           # vitest run
pnpm test:watch                     # vitest watch
pnpm test:e2e                       # playwright test
pnpm types:db                       # regenerar tipos desde supabase local

# Backend (desde raíz)
npx supabase start                  # arrancar Supabase local en Docker
npx supabase stop                   # parar
npx supabase db reset               # aplicar todas las migraciones desde cero
npx supabase functions serve        # correr Edge Functions localmente
npx supabase gen types typescript --local > client-pulsefit/src/interface/database.ts
```

---

## 📞 Stakeholders del producto

- **Roberto** (usuario promedio) — valida UX y fricción.
- **Carlos** (coach fitness NSCA-CPT) — valida reglas de entrenamiento.
- **Lucía** (nutricionista clínica) — valida cálculos calóricos y manejo de banderas rojas.
- **Valentina** (UI/UX designer) — valida diseño y tono compasivo.
- **Diego, Sara, Miguel, Andrea** (equipo técnico) — validan stack y arquitectura.

Las decisiones de producto se aprueban cuando los 4 primeros (Roberto, Carlos, Lucía, Valentina) están de acuerdo.

---

## 🎓 Cómo actualizar este archivo

Después de cada cambio significativo:

1. **Actualiza "Última actualización"** y "Última tarea trabajada".
2. **Marca completados** los checkboxes de fases si corresponde.
3. **Agrega entrada en Bitácora** con fecha, qué se hizo, qué archivos se tocaron.
4. **Si tomaste una decisión nueva de arquitectura**, agrégala en "Decisiones tomadas".
5. **Si encontraste un bug o deuda técnica**, agrégalo en "Issues conocidos".
6. **Actualiza "Pendientes inmediatos"** con lo que sigue.

**Si no haces esto, la próxima sesión no sabrá dónde quedaste.** Es lo más importante de mantener al día.
