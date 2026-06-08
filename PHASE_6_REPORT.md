# 📋 PHASE_6_REPORT.md

> Cierre formal de **Fase 6 — Motor de plan de entrenamiento con generador híbrido**.
> Fecha: **2026-06-08**.

---

## ✅ Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| Tests unitarios totales | **113/113 verdes** (29 nuevos del routine-generator) |
| Errores TypeScript strict | 0 |
| Errores lint | 0 |
| Build PWA | 804 KiB precache |
| Edge Function | `generate-workout-session` lista para deploy |
| Cascada IA | Groq → Groq retry → Gemini → fallback templates |
| Commit | `1469096` en `main` |

---

## 🎯 Lo que se construyó

### Motor `src/features/routine-generator/` (10 archivos · 29 tests)

| Archivo | Función |
|---------|---------|
| `types.ts` | Itf* del dominio + `FOCUS_PATTERNS` (mapa focus→patrones musculares) |
| `session-planner.ts` | `planSession`: decide focus + RPE objetivo. Semana 5 fuerza descarga (RPE 5). Override manual disponible |
| `exercise-pool.ts` | `filterExercisePool`: aplica focus + nivel + lesiones + equipment |
| `exercise-selector.ts` | `selectExercises`: aplica plantilla por tiempo (15/30/45/60/90 min) |
| `set-rep-calculator.ts` | `prescribePrograma`: aplica reglas de Carlos (sets/reps/rest/RPE por nivel) |
| `compose-prompt.ts` | `SYSTEM_PROMPT` + `buildUserPrompt` con instrucciones inviolables |
| `routine-validator.ts` | `validateRoutineResponse` — 11 reglas (json, block_count, exercise_modified, tip length, palabras prohibidas, advice médico, warmup/cooldown range, total_time_unrealistic) |
| `fallback-templates.ts` | `buildRoutineFallback`: orden alfabético por categoría + tips genéricos por patrón muscular |
| `seed-exercises.ts` | 21 ejercicios LATAM con clasificación por patrón/nivel/equipo/zona afectada |
| `index.ts` | Barrel público |
| `routine-generator.test.ts` | 29 tests cubriendo: planner (descarga + override + niveles), pool (lesiones + equipo + forbidden_AB), selector (rotación seed), prescripción (descarga), prompt, validador (8 casos de rechazo), fallback (orden + auto-validación) |

### Edge Function `supabase/functions/generate-workout-session/`

| Archivo | Función |
|---------|---------|
| `_shared/routine-engine.ts` | Mirror del motor en Deno (~440 líneas) |
| `_shared/seed-exercises.ts` | Mirror del seed |
| `generate-workout-session/index.ts` | Orquestador con auth + rate limit (10/día) + planner + pool + selector + prescripción + cascada Groq→Gemini→fallback + log a `pattern_insights` |

### Frontend

| Archivo | Función |
|---------|---------|
| `src/interface/itfWorkouts.ts` | `ItfWorkoutGenerationResponse`, `ItfGenerateWorkoutParams` |
| `src/api/fntWorkouts.ts` | `fntGenerateWorkoutSession` invoca la Edge Function |
| `src/hooks/useGenerateWorkout.ts` | `useMutation` con toasts compasivos (incluye semana de descarga + fallback) |
| `src/pages/registrar/RegistrarPage.tsx` | UI demo completa: selector de focus override, generar, mostrar warmup + 3-5 bloques (cada uno con sets×reps + tip + descanso) + cooldown |

---

## 🛡️ Validador estricto (11 reglas)

El `routine-validator.ts` rechaza cualquier respuesta de IA que:

1. No sea JSON parseable (`invalid_json`).
2. Falten warmup/blocks/cooldown/estimated_total_min (`missing_top_fields`).
3. El número de blocks ≠ ejercicios prescritos (`block_count_mismatch`).
4. Modifique sets/reps/rest_sec/name de cualquier ejercicio (`exercise_modified`).
5. Use un exercise_id desconocido (`exercise_modified`).
6. Tenga warmup fuera de 3-15 min (`warmup_out_of_range`).
7. Tenga cooldown fuera de 3-15 min (`cooldown_out_of_range`).
8. Tenga estimated_total_min fuera de ±40% del tiempo solicitado (`total_time_unrealistic`).
9. Tenga tips de menos de 10 chars (`tip_too_short`).
10. Tenga tips de más de 120 chars (`tip_too_long`).
11. Tips con palabras prohibidas punitivas (`forbidden_words_in_tip`) o consejo médico (`medical_advice_in_tip`).

