# 📋 Prompt Fase 6 — Motor de plan de entrenamiento con generador híbrido

> Pega este prompt a Claude Code después de haber completado Fase 5 y haberla validado.

---

## INSTRUCCIÓN PARA CLAUDE CODE

Antes de empezar, lee **OBLIGATORIAMENTE**:
1. `pulsefit-skill/SKILL.md`
2. `pulsefit-skill/MEMORY.md`
3. `pulsefit-skill/references/generadores-hibridos.md` ← secciones 5, 6, 7, 8
4. `pulsefit-skill/references/reglas-fitness.md` ← **CRÍTICO**, fuente principal
5. `PHASE_5_REPORT.md`

Verifica que Fase 5 esté completa y validada. Si algo está pendiente, **NO avances**.

---

## REGLAS DE OPERACIÓN (recordatorio crítico)

1. La IA generativa SOLO organiza orden de ejercicios y agrega tips. NUNCA selecciona ejercicios, modifica series, reps, descansos.
2. Ejercicios prohibidos para principiantes absolutos NUNCA aparecen (lista en `reglas-fitness.md`).
3. Validador rechaza outputs que cambien ejercicios, series o reps.
4. Descansos obligatorios entre sesiones se respetan automáticamente.
5. Si reporta dolor en zona X: ejercicios que afectan X se excluyen.
6. Convenciones inviolables: 3 espacios, comillas simples, sin punto y coma, alias `@`, prefijos `fnt`/`Itf`.

---

## OBJETIVO DE LA FASE 6

Después del onboarding (o cuando se solicite), la app **genera automáticamente** una rutina semanal de entrenamiento personalizada. Cada sesión respeta las reglas de Carlos: ejercicios apropiados al nivel, series/reps prescritas correctamente, descansos forzados, exclusión de ejercicios prohibidos para principiantes, y exclusión de zonas con dolor reportado. La IA aporta orden inteligente y tips motivacionales por ejercicio.

---

## TAREAS

### Tarea 1 — Estructura del motor `src/features/workout-engine/`

```
src/features/workout-engine/
├── index.ts                    # API pública
├── session-planner.ts          # determina objetivo del día
├── exercise-pool.ts            # consulta wger y filtra
├── exercise-selector.ts        # elige por patrón muscular
├── set-rep-calculator.ts       # aplica reglas de Carlos
├── ai-routine-organizer.ts     # cliente Groq con prompt restringido
├── routine-validator.ts        # valida output de IA
├── fallback-templates.ts       # plantillas de emergencia
├── progression-rules.ts        # reglas de progresión semanal
├── types.ts
└── *.test.ts
```

### Tarea 2 — `session-planner.ts`

Función `planWeeklySessions(profile: ItfProfile): ItfWeekSchedule`:

Determina qué tipo de sesión va cada día disponible del usuario, respetando:

- **Frecuencia según nivel**:
  - `absolute_beginner`: 2-3 días, full body cada uno.
  - `beginner`: 3-4 días, full body o upper/lower.
  - `intermediate`: 4-5 días, upper/lower o push/pull/legs.
  - `advanced`: 5-6 días, split.
- **Descansos forzados**: mínimo 1 día completo de descanso entre sesiones de fuerza para principiantes.
- **Distribución uniforme**: si tiene 3 días disponibles (ej: lun, mié, vie), distribuir ahí. No 3 días seguidos.
- **Cada 5 semanas**: marcar la siguiente como semana de descarga (-30% volumen).

Devuelve `{ day_of_week, session_type, target_patterns }[]`.

### Tarea 3 — `exercise-pool.ts`

Función `getExercisePool(filters: ItfExerciseFilters): Promise<ItfExercise[]>`:

1. Consulta tabla `exercises_catalog` (cache local de wger).
2. Si vacía o desactualizada (> 30 días), refresca desde API de wger.
3. Filtra por:
   - `equipment_required` ∈ `profile.equipment`.
   - `difficulty` apto para `profile.fitness_level`.
   - **Excluye ejercicios prohibidos para principiantes absolutos** (lista en `reglas-fitness.md`):
     - peso muerto convencional con barra
     - sentadilla trasera con barra
     - press de banca con barra
     - cargadas, arranques, pliométricos
     - aislamientos puros
   - **Excluye ejercicios que afecten zonas con dolor** reportado en `daily_logs` recientes.
