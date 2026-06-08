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

**Fase actual:** Fases 1-5 completas en código. App en producción (Vercel + Supabase prod). Pendiente: deploy de Edge Function `generate-meal-options`. Lista para Fase 6.
- [x] Fase 1 — Setup base ✅
- [x] Fase 2 — Diseño y componentes base ✅
- [x] Fase 3 — Auth + Estructura + PWA operativa ✅
- [x] Fase 3.5 — Offline y PWA polish ✅ (Lighthouse pendiente de auditoría manual)
- [x] Fase 3.6 — Testing y CI/CD ✅
- [x] Fase 4 — Onboarding completo + cálculos nutricionales ✅
- [x] Fase 5 — Motor `meal-generator` híbrido + Edge Function ✅ (deploy pendiente)
- [ ] Fase 6 — Motor `routine-generator` con generador híbrido 👈 SIGUIENTE
- [ ] Fase 7 — Home dinámico + registro rápido
- [ ] Fase 8 — Sistema de rescates adaptativos
- [ ] Fase 9 — Progreso, gráficas, logros
- [ ] Fase 10 — Revisión semanal + IA Groq
- [ ] Fase 11 — Detección de patrones
- [ ] Fase 12 — Beta cerrada

**Última actualización:** 2026-06-08
**Última tarea trabajada:** Fase 5 cerrada — motor `meal-generator` (32 tests) + Edge Function `generate-meal-options` con cascada Groq → Gemini → fallback + PlanPage demo. Push commit `bb91751`.
**Verificación final:** ✅ build limpio (797 KiB), ✅ 84/84 tests, ✅ lint 0 errores, ✅ tsc strict OK.
**Producción:** repo en `Jeancarlosp94/pulsefit` (GitHub), Supabase prod en `jhktlubijlyzswldmncu`, app en Vercel, Groq + Gemini secrets configurados.

---

## 📌 Pendientes inmediatos

### 🚨 Inmediato — deploy de la Edge Function Fase 5

```powershell
cd "C:\Users\jeanc\OneDrive\Escritorio\pulsefit app"
npx supabase login
npx supabase link --project-ref jhktlubijlyzswldmncu
npx supabase functions deploy generate-meal-options --project-ref jhktlubijlyzswldmncu
```

- [ ] Correr esos 3 comandos (login es interactivo en browser, una sola vez).
- [ ] Verificar en https://supabase.com/dashboard/project/jhktlubijlyzswldmncu/functions que aparece `generate-meal-options` con status verde.
- [ ] Probar desde Vercel: Plan → seleccionar comida → Generar → ver 3 opciones reales.

### Para Fase 3 (auditoría manual pendiente)
- [ ] Auditoría Lighthouse desde la URL de Vercel → Chrome DevTools Mobile. Anotar scores en PHASE_3_REPORT.md.

### Para arrancar Fase 6 (motor `routine-generator`)
- [ ] Re-leer [files/reglas-fitness.md](reglas-fitness.md) (reglas de Carlos: RPE, progresión, descansos, ejercicios prohibidos para principiantes).
- [ ] Re-leer [files/generadores-hibridos.md](generadores-hibridos.md) secciones 5-7 (flujo + prompt + validador de rutinas).
- [ ] Crear `src/features/routine-generator/` con misma estructura que `meal-generator`: types, session-planner, exercise-pool, exercise-selector, set-rep-calculator, ai-routine-organizer, routine-validator, fallback-templates.
- [ ] Replicar el patrón de la Edge Function `generate-meal-options` para `generate-workout-session` (orquestador con cascada Groq → Gemini → fallback, rate limit 10/día).
- [ ] Catálogo seed de ejercicios LATAM con clasificación por patrón y nivel.
- [ ] Frontend: itfWorkouts + fntWorkouts + useGenerateWorkout + reemplazar placeholder de RegistrarPage o crear PlanWorkoutPage.

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

### Resueltos
_(Aún ninguno.)_

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
