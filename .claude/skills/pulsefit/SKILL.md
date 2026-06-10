---
name: pulsefit
description: Contexto operativo del proyecto PulseFit (PWA fitness/nutrición LATAM). Convenciones de código, patrones probados, bugs recurrentes que hay que evitar, ubicación de archivos clave, comandos comunes y reglas de negocio inviolables firmadas por el equipo de expertos virtuales (Lucía nutricionista + Carlos entrenador + Diego chef). Léelo ANTES de modificar código o crear migraciones SQL.
---

# 🌿 Skill PulseFit — Contexto operativo del proyecto

Soy una PWA gratuita de fitness/nutrición para Latinoamérica. **Lenguaje compasivo obligatorio, cero punitivismo.** Stack: React 18 + TS strict + Vite + Tailwind + shadcn/ui + Supabase + PWA + Groq/Gemini cascade.

---

## 🚨 Reglas inviolables (NO pasar por encima sin firma)

### Producto
1. **Lenguaje compasivo siempre.** Nunca "fallaste / debes / tienes que / régimen estricto". Sí: "ajustemos / probemos / sin presiones".
2. **Cero rojo punitivo** (`#FF0000`, `#DC2626`). Coral suave (`accent`) para errores; nunca rojo brillante.
3. **Español neutro LATAM** (tuteo: tú/tienes/puedes, NO voseo argentino). Si encuentras voseo, corrígelo: `tocá → toca`, `cocinás → cocinas`, `pegala → pégala`, etc.
4. **NO usar IA donde pueda causar daño nutricional/médico/biomecánico.** La IA solo combina creativamente sobre datos pre-validados. Cantidades, macros, series/reps los decide el motor determinístico.

### Seguridad
5. **Service role key SOLO en Edge Functions.** Nunca en cliente.
6. **RLS activado en TODAS las tablas con datos de usuario** (`auth.uid() = user_id`).
7. **Variables sensibles** (Groq key, Gemini key, service_role) se leen vía `Deno.env.get(...)` en Edge Functions.
8. **Validador estricto** rechaza outputs de IA que modifiquen cantidades/ingredientes/series/reps. Si la IA insiste, cae a fallback determinístico.

### Datos del usuario
9. **Mínimos calóricos absolutos**: 1200 kcal mujer / 1500 hombre / 1350 neutral. Bloqueamos por debajo.
10. **Pérdida semanal máxima 1%** del peso corporal. Plazo mínimo 2 semanas.
11. **MEAL_MIN_KCAL por meal_type**: breakfast 250 / lunch 350 / dinner 250 / snack 100.
12. **MIN_GRAMS por categoría**: proteína 50 g / carbo 30 g / fat concentrada 5 g / fat volumen 15 g / vegetal 80 g. Snacks: 25/20/3/10/30 (Sprint 0.1 fix bug 1200 kcal).

---

## 🪤 Bugs recurrentes — evítalos sin que te los señalen

### 🐛 Trampa #1: `CREATE TABLE IF NOT EXISTS` con índices nuevos

**Síntoma:** ERROR 42703 "column X does not exist" al correr una migración nueva.

**Causa:** Hay una tabla con ese nombre creada previamente con schema distinto. `CREATE TABLE IF NOT EXISTS` salta la creación, pero el `CREATE INDEX` (o `ALTER TABLE`) posterior referencia una columna que esa versión vieja no tenía.

**Pasó 3 veces:** `meal_plans` (hotfix 20260611), `workout_logs` (hotfix 20260615000001), `meal_logs` (hotfix 20260615000002).

**Regla:** Para tablas NUEVAS, siempre usar:
```sql
DROP TABLE IF EXISTS <table> CASCADE;
CREATE TABLE <table> (...);
CREATE INDEX ... ;
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
CREATE POLICY ... ;
NOTIFY pgrst, 'reload schema';
```

Solo usar `IF NOT EXISTS` cuando la tabla YA está estable en producción y solo agregas columnas vía `ALTER TABLE ADD COLUMN IF NOT EXISTS`.

### 🐛 Trampa #2: `FunctionsHttpError.context` es la Response directamente

**Síntoma:** El cliente muestra "Algo no salió como esperábamos" en lugar del mensaje real del servidor.

**Causa:** El SDK Supabase ≥ v2 expone la Response directamente en `error.context`, NO en `error.context.response`.

**Regla:** Al normalizar errores en `api/fnt*.ts`:
```ts
const ctx = e.context
const directResponse = ctx instanceof Response ? ctx : undefined
const nestedResponse = ctx && !(ctx instanceof Response) ? (ctx as { response?: Response }).response : undefined
const response = directResponse ?? nestedResponse
```