**Test coverage:** 8 tests específicos cubren cada caso de rechazo + 1 que verifica que el propio fallback pasa la validación.

---

## 📐 Reglas de Carlos integradas

| Regla | Implementación |
|-------|----------------|
| Principiantes absolutos: solo 6 patrones base | `exercise-pool.ts` excluye `forbidden_absolute_beginner` |
| Ejercicios prohibidos para AB (peso muerto barra, sentadilla barra, press banca barra) | Tag `forbidden_absolute_beginner` en seed |
| Plantillas por tiempo (15/30/45/60/90 min) | `set-rep-calculator.ts` TIME_TEMPLATES |
| Compuestos antes que accesorios | `fallback-templates.ts` ordena por orderCategory |
| Descanso 90s default para principiantes | `restForReps` con flag isAbsoluteBeginner |
| Descarga forzada cada 5 semanas | `planSession` con `weekInBlock === 5` → RPE 5 + sets -1 + rest +20% |
| RPE objetivo por nivel (6/7/7/8) | `RPE_BY_LEVEL` en `session-planner.ts` |
| Lesiones excluyen ejercicios | `filterExercisePool` con `injuredZones` |

---

## 🚨 Acción pendiente del dueño — deploy de las 2 Edge Functions

Ambas funciones (`generate-meal-options` Fase 5 + `generate-workout-session` Fase 6) necesitan deploy explícito. Si todavía no deployaste la de Fase 5, hacelo todo de una vez:

```powershell
cd "C:\Users\jeanc\OneDrive\Escritorio\pulsefit app"

# Si aún no lo hiciste (sesión persistente, una sola vez):
npx supabase login
npx supabase link --project-ref jhktlubijlyzswldmncu

# Deploy de ambas
npx supabase functions deploy generate-meal-options --project-ref jhktlubijlyzswldmncu
npx supabase functions deploy generate-workout-session --project-ref jhktlubijlyzswldmncu
```

### Verificar

1. https://supabase.com/dashboard/project/jhktlubijlyzswldmncu/functions debe listar ambas en verde.
2. https://supabase.com/dashboard/project/jhktlubijlyzswldmncu/functions/secrets debe tener `GROQ_API_KEY` y `GEMINI_API_KEY`.

---

## 🧪 Probar el flujo end-to-end

1. Abrí tu URL de Vercel (frontend ya redeployado con el commit `1469096`).
2. Login → tap **Registrar** en el BottomNav.
3. Elegí **Auto** o forzá un focus (Tren superior / inferior / etc.).
4. **Generar mi rutina**.
5. En ~1-2s deberías ver:
   - Resumen: foco, duración estimada, RPE objetivo.
   - Tarjeta de calentamiento con 4 movimientos.
   - 3-5 bloques de ejercicios (cada uno con nombre, sets×reps, tip motivacional, tiempo de descanso).
   - Tarjeta de cool-down con 4 estiramientos.

### Si ves "Te traemos una rutina simple por ahora 🌿"

Cayó al fallback. La rutina sigue siendo válida y respeta tu nivel/equipo — solo no pasó por IA.

---

## 🚀 Próximo paso: Fase 7 — Home dinámico + registro rápido

Con los motores listos, la siguiente fase es la experiencia de uso real:
1. **Home dinámico** que muestre el plan de HOY (comida y rutina) sin tener que generarlas manualmente.
2. **Registro rápido en 3 taps** (cumple el principio fundamental del producto): comí esto / entrené esto / hoy no puedo.
3. **Persistencia** en `meal_logs` y `workout_logs`.
4. **Cron job nocturno** que pre-genera el plan del día siguiente para que el usuario abra la app y ya lo tenga.

🌱
