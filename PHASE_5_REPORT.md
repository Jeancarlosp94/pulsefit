# 📋 PHASE_5_REPORT.md

> Cierre formal de **Fase 5 — Motor de plan de comidas con generador híbrido**.
> Fecha: **2026-06-08**.

---

## ✅ Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| Tests unitarios | **84/84 verdes** (32 nuevos del meal-generator) |
| Errores TypeScript strict | 0 |
| Errores lint | 0 |
| Build PWA | 797 KiB precache |
| Edge Function | `generate-meal-options` lista para deploy |
| Cascada IA | Groq → Groq retry → Gemini → fallback templates |
| Commit | `bb91751` en `main` |

---

## 🧠 Decisión arquitectónica — Mesa de expertos sobre LLM

**Primario: Groq + Llama 3.3 70B Versatile**
- Latencia ~0.5s (vs 2-3s de competencia) → Roberto contento.
- Free tier 14,400 req/día → cubre ~480 usuarios activos.
- JSON mode nativo + instruction-following 95%.
- API key configurada como `GROQ_API_KEY` en Supabase secrets.

**Fallback: Google Gemini 2.0 Flash**
- Cuota free independiente de Groq (no comparte rate limit).
- Si Groq cae 5xx 2x seguidas, rotamos a Gemini para esa request.
- API key configurada como `GEMINI_API_KEY` en Supabase secrets.

**Cascada completa:**
1. Groq → si falla validación o red…
2. Groq retry con prompt más estricto → si falla…
3. Gemini → si falla…
4. Fallback templates (siempre funciona, no requiere red).

> Detalle del razonamiento en bitácora MEMORY.md, entrada 2026-06-08.

---

## 🎯 Lo que se construyó

### Motor `src/features/meal-generator/` (TypeScript, testeado con Vitest)

| Archivo | Función |
|---------|---------|
| `types.ts` | Itf* del dominio + `MEAL_DISTRIBUTION` (25/35/30/5/5) |
| `nutritional-target.ts` | `computeMealTarget` distribuye macros diarias por meal_type |
| `ingredient-pool.ts` | `filterIngredientPool` + `prioritizeByRegion`. Filtra por dietary_restrictions, dislikedFoods, allergies, budget_level |
| `component-selector.ts` | `selectComponents` con cantidades exactas en gramos (clamp 30-400, redondeo a 5g) |
| `compose-prompt.ts` | `SYSTEM_PROMPT` + `buildUserPrompt` + `maxPrepTimeForUser` (15/25/35 según cooksAtHome) |
| `plate-validator.ts` | `validateMealResponse` — 9 reglas estrictas (JSON, conteo, campos, ingredientes, prep_time, steps, dificultad, palabras prohibidas) |
| `fallback-templates.ts` | `buildMealFallback` con 3 plantillas (bowl, al ajillo, salteado) — siempre devuelve 3 opciones válidas |
| `seed-ingredients.ts` | 26 ingredientes LATAM con macros reales (USDA + Tabla Peruana) |
| `index.ts` | Barrel público |
| `meal-generator.test.ts` | **32 tests** cubriendo cada función + integración (fallback pasa el propio validador) |

### Edge Function `supabase/functions/generate-meal-options/`

| Archivo | Función |
|---------|---------|
| `_shared/cors.ts` | `corsHeaders` + `jsonRes` reutilizable |
| `_shared/meal-engine.ts` | Motor portado a Deno (mirror del frontend, ~430 líneas) |
| `_shared/seed-ingredients.ts` | Mirror del seed |
| `_shared/llm-providers.ts` | `createGroqProvider` + `createGeminiProvider` con timeout 8s |
| `generate-meal-options/index.ts` | **Orquestador**: auth → rate limit → profile → target → pool → selector → cascada IA → fallback → log a `pattern_insights` |

**Rate limiting:** 30 generaciones/usuario/día (suficiente para uso normal).

**Logging:** cada generación deja una fila en `pattern_insights` con tipo `meal_generated` (o `ai_fallback_used` si cayó al template), permitiendo analytics futuro.

### Frontend

| Archivo | Función |
|---------|---------|
| `src/interface/itfMeals.ts` | Tipos `ItfMealGenerationResponse`, `ItfGenerateMealParams` |
| `src/api/fntMeals.ts` | `fntGenerateMealOptions` invoca la Edge Function vía SDK |
| `src/hooks/useGenerateMeal.ts` | `useMutation` con toast compasivo (incluye caso fallback) |
| `src/pages/plan/PlanPage.tsx` | Demo funcional: selector meal_type, tabs de las 3 opciones, ingredientes + pasos con UI cálida |

---

## 🛡️ Validador estricto (9 reglas)

El `plate-validator.ts` rechaza cualquier respuesta de IA que:

1. No sea JSON parseable.
2. No tenga exactamente 3 opciones.
3. Le falte algún campo (`name`, `description`, `prep_time_min`, `difficulty`, `steps`).
4. Mencione ingredientes que NO estaban en la lista (heurística + lista de "free use" para condimentos básicos + lista negra de ingredientes que la IA tiende a meter como queso/azúcar/mantequilla/etc.).
5. Tenga `prep_time_min` fuera de 5-60.
6. Tenga menos de 2 o más de 10 steps.
7. Tenga steps de menos de 10 o más de 200 caracteres.
8. Tenga `difficulty` distinta de `easy`/`medium`/`hard`.
9. Contenga palabras prohibidas: punitivas (`fallaste`, `incorrecto`), médicas (`cura`, `enfermedad`), o promesas estéticas (`tonificar`, `quemar grasa`, `transformación`).

