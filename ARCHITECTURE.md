# 🏗️ Arquitectura de PulseFit

> Snapshot técnico del sistema al cierre de la Fase 11.

---

## 🎯 Visión de alto nivel

PulseFit es una **PWA gratuita** que combina:

- **Frontend React** servido desde Vercel.
- **Backend Supabase** (Postgres + Auth + Edge Functions Deno + Storage).
- **Cascada de IA** (Groq Llama 3.3 70B → Gemini 2.0 Flash → fallback templates) **solo para texto narrativo y creatividad de recetas**.
- **Motores determinísticos** (TypeScript puro) para todo lo que afecta salud del usuario (cálculo calórico, prescripción de cargas, validación de outputs, reglas nutricionales).

```
┌──────────────┐   PWA   ┌──────────────┐   HTTPS  ┌─────────────────┐
│  Navegador   │ <-----> │   Vercel     │ <------> │   Supabase      │
│  (mobile)    │         │  (React+SW)  │          │  · Auth         │
└──────────────┘         └──────────────┘          │  · Postgres+RLS │
                                                   │  · Edge Functions│
                                                   └────────┬────────┘
                                                            │
                                                            ▼
                                                   ┌──────────────────┐
                                                   │  Groq + Gemini   │
                                                   │  (LLM cascade)   │
                                                   └──────────────────┘
```

---

## 🧱 Stack confirmado

| Capa | Tecnología | Versión |
|---|---|---|
| UI | React | 18.3.1 |
| Build | Vite | 5.4.10 |
| Tipos | TypeScript strict | 5.6.3 |
| Estilo | Tailwind CSS + shadcn/ui | 3.4.14 |
| Servidor de estado | TanStack Query | 5.59.16 |
| Estado UI | Zustand (persist) | 5.0.1 |
| Forms | react-hook-form + zod | 7.53.2 / 3.23.8 |
| Toasts | Sonner | 1.7.0 |
| Animaciones | Framer Motion | 11.11.17 |
| Charts | Recharts | 2.13.3 |
| IndexedDB | Dexie + dexie-react-hooks | 4.0.10 |
| PWA | vite-plugin-pwa (Workbox) | 0.21.x |
| Backend | Supabase JS | 2.46.1 |
| Tests | Vitest + Playwright | 2.1.4 / 1.48.2 |

---

## 📁 Estructura del frontend (`client-pulsefit/src/`)

```
src/
├── api/             # fnt*.ts — servicios Supabase (auth, planes, logs, IA)
├── components/      # UI compartida (dialogs, cards, FAB, charts/, home/, workout/)
├── config/          # constantes globales (onboarding options, glosario)
├── features/        # MOTORES de lógica pura (sin IA, salvo orquestación)
│   ├── meal-generator/      # Fase 5 + 6 — recetas + canonical + shopping-list
│   ├── routine-generator/   # Fase 6 — ejercicios + RPE + progresión
│   ├── nutrition-engine/    # Fase 4 — TMB + GET + macros + safety
│   ├── home-engine/         # Sprint 7.1 — today-state
│   ├── achievement-engine/  # Fase 9 — detección de logros
│   ├── rescue-engine/       # Fase 8 — alternativas "Hoy no puedo"
│   ├── review-engine/       # Fase 10 — analyzer + rules + validator
│   └── pattern-engine/      # Fase 11 — detectores + recomendaciones
├── hooks/           # use*.ts — wrappers de react-query, Zustand, stores
├── interface/       # Itf*.ts — types compartidos
├── layout/          # AppShell + BottomNav + TopBar
├── pages/           # Por dominio (auth, onboarding, home, plan, registrar, etc.)
├── routes/          # AuthRoute / NotAuthRoute guards
├── store/           # Zustand stores (auth, ui, onboarding)
├── utils/           # helpers (cn, date)
└── validations/     # zod schemas
```

---

## 🗄️ Esquema de base de datos (Supabase)

**Tablas con RLS por user_id (`auth.uid() = user_id`):**

