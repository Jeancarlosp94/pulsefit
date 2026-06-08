# 📋 PHASE_4_REPORT.md

> Cierre formal de **Fase 4 — Onboarding completo + cálculos nutricionales**.
> Fecha: **2026-06-08**.

---

## ✅ Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| Tests unitarios | **52/52 verdes** (30 nuevos del motor) |
| Cobertura motor `nutrition-engine` | 30 tests sobre 8 archivos |
| Errores de lint | 0 (2 warnings inocuos de react-refresh) |
| Errores TypeScript strict | 0 |
| Tamaño del precache PWA | 787 KiB |
| Archivos creados | 27 |
| Líneas agregadas | +2519 |
| Commit | `6949747` en `main` |

---

## 🎯 Lo que se construyó

### Decisión arquitectónica de entrada

**Google OAuth funciona como autoregister.** El usuario nuevo se crea automáticamente vía trigger `handle_new_user`. El consent (términos + privacidad) se captura en el **Step 1** del onboarding para todos por igual, sea usuario de email o de Google. Flujo unificado, fricción mínima, consent garantizado.

Para soportarlo, se agregó migración nueva:
- [`supabase/migrations/20260608000000_add_consent_timestamps.sql`](supabase/migrations/20260608000000_add_consent_timestamps.sql) → `accepted_terms_at` + `accepted_privacy_at` en `profiles`. Idempotente.

### Motor `nutrition-engine` (8 archivos · 30 tests)

| Archivo | Función |
|---------|---------|
| `tmb.ts` | Mifflin-St Jeor para male/female/prefer_not_to_say (último usa promedio) |
| `get.ts` | Factores de actividad: 1.2 / 1.375 / 1.55 / 1.725 / 1.9 |
| `target-kcal.ts` | Déficit 20% lose · superávit 12% gain · GET intacto maintain/feel_better |
| `macros.ts` | Proteína 2.0/1.8/1.6/1.2 g/kg · grasas mín(0.8g/kg, 25% kcal) · carbos balance |
| `safety.ts` | Límites no negociables (Lucía): min kcal por sexo, máx 1%/sem, mín 2 sem |
| `hydration.ts` | 35 mL × kg, redondeado a 50, mínimo 1500 mL |
| `recalc-triggers.ts` | Detecta cuándo recalcular: Δpeso ≥2kg, 4 sem, cambio activity o goal |
| `summary.ts` | Orquestador puro `computeNutritionSummary` |

**Funciones puras totales.** Sin red, sin stores. Testeables al 100%.

### Estado, validaciones y catálogos

- [`src/store/onboarding.ts`](client-pulsefit/src/store/onboarding.ts) — Zustand persist con step + data + acciones next/back/update/reset.
- [`src/validations/onboardingSchemas.ts`](client-pulsefit/src/validations/onboardingSchemas.ts) — 7 schemas zod con mensajes compasivos.
- [`src/config/onboarding-options.ts`](client-pulsefit/src/config/onboarding-options.ts) — catálogos centralizados (GOAL, SEX, ACTIVITY, FITNESS_LEVEL, COOKS, BUDGET, EQUIPMENT, MEDICAL, DIETARY_RESTRICTIONS, WEEK_DAYS).

### Componentes shared del wizard

- `StepProgress` — barra "Paso X de N".
- `OnboardingFooter` — botones atrás/siguiente con loading state.
- `OnboardingLayout` — contenedor común con título DM Serif Display.
- `OptionCard` — tarjeta de selección estilo botón grande con emoji + descripción.

### Las 7 páginas

| Step | Qué hace |
|------|---------|
| **1 — Welcome** | Bienvenida + checkboxes de términos y privacidad |
| **2 — Goals** | Objetivo (4 cards con emoji) + peso meta y fecha si lose/gain |
| **3 — Body** | Edad, sexo biológico, altura, peso actual, condiciones médicas |
| **4 — Activity** | Nivel de actividad diaria + experiencia entrenando |
| **5 — Diet** | Cocina, restricciones dietarias, alergias, presupuesto |
| **6 — Schedule** | Días disponibles (círculos), minutos por sesión (slider), equipamiento |
| **7 — Review** | Cálculo en vivo del plan, validación visible, persist + redirect a /home |

### Router

- [`OnboardingRouter.tsx`](client-pulsefit/src/pages/onboarding/OnboardingRouter.tsx) — sub-rutas `/onboarding/1..7`, redirect a `/1` por default.
- `App.tsx` reemplaza el viejo `OnboardingShell` por `OnboardingRouter` en `/onboarding/*`.

---

## 🛡️ Validaciones implementadas

Tono compasivo en TODOS los mensajes. Lista de validaciones que el usuario puede tocar:

- Edad fuera de 13-120 → "Necesitas tener al menos 13 años" / "Revisa la edad".
- Altura/peso fuera de rango realista → "Revisa…".
- Días disponibles vacíos → "Elige al menos un día".
- Minutos fuera de 10-180 → "Mínimo 10 minutos".
- Target kcal calculado < mínimo del sexo → bloquea con "Hagamos un plan más sostenible 🌱" + sugiere subir al mínimo.
- Pérdida semanal > 1% del peso → bloquea con "Esa meta es ambiciosa…" + sugiere más semanas.
- Plazo < 2 semanas → bloquea con "Démosle al menos 2 semanas".
- Goal invertido (perder con target > actual) → mensaje compasivo.

**El usuario ve la alerta antes de confirmar.** Puede ajustar volviendo a Step 2 con un botón en la propia tarjeta de error.

---

## 🚨 Acción pendiente del dueño

### Aplicar migración SQL en producción

1. Abrí 👉 https://supabase.com/dashboard/project/jhktlubijlyzswldmncu/sql/new
2. Pegá el contenido de [`supabase/migrations/20260608000000_add_consent_timestamps.sql`](supabase/migrations/20260608000000_add_consent_timestamps.sql) (16 líneas).
3. Click **Run**.

Resultado esperado: las columnas `accepted_terms_at` y `accepted_privacy_at` aparecen en `profiles`. El query es idempotente (`IF NOT EXISTS`), no rompe si ya existe.

### Después de aplicar

1. Esperá que Vercel termine el redeploy automático (~2 min).
2. Abrí tu URL de Vercel.
3. Si tu usuario actual tenía `onboarding_completed = false`, te lleva al nuevo flujo de 7 pasos.
4. Si tu usuario ya tenía `onboarding_completed = true` (porque lo marcaste manualmente antes), corré:
   ```sql
   UPDATE profiles SET onboarding_completed = false WHERE email = '<tu-email>';
   ```
   Recargá la app y arrancás el onboarding real.

---

## 📦 Archivos modificados/creados (37)

```
A  supabase/migrations/20260608000000_add_consent_timestamps.sql
M  client-pulsefit/src/interface/database.ts
M  client-pulsefit/src/App.tsx
M  client-pulsefit/src/pages/index.ts
M  client-pulsefit/src/store/index.ts
M  client-pulsefit/src/validations/index.ts
M  client-pulsefit/src/config/index.ts
M  client-pulsefit/src/features/nutrition-engine/index.ts

A  client-pulsefit/src/features/nutrition-engine/types.ts
A  client-pulsefit/src/features/nutrition-engine/tmb.ts
A  client-pulsefit/src/features/nutrition-engine/get.ts
A  client-pulsefit/src/features/nutrition-engine/target-kcal.ts
A  client-pulsefit/src/features/nutrition-engine/macros.ts
A  client-pulsefit/src/features/nutrition-engine/safety.ts
A  client-pulsefit/src/features/nutrition-engine/hydration.ts
A  client-pulsefit/src/features/nutrition-engine/recalc-triggers.ts
A  client-pulsefit/src/features/nutrition-engine/summary.ts
A  client-pulsefit/src/features/nutrition-engine/nutrition-engine.test.ts

A  client-pulsefit/src/store/onboarding.ts
A  client-pulsefit/src/validations/onboardingSchemas.ts
A  client-pulsefit/src/config/onboarding-options.ts

A  client-pulsefit/src/components/onboarding/StepProgress.tsx
A  client-pulsefit/src/components/onboarding/OnboardingFooter.tsx
A  client-pulsefit/src/components/onboarding/OnboardingLayout.tsx
A  client-pulsefit/src/components/onboarding/OptionCard.tsx
A  client-pulsefit/src/components/onboarding/index.ts

A  client-pulsefit/src/pages/onboarding/Step1Welcome.tsx
A  client-pulsefit/src/pages/onboarding/Step2Goals.tsx
A  client-pulsefit/src/pages/onboarding/Step3Body.tsx
A  client-pulsefit/src/pages/onboarding/Step4Activity.tsx
A  client-pulsefit/src/pages/onboarding/Step5Diet.tsx
A  client-pulsefit/src/pages/onboarding/Step6Schedule.tsx
A  client-pulsefit/src/pages/onboarding/Step7Review.tsx
A  client-pulsefit/src/pages/onboarding/OnboardingRouter.tsx
```

---

## 🚀 Próximo paso: Fase 5 — Motor `meal-generator` con generador híbrido

Plan en [`files/generadores-hibridos.md`](files/generadores-hibridos.md) (lectura obligatoria antes de empezar). Es el sprint más grande del proyecto: arma el motor que produce los planes de comida reales usando Open Food Facts + reglas de Lucía + IA Groq + validador + fallback.

🌱