### 🐛 Trampa #3: Cast `as never` al hacer UPDATE de columnas jsonb

**Síntoma:** `Type 'X' is not assignable to type 'never'` en `supabase-js` v2 cuando actualizas una columna jsonb.

**Causa:** El typing estricto del SDK no infiere bien los tipos de columnas jsonb modeladas como `Json` genérico.

**Regla:** Usar `update({...} as never)` con comentario explicando por qué. RLS protege que solo el dueño actualice.

### 🐛 Trampa #4: `b.reps` puede ser string `"8-12"`, no número

**Síntoma:** `Type 'string' is not assignable to type 'number'` cuando intentas pasarlo a `suggestNextWeight`.

**Causa:** El motor de rutinas devuelve `reps` como string para soportar rangos.

**Regla:** Parsear el primer número: `const repsNumber = Number.parseInt(String(b.reps).match(/\d+/)?.[0] ?? '8', 10)`.

### 🐛 Trampa #5: Imports duplicados de `lucide-react`

**Síntoma:** Linter o build falla con dos bloques separados de `import {...} from 'lucide-react'`.

**Regla:** Unificar imports en un solo bloque al agregar nuevos íconos.

### 🐛 Trampa #6: `useEffect` con guard temprano DESPUÉS

**Síntoma:** "React Hook called conditionally" en build/runtime.

**Regla:** Todos los `useMemo`, `useState`, `useEffect`, `useQuery` van ANTES de cualquier `if (...) return ...`.

---

## 📐 Convenciones de código (las del lint + las firmadas)

### Indentación + estilo
- **3 espacios**, comillas simples, sin punto y coma (Prettier configurado).
- Alias `@` → `src/`.
- Build target ES2022.

### Naming
- **Interfaces / Types**: prefijo `Itf` (ej. `ItfMealPlan`, `ItfTodayState`).
- **Funciones API**: prefijo `fnt` (ej. `fntGenerateMealPlan`, `fntLogMeal`).
- **Hooks**: prefijo `use` (ej. `useMealPlan`, `useTodayState`).
- **Componentes**: PascalCase (`<WelcomeCard />`).
- **Constantes globales**: SCREAMING_SNAKE_CASE.

### Estado
- **Servidor**: react-query v5. `staleTime` típico: 30-60 s.
- **UI persistente** (tema, onboarding, auth): Zustand con `persist`.
- **Offline queue**: Dexie + sync-manager (lib/dexie-db.ts, lib/sync-manager.ts).
- **Forms**: react-hook-form + zod resolver. Mensajes de validación en español compasivo (nunca "obligatorio", sí "necesitamos saber").

### Comentarios
- Solo cuando el "por qué" no sea obvio (constraint oculto, workaround para bug, decisión firmada por experto).
- NO documentar el "qué" (los nombres ya lo hacen).
- NO referenciar al ticket/fase ("usado por X", "agregado para Y").

---

## 📁 Mapa del proyecto

```
pulsefit app/
├── CHANGELOG.md                    # historial de releases (Keep a Changelog)
├── client-pulsefit/                # Frontend (React 18 + Vite + TS)
│   ├── src/
│   │   ├── api/                    # fnt*.ts (servicios Supabase)
│   │   ├── components/             # UI (shadcn primitives en ui/, home/ Sprint 7.1)
│   │   ├── config/                 # onboarding-options, constants
│   │   ├── features/               # MOTORES (lógica pura)
│   │   │   ├── meal-generator/     # Fase 5/6 — receta + components + canonical-dishes + shopping-list
│   │   │   ├── routine-generator/  # Fase 6 — exercises + selector + progression-suggester + videos
│   │   │   ├── nutrition-engine/   # Fase 4 — TMB + GET + macros + safety
│   │   │   └── home-engine/        # Sprint 7.1 — today-state
│   │   ├── hooks/                  # useTodayState, useMealPlan, useLogMeal, useGenerateWorkout...
│   │   ├── interface/              # itf*.ts + database.ts (placeholder hasta que pnpm types:db)
│   │   ├── layout/                 # AppShell + BottomNav + TopBar
│   │   ├── pages/                  # por dominio (auth/, onboarding/, home/, plan/, registrar/, profile/)
│   │   ├── store/                  # Zustand (auth, ui, onboarding)
│   │   └── validations/            # zod schemas
│   └── tests/e2e/                  # Playwright
├── supabase/
│   ├── migrations/                 # SQL versionado (un archivo por cambio)
│   └── functions/
│       ├── _shared/                # cors, llm-providers, meal-engine.ts (mirror Deno), seed-ingredients (mirror)
│       ├── generate-meal-plan/     # Plan semanal completo
│       ├── generate-meal-options/  # 3 opciones para 1 meal_type
│       └── generate-workout-session/
└── files/
    ├── MEMORY.md                   # memoria viva (bitácora cronológica)
    ├── PROJECT_STATE.md            # snapshot del estado actual (one-pager)
    ├── SKILL.md                    # skill original del proyecto (no esta — es el "spec maestro")
    ├── generadores-hibridos.md
    ├── formulas-nutricion.md
    ├── reglas-fitness.md
    └── FASE_*.md                   # plan de cada fase del roadmap
```