4. Categoriza por patrón: `squat`, `hinge`, `push_horizontal`, `push_vertical`, `pull_horizontal`, `pull_vertical`, `core`, `mobility`.
5. Devuelve pool categorizado.

### Tarea 4 — `exercise-selector.ts`

Función `selectExercises(sessionType, pool, profile): ItfExerciseSelection`:

Según `session_type`:

- **Full body principiante**: 1 squat, 1 hinge, 1 push (horizontal o vertical), 1 pull, 1 core.
- **Full body intermedio**: 2 compuestos pierna, 2 compuestos torso, 1-2 accesorios, 1 core.
- **Upper**: 2 push, 2 pull, 1-2 accesorios.
- **Lower**: 1 squat, 1 hinge, 1-2 accesorios pierna, 1 core.
- **Push**: 2 push principales, 1-2 accesorios push, 1 core.
- **Pull**: 2 pull principales, 1-2 accesorios pull.
- **Legs**: 1 squat, 1 hinge, 2-3 accesorios pierna, 1 core.

Selecciona ejercicios del pool aplicando:
- Variedad entre semanas (no repetir el mismo ejercicio 3 semanas seguidas, mantener al menos 1 igual para medir progresión).
- Priorizar ejercicios con video/GIF disponible.
- Para principiantes, priorizar ejercicios con `form_tips` documentados.

### Tarea 5 — `set-rep-calculator.ts`

Función `calculateSetsReps(exercise, profile, sessionContext): ItfSetRepPrescription`:

Aplica reglas de Carlos según `fitness_level`:

- **Principiante absoluto**: 3 series × 8-10 reps, 90 seg descanso, RPE objetivo 6-7.
- **Principiante**: 3 series × 8-12 reps, 60-90 seg, RPE 7-8.
- **Intermedio**: 3-4 series × 6-12 reps según objetivo, 60-120 seg, RPE 7-8.
- **Avanzado**: 4 series × 5-12 reps según objetivo, 90-180 seg, RPE 7-9.

Para core: tiempo en seg (plancha) o reps. 2-3 series.

Para mobility (calentamiento): 1 serie × 30-60 seg cada uno.

Devuelve `{ sets, reps_or_seconds, rest_seconds, target_rpe, notes }`.

### Tarea 6 — `ai-routine-organizer.ts`

Cliente Groq con prompt según `generadores-hibridos.md` sección 6:

```ts
export const organizeRoutine = async (
   exercises: ItfExerciseWithPrescription[],
   sessionContext: ItfSessionContext
): Promise<ItfAIRoutineResponse> => {
   const prompt = buildRoutinePrompt(exercises, sessionContext)
   // Reglas implícitas en prompt:
   // - Compuestos primero, accesorios después
   // - Alternar grupos musculares en ejercicios consecutivos cuando sea posible
   // - Calentamiento de 5 min antes
   // - Cool-down de 5 min al final
   // - Tip motivacional corto por ejercicio
   // - NUNCA modificar series, reps, descansos
   const response = await callGroq({ ... })
   return parseResponse(response)
}
```

### Tarea 7 — `routine-validator.ts`

Validaciones obligatorias:

1. ✓ Mantuvo TODOS los ejercicios prescritos sin agregar ni quitar.
2. ✓ No modificó `sets`, `reps_or_seconds`, `rest_seconds`.
3. ✓ Tiempo total estimado coherente con `available_minutes` del perfil (±15%).
4. ✓ Calentamiento incluido (al menos 1 movilidad).
5. ✓ Cool-down incluido (al menos 1 estiramiento).
6. ✓ Cada ejercicio tiene un tip de máx 200 caracteres.
7. ✓ Tips no contienen consejos médicos ni diagnósticos (filtro de palabras prohibidas).
8. ✓ Tips no contradicen las reglas de seguridad (ej: "puedes hacer extra de esto si te sientes bien" → rechazar).

Devuelve `{ valid, errors, routine }`.

### Tarea 8 — `fallback-templates.ts`

Plantillas determinísticas si Groq falla:

```ts
export const generateFallbackRoutine = (
   exercises: ItfExerciseWithPrescription[],
   sessionContext: ItfSessionContext
): ItfRoutine => {
   // Orden simple: compuestos primero (alfabéticamente),
   // luego accesorios, luego core.
   // Tips genéricos por patrón muscular.
   // Calentamiento estándar de 3 movilidades.
   // Cool-down estándar de 3 estiramientos.
}
```

### Tarea 9 — `progression-rules.ts`

Función `applyProgressionForNextWeek(currentPlan, lastWeekLogs): ItfProgressionDecision`:

Aplica reglas de Carlos según `reglas-fitness.md`:

| Condición | Acción |
|-----------|--------|
| Adherencia > 80% Y RPE < 7 | Subir UNO: +5% peso, o +1 rep, o +1 serie |
| Adherencia > 80% Y RPE 7-8.5 | Mantener carga, rotar accesorio |
| Adherencia 50-80% | Mantener |
| Adherencia < 50% O RPE > 8.5 | -20% volumen, simplificar |
| Dolor zona X 2+ veces | Sustituir ejercicios, alertar |
| Cada 5 semanas | Semana de descarga forzada |

Esta función se usa en Fase 10 (revisión semanal). Por ahora solo se implementa, no se invoca aún.

### Tarea 10 — `index.ts` (API pública)

```ts
export const generateWorkoutSession = async (params): Promise<ItfWorkoutSession> => {
   const exercises = selectExercises(...)
   const exercisesWithPrescription = exercises.map(ex => ({
      ...ex,
      prescription: calculateSetsReps(ex, profile, sessionContext)
   }))
   
   try {
      const aiResponse = await organizeRoutine(exercisesWithPrescription, sessionContext)
      const validation = validateRoutine(aiResponse, exercisesWithPrescription)
      if (validation.valid) return validation.routine
      
      // Reintento con prompt más estricto
      const retry = await organizeRoutine(exercisesWithPrescription, sessionContext, { stricter: true })
      const retryValidation = validateRoutine(retry, exercisesWithPrescription)
      if (retryValidation.valid) return retryValidation.routine
      
      logFallbackUsed(params.userId, 'workout', validation.errors)
      return generateFallbackRoutine(exercisesWithPrescription, sessionContext)
   } catch (e) {
      logFallbackUsed(params.userId, 'workout', [e.message])
      return generateFallbackRoutine(exercisesWithPrescription, sessionContext)
   }
}

export const generateWeeklyWorkoutPlan = async (profile: ItfProfile): Promise<ItfWorkoutPlan> => {
   const schedule = planWeeklySessions(profile)
   const sessions = await Promise.all(schedule.map(s => generateWorkoutSession(...)))
   // Persiste en workout_plans y workout_plan_items
}
```

### Tarea 11 — Edge Functions

#### `supabase/functions/generate-workout-session/index.ts`
- Recibe: `{ dayOfWeek, sessionType }`.
- Llama `generateWorkoutSession`.
- Devuelve sesión validada.
- Timeout: 15s.

#### `supabase/functions/generate-workout-plan/index.ts`
- Recibe: nada extra (perfil del JWT).
- Llama `generateWeeklyWorkoutPlan`.
- Persiste en Supabase.
- Timeout: 60s.
- Idempotente.

### Tarea 12 — Frontend

- **`src/api/fntWorkouts.ts`** con:
  - `fntGenerateWorkoutPlan()`.
  - `fntRegenerateWorkoutSession(dayOfWeek)`.
  - `fntGetCurrentWorkoutPlan()`.
  - `fntReplaceExercise(planItemId, exerciseId, newExercise)`.

- **`src/interface/itfWorkouts.ts`** con tipos.

- **Trigger automático**: al terminar onboarding (después de generar comidas), también lanza `fntGenerateWorkoutPlan` en background.

### Tarea 13 — UX preview en Home

Como Home completa es Fase 7, agrega placeholder funcional:

- Si hoy es día de entrenamiento: card grande "Tu entrenamiento de hoy" con:
  - Tipo de sesión (full body / upper / etc.).
  - Duración estimada.
  - Lista de ejercicios con icono de equipamiento.
  - Botón "Empezar entrenamiento" → abre pantalla de ejecución (placeholder por ahora, se completa en Fase 7).
  - Botón secundario "Cambiar sesión" → llama `fntRegenerateWorkoutSession`.