**Test coverage:** 7 tests específicos cubren cada caso de rechazo + 1 test que verifica que el propio fallback pasa la validación.

---

## 🚨 Acción pendiente del dueño — deploy de la Edge Function

La Edge Function ya está commiteada pero **necesita deploy explícito** a Supabase. Tomá ~3 minutos.

### Pasos

```powershell
# Desde la raíz del repo
cd "C:\Users\jeanc\OneDrive\Escritorio\pulsefit app"

# 1. Login con tu cuenta de Supabase (abre browser, una sola vez)
npx supabase login

# 2. Linkear el proyecto local con tu proyecto de producción
npx supabase link --project-ref jhktlubijlyzswldmncu
# Te va a pedir la contraseña de la DB que generaste cuando creaste el proyecto.

# 3. Deploy de la función
npx supabase functions deploy generate-meal-options --project-ref jhktlubijlyzswldmncu
```

### Resultado esperado

```
Deploying generate-meal-options (project ref: jhktlubijlyzswldmncu)
Bundling generate-meal-options
Bundled generate-meal-options successfully
Deployed Functions on project jhktlubijlyzswldmncu: generate-meal-options
You can inspect your deployment at https://supabase.com/dashboard/project/jhktlubijlyzswldmncu/functions
```

### Verificar que los secrets estén configurados

```powershell
npx supabase secrets list --project-ref jhktlubijlyzswldmncu
```

Debería listar `GROQ_API_KEY` y `GEMINI_API_KEY` (los que agregaste antes).

---

## 🧪 Probar el flujo end-to-end

Una vez deployada la función:

1. Abrí tu URL de Vercel (ya redeployada con el nuevo PlanPage).
2. Login → Home → tap **Plan** en el BottomNav.
3. Elegí un meal_type (Desayuno / Almuerzo / Cena / Snack).
4. Click **Generar 3 opciones**.
5. En 1-2 segundos deberías ver:
   - El target macroespecífico para esa comida (ej: 700 kcal / 49g protein / 70g carbs / 21g fat).
   - 3 opciones en tabs.
   - La opción seleccionada con sus ingredientes (cantidades exactas) y pasos.

### Si ves "Te traemos plantillas simples por ahora 🌿"

Significa que tanto Groq como Gemini fallaron. Posibles causas:
- Las API keys mal configuradas → revisá `npx supabase secrets list`.
- Free tier consumido (poco probable en el primer día).
- Rate limit interno de Groq/Gemini (también poco probable).

**Lo importante:** la app NUNCA se rompe. El fallback determinístico siempre devuelve 3 opciones válidas.

---

## 📦 Archivos creados/modificados (22)

```
Motor (frontend):
A  client-pulsefit/src/features/meal-generator/types.ts
A  client-pulsefit/src/features/meal-generator/nutritional-target.ts
A  client-pulsefit/src/features/meal-generator/ingredient-pool.ts
A  client-pulsefit/src/features/meal-generator/component-selector.ts
A  client-pulsefit/src/features/meal-generator/compose-prompt.ts
A  client-pulsefit/src/features/meal-generator/plate-validator.ts
A  client-pulsefit/src/features/meal-generator/fallback-templates.ts
A  client-pulsefit/src/features/meal-generator/seed-ingredients.ts
A  client-pulsefit/src/features/meal-generator/index.ts
A  client-pulsefit/src/features/meal-generator/meal-generator.test.ts

Frontend API:
A  client-pulsefit/src/interface/itfMeals.ts
A  client-pulsefit/src/api/fntMeals.ts
A  client-pulsefit/src/hooks/useGenerateMeal.ts
M  client-pulsefit/src/pages/plan/PlanPage.tsx
M  client-pulsefit/src/api/index.ts
M  client-pulsefit/src/hooks/index.ts
M  client-pulsefit/src/interface/index.ts

Edge Function:
A  supabase/functions/_shared/cors.ts
A  supabase/functions/_shared/meal-engine.ts
A  supabase/functions/_shared/seed-ingredients.ts
A  supabase/functions/_shared/llm-providers.ts
A  supabase/functions/generate-meal-options/index.ts
```

---

## 🚀 Próximo paso: Fase 6 — Motor `routine-generator`

Misma estructura que `meal-generator` pero para entrenamientos. Pipeline:
1. Determinar objetivo del día (full_body, upper, lower, push, pull, legs).
2. Filtrar ejercicios por nivel, lesiones, equipamiento (reglas de Carlos).
3. Prescribir series, reps, descansos según plantilla por tiempo disponible.
4. Cascada IA (Groq → Gemini): organizar orden + agregar tips por ejercicio.
5. Validador rechaza si la IA modifica series/reps/descansos.
6. Fallback: orden alfabético + tips genéricos por patrón muscular.

Detalle completo en [files/generadores-hibridos.md](files/generadores-hibridos.md) sección 5-7.

🌱