| Tabla | Propósito | Fase introducida |
|---|---|---|
| `profiles` | Perfil completo del usuario (target_kcal, preferencias, equipo, etc.) | Schema inicial |
| `meal_plans` | Plan semanal con `recipes_by_meal_type` + `daily_schedule` jsonb | Fase 6 |
| `meal_logs` | Registro de comidas (planned/substituted/skipped) | Sprint 7.1 |
| `workout_logs` | Sets/reps/peso/RPE por ejercicio | Sprint 3 |
| `water_logs` | Filas con delta_glasses ±1 | Sprint 7.2 |
| `weight_logs` | UNIQUE por día, upsert | Sprint 7.2 |
| `mood_logs` | UNIQUE por día (energy + mood 1-5) | Sprint 7.4 |
| `rescue_events` | jsonb de alternativas ofrecidas + chosen | Fase 8 |
| `reviews` | jsonb (metrics + adjustments + summary) + decisión | Fase 10 |
| `user_achievements` | Logros desbloqueados | Schema inicial + seed Fase 9 |
| `notifications` | Cola de notificaciones | Schema inicial |
| `daily_logs` | (legacy, sin uso activo) | Schema inicial |
| `pattern_insights` | (reservado para Fase 11+, sin uso activo en MVP) | Schema inicial |
| `meal_plan_items`, `workout_plan_items`, `workout_plans` | (legacy, deprecar) | Schema inicial |

**Tablas públicas (RLS `SELECT true`):**

- `foods_cache` — catálogo de alimentos con búsqueda full-text
- `exercises_catalog` — 33 ejercicios con técnica + alternativas + video
- `restaurant_guides` — guías de qué pedir por tipo de cocina
- `achievements` — 12 logros del seed

---

## ⚡ Edge Functions

Todas en `supabase/functions/<nombre>/index.ts`. Comparten módulos en `_shared/`.

| Función | Propósito | Cascade IA |
|---|---|---|
| `generate-meal-plan` | Genera plan semanal completo (1-7 días) | Groq → Groq retry → Gemini → fallback |
| `generate-meal-options` | 3 opciones diversas para 1 meal_type | Groq → Groq retry → Gemini → fallback |
| `generate-workout-session` | Sesión de entrenamiento orquestada | Groq → Groq retry → Gemini → fallback |
| `weekly-review` | Resumen narrativo de la semana | Groq → Gemini → null (cliente arma fallback) |

**Shared modules** (`_shared/`):

- `cors.ts` — headers CORS + helper `jsonRes`
- `llm-providers.ts` — abstracción Groq + Gemini
- `meal-engine.ts` — mirror de `features/meal-generator/`
- `routine-engine.ts` — mirror de `features/routine-generator/`
- `seed-ingredients.ts`, `seed-exercises.ts` — mirrors de los seeds

---

## 🌀 Flujo de datos clave

### 1. Generación de plan de comidas

```
Usuario → PlanPage → fntGenerateMealPlan()
                    ↓
                supabase.functions.invoke('generate-meal-plan')
                    ↓
                Edge Function:
                    1. Lee profile (auth.users.id)
                    2. Para cada meal_type × 3 estilos: prompt → Groq paralelo
                    3. Valida cada respuesta con plate-validator
                    4. Calcula daily_schedule con weekly-distributor
                    5. INSERT en meal_plans (RLS)
                    6. Devuelve plan completo
                    ↓
                Cliente: useMealPlan invalida cache
                    ↓
                PlanPage muestra el plan
```

### 2. Revisión semanal con IA

```
Usuario → HomePage → "Revisar mi semana" → /revision
                                        ↓
                            useComposeWeeklyReview()
                                        ↓
            fntComposeWeeklyReview (cliente):
                1. 7 queries paralelas (meals/workouts/weight/mood/rescue/water/profile)
                2. computeStreak()
                3. analyzeWeek(input) → ItfWeeklyMetrics  ← determinístico
                4. proposeAdjustments(metrics, profile) → ItfAdjustment[]  ← reglas Lucía+Carlos
                5. supabase.functions.invoke('weekly-review', { metrics, adjustments })
                       ↓
                   Edge Function weekly-review:
                       a. Groq con system + user prompts
                       b. parseAndValidate(output)
                       c. Si falla → Gemini retry
                       d. Si falla todo → return { data: null }
                       ↓
                6. Si Edge Function devolvió null → buildFallbackSummary() local
                7. Devuelve { metrics, adjustments, summary }
                                        ↓
                            WeeklyReviewPage:
                                - Muestra summary + métricas + ajustes con toggles
                                - Usuario acepta/rechaza
                                ↓
                            useApplyReview:
                                - fntSaveReview (INSERT en reviews)
                                - fntApplyReviewAdjustments (UPDATE profile.target_kcal si aceptado)
                                - invalida cache de progress + profile
                                - navega a Home + toast
```