### Sync crítico (mirrors)
- `client-pulsefit/src/features/meal-generator/seed-ingredients.ts` ↔ `supabase/functions/_shared/seed-ingredients.ts`
- `client-pulsefit/src/features/routine-generator/seed-exercises.ts` ↔ `supabase/functions/_shared/seed-exercises.ts`
- Helpers de meal-engine.ts y routine-engine.ts también deben mantenerse sincronizados.

**Si cambias el frontend, actualiza el espejo Deno.**

---

## 🛠️ Comandos comunes

```bash
# Desde client-pulsefit/
pnpm dev                  # vite dev :5173 --host
pnpm build                # build producción + sw.js (verifica antes de push)
pnpm lint                 # eslint
pnpm test                 # vitest run (no watch)
pnpm test progression     # filtrar por nombre
pnpm exec tsc -b --noEmit # type-check strict

# Desde raíz
git status; git add -A; git commit -m "..."; git push origin main

# Deploy Edge Function (requiere npx supabase login una vez)
npx supabase functions deploy generate-meal-plan --project-ref jhktlubijlyzswldmncu
npx supabase functions deploy generate-meal-options --project-ref jhktlubijlyzswldmncu
npx supabase functions deploy generate-workout-session --project-ref jhktlubijlyzswldmncu

# Migraciones: aplicar en Supabase SQL Editor (no hay CLI auto-apply aún)
# https://supabase.com/dashboard/project/jhktlubijlyzswldmncu/sql/new
```

---

## 🎯 Antes de hacer cualquier cambio

1. **Lee `files/PROJECT_STATE.md`** — saber qué sprints van, qué migraciones están pendientes de aplicar, qué Edge Functions están deployadas.
2. **Lee `files/MEMORY.md`** — bitácora de cambios recientes.
3. **Si tocas un motor (meal-generator / routine-generator / nutrition-engine)** — los tests de ese motor deben quedar verdes. Suite completa: 402+ tests al cierre de Sprint 7.1.
4. **Si tocas el seed de ingredientes/ejercicios** — propaga al espejo Deno.
5. **Si creas una tabla nueva** — usa el patrón DROP+CREATE limpio (ver trampa #1) y agrega RLS desde el día 1.
6. **Si modificas el cliente sin tocar Edge Function** — no necesitas redeploy. Vercel auto-redeploya en cada push a main.

---

## 🤝 Expertos virtuales (mesa de aprobación)

Estas personas firman decisiones críticas en sus dominios. Mantén consistencia con sus decisiones previas.

- **Lucía** — nutricionista clínica + especialista en TCA. Firma fórmulas, mínimos calóricos, MEAL_DISTRIBUTIONS, MEAL_MIN_KCAL, MIN_GRAMS, palabras prohibidas.
- **Carlos** — NSCA-CPT, 8 años en gimnasios. Firma RPE objetivos, descansos por rango de reps, ejercicios prohibidos para principiantes (peso muerto convencional, sentadilla con barra, press de banca con barra), progresión double progression light.
- **Diego** — chef Le Cordon Bleu Lima, 15 años en cocina LATAM. Firma seed de ingredientes con tags regionales, recetas canónicas, unidades comerciales, técnicas de cocción, no procesados.
- **Mariana / Joaquín** — usuarias tipo. Mariana 34 años mamá Quito (le importa: lista de compras, modo familia, recetas latinas), Joaquín 30 años oficinista Lima (le importa: modo flojo, integración delivery, cero cool-down, menos emoji).

---

## ✅ Checklist antes de commit

- [ ] Tests verdes (`pnpm test`)
- [ ] Lint sin errores (`pnpm lint`)
- [ ] Build OK (`pnpm build`)
- [ ] Sin voseo en strings visibles al usuario
- [ ] Si tocaste seed de cliente → propagaste a Deno
- [ ] Si creaste tabla → usaste DROP+CREATE limpio + RLS
- [ ] Si agregaste migración → la documentaste en CHANGELOG.md
- [ ] El usuario sabe qué acción tiene que hacer (migrar SQL, redeployar Edge Function)