- Si hoy es día de descanso: card pequeña "Hoy descansa 🌿. Una caminata suma." con sugerencia opcional de actividad ligera.

### Tarea 14 — Caché y rate limiting

- Sesiones generadas se persisten en `workout_plan_items` y se reutilizan.
- Solo se regeneran si el usuario lo solicita explícitamente.
- Rate limiting: máx 10 regeneraciones de sesiones por usuario por día.
- Refresh de catálogo wger: máx 1 vez por día por usuario.

### Tarea 15 — Tests

**Tests unitarios** (cobertura > 85%):
- `session-planner.test.ts`: distribución correcta de días según nivel y disponibilidad.
- `exercise-pool.test.ts`: filtros aplicados (sin equipamiento, con dolor, principiante absoluto).
- `exercise-selector.test.ts`: cubre todos los patrones requeridos por session_type.
- `set-rep-calculator.test.ts`: prescripciones según nivel.
- `routine-validator.test.ts`:
  - Outputs válidos pasan.
  - Outputs con ejercicios eliminados fallan.
  - Outputs con series/reps modificadas fallan.
  - Outputs con tips médicos fallan.
- `progression-rules.test.ts`: cada caso de la tabla de Carlos.
- `fallback-templates.test.ts`: rutinas coherentes.

**Tests integración:**
- Mock Groq válido → motor devuelve rutina.
- Mock Groq inválido → fallback.
- Edge Function `generate-workout-session` end-to-end.

**Test E2E** (`tests/e2e/workout-plan.spec.ts`):
- Usuario con onboarding completo abre `/home`.
- Plan semanal generado.
- Día de entrenamiento muestra sesión correcta.
- Click en ejercicio muestra GIF/video y tips.

### Tarea 16 — Casos especiales

Documenta y maneja:

- **Usuario reporta lesión en perfil**: filtrar ejercicios excluidos. Si dolor persiste 2+ semanas, mostrar pantalla "Recomendamos consulta con fisioterapeuta".
- **Usuario marca "no tengo equipamiento"**: solo ejercicios body weight + caminata.
- **Adulto mayor (60+)**: forzar `fitness_level = 'absolute_beginner'` en motor independiente del onboarding, descansos extendidos a 120s default.
- **Embarazo**: bloqueado en onboarding, pero si llegara a este punto, generar solo movilidad y caminata.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Motor `workout-engine` con tests > 85% cobertura.
- [ ] Edge Functions devuelven rutinas válidas.
- [ ] Validador rechaza outputs alterados.
- [ ] Fallback funciona.
- [ ] Plan semanal se persiste correctamente.
- [ ] Principiante absoluto NUNCA recibe ejercicios prohibidos.
- [ ] Dolor reportado excluye ejercicios correctos.
- [ ] Descansos entre sesiones de fuerza se respetan.
- [ ] Cada 5 semanas se programa descarga.
- [ ] Caché y rate limiting funcionan.
- [ ] Tests unit + integración + e2e pasan.
- [ ] `MEMORY.md` actualizado.

---

## CHECKPOINT FINAL

Al terminar:

1. Genera `PHASE_6_REPORT.md`.

2. Reporta:

```
✅ FASE 6 COMPLETADA — Generador de entrenamientos con IA validada

[Resumen breve]

📄 Reporte: PHASE_6_REPORT.md

🔍 Antes de avanzar a Fase 7 verifica:
- Tu plan semanal generado: ¿tiene sentido la distribución de días?
- Ejercicios sugeridos: ¿son apropiados para tu nivel?
- Tiempo estimado: ¿coincide con lo que indicaste poder dedicar?
- Si pones "principiante absoluto": no aparecen peso muerto ni sentadilla con barra.
- Si reportas dolor en zona X: no aparecen ejercicios que afecten X.

¿Apruebas avanzar a Fase 7? (Home dinámico + registro rápido)
Responde "sí, continúa con Fase 7" o ajustes necesarios.
```

3. **Espera respuesta explícita.**

---

**Empieza por la Tarea 1.**