### 3. Sistema de patrones (Fase 11)

```
Usuario → Perfil → "Lo que sabemos sobre ti" → /insights
                                            ↓
                                useInsights()
                                            ↓
                fntGetInsights (cliente, sin Edge Function):
                    1. 5 queries paralelas con 60d de datos (meals/workouts/moods/water/rescues)
                    2. detectAllPatterns(input) → ItfPattern[]  ← 9 detectores determinísticos
                    3. buildRecommendations(patterns) → ItfRecommendation[]  ← tono compasivo
                    4. prioritizeInsights(recs, 6) → ordena high/medium/low + limita
                                            ↓
                                InsightsPage:
                                    - Muestra cards priorizadas
                                    - Sección "datos crudos detectados" para transparencia
```

---

## 🔐 Seguridad

### Reglas inviolables

1. **Service role key SOLO en Edge Functions.** Nunca en cliente.
2. **Variables sensibles** (Groq, Gemini, service_role) en `Deno.env`. Nunca en repo.
3. **RLS activado** en todas las tablas con datos de usuario.
4. **Validador estricto** rechaza outputs de IA que violen palabras prohibidas, longitudes o que inventen datos.
5. **Cero IA donde pueda causar daño**: cantidades, macros, series/reps los decide el motor determinístico. La IA solo combina creativamente sobre datos pre-validados.

### Lenguaje compasivo (regla del producto)

- Cero "fallaste", "régimen estricto", "deberías", "debes".
- Cero rojo punitivo (`#FF0000`, `#DC2626`). Coral suave para errores.
- Español neutro LATAM (tuteo, no voseo).
- Mensaje de cierre cálido siempre.

---

## 🧪 Testing

| Tipo | Framework | Cobertura |
|---|---|---|
| Unitarios | Vitest | 402 tests (motores) |
| E2E | Playwright | 5 specs (guards + tono compasivo) |
| Lint | ESLint + Prettier | 0 errores |
| Type | TypeScript strict | OK |

Motores con tests críticos:
- `nutrition-engine` (30)
- `meal-generator` (43)
- `routine-generator` (29)
- `weekly-distributor` (233)
- `today-state` (13)
- `progression-suggester` (11)
- `shopping-list` (13)
- `find-video` (7)

---

## 🚢 Deployment

### Frontend (Vercel)
- Cada push a `main` deploya automáticamente.
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Build: `pnpm build` (genera `dist/` con sw.js + manifest).

### Backend (Supabase)
- Migraciones SQL aplicadas manualmente desde SQL Editor (no hay CI/CD de migraciones aún).
- Edge Functions: `npx supabase functions deploy <nombre> --project-ref <ref>`.
- Secrets: `npx supabase secrets set GROQ_API_KEY=... GEMINI_API_KEY=...`.

---

## 📦 Patrones de código

### Convenciones

- **3 espacios** de indentación, comillas simples, sin punto y coma.
- **Interfaces**: prefijo `Itf` (ej. `ItfMealPlan`).
- **Funciones API**: prefijo `fnt` (ej. `fntGenerateMealPlan`).
- **Hooks**: prefijo `use`.
- **Comentarios**: solo cuando el "por qué" no es obvio. No documentar el "qué".

### Patrón crítico de migraciones

⚠️ **Bug recurrente**: `CREATE TABLE IF NOT EXISTS` con índices nuevos sobre tablas parciales preexistentes da ERROR 42703.

**Regla:** para tablas nuevas usar siempre:
```sql
DROP TABLE IF EXISTS tabla CASCADE;
CREATE TABLE tabla (...);
CREATE INDEX ...;
ALTER TABLE tabla ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...;
NOTIFY pgrst, 'reload schema';
```

Solo usar `IF NOT EXISTS` cuando la tabla ya está estable en producción.

---

## 📚 Documentos relacionados

- `README.md` — descripción del producto y setup local.
- `CHANGELOG.md` — historial completo de releases.
- `BETA_GUIDE.md` — guía para correr beta cerrada.
- `.claude/skills/pulsefit/SKILL.md` — skill local con convenciones + bugs evitables.
- `files/MEMORY.md` — bitácora cronológica detallada.
- `files/PROJECT_STATE.md` — snapshot one-pager.
- `files/FASE_*.md` — plan de cada fase del roadmap.
