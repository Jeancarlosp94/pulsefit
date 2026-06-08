# 📋 Prompt Fase 8 — Sistema de Rescates Adaptativos

> Pega este prompt a Claude Code después de haber completado Fase 7 y validado.

> **Esta fase es el corazón diferenciador del producto.** Lo que hace que Roberto no abandone la app. Trabajar con cuidado y validar exhaustivamente.

---

## INSTRUCCIÓN PARA CLAUDE CODE

Antes de empezar, lee:
1. `pulsefit-skill/SKILL.md`
2. `pulsefit-skill/MEMORY.md`
3. `pulsefit-skill/references/sistema-rescates.md` ← **CRÍTICO**, fuente principal
4. `pulsefit-skill/references/generadores-hibridos.md` (cómo se conecta para regenerar comidas)
5. `PHASE_7_REPORT.md`

Verifica que Fases 4, 5, 6 y 7 estén completas y validadas.

---

## REGLAS DE OPERACIÓN (recordatorio crítico)

1. **Nunca culpar al usuario.** Cada mensaje pasa filtro compasivo.
2. **Siempre ofrecer alternativa** que mantenga objetivo.
3. **Atracón reportado NUNCA sugiere compensación.**
4. **Modo emergencia accesible en máximo 2 taps** desde home.
5. **Convenciones inviolables**: 3 espacios, comillas simples, sin punto y coma, alias `@`, prefijos `fnt`/`Itf`.

---

## OBJETIVO DE LA FASE 8

El usuario puede tocar "Hoy no puedo" o equivalente desde home y recibe **3 alternativas inteligentes** que mantienen su objetivo del día. La app reacciona en tiempo real, sin juicio, ofreciendo opciones reales. Cada rescate se registra para alimentar las revisiones semanales y detectar patrones.

---

## TAREAS

### Tarea 1 — Estructura del motor `src/features/rescue-engine/`

```
src/features/rescue-engine/
├── index.ts                      # API pública
├── workout-rescues.ts            # alternativas para entrenamiento
├── meal-rescues.ts               # alternativas para comida
├── emotional-rescues.ts          # rescates de ánimo
├── compensation-calculator.ts    # cálculo de compensación calórica
├── trigger-router.ts             # decide qué rescate activar según trigger
├── pattern-detector.ts           # detecta patrones para revisión semanal
├── types.ts
└── *.test.ts
```

### Tarea 2 — Implementar rescates de entrenamiento

`workout-rescues.ts`:

```ts
export const generateWorkoutRescue = (
   input: ItfWorkoutRescueInput
): ItfRescueAlternative[] => {
   const { reason, originalPlan, profile } = input

   switch (reason) {
      case 'no_time':
         return [
            buildExpressRoutine(originalPlan, 15),   // versión corta del plan
            buildWalkAlternative(20),                  // caminata
            buildSkipWithCompensation(profile)        // saltar con compensación
         ]
      case 'no_energy':
         return [
            buildWalkAlternative(20),
            buildStretchOnly(15),
            buildRestDay(profile)
         ]
      case 'low_mood':
         return [
            buildMicroSession(10),  // 10 min algo simple
            buildRestDay(profile)
         ]
      case 'injury':
         return [
            buildAlternativeRoutineExcludingZone(originalPlan, input.affectedZone),
            buildMobilityForZone(input.affectedZone),
            buildRestDay(profile)
         ]
      case 'away_from_home':
         return [
            buildBodyweightRoutine(originalPlan),
            buildHotelRoomRoutine(),
            buildWalkAlternative(30)
         ]
      case 'not_gym':
         return [
            buildHomeEquivalentRoutine(originalPlan, profile.equipment),
            buildBodyweightRoutine(originalPlan),
            buildWalkAlternative(30)
         ]
   }
}
```

Cada función `build*` es pura, devuelve `ItfRescueAlternative` con descripción clara.

### Tarea 3 — Implementar rescates de comida

`meal-rescues.ts`:

```ts
export const generateMealRescue = async (
   input: ItfMealRescueInput
): Promise<ItfRescueAlternative[]> => {
   const { reason, originalMeal, profile } = input

   switch (reason) {
      case 'no_cooking':
         // 3 alternativas: sin cocción, microondas, comprada
         return [
            await findNoCookOption(originalMeal, profile),
            await findMicrowaveOption(originalMeal, profile),
            await findStoreReadyOption(originalMeal, profile)
         ]
      case 'no_ingredients':
         // Buscador inverso desde input.availableIngredients
         return await findMealsFromAvailable(input.availableIngredients, originalMeal.targets)
      case 'eating_out':
         // Lee restaurant_guides
         return await getRestaurantGuide(input.cuisineType, originalMeal.targets)
      case 'craving':
         // Calcula cuánto puede comer y cómo balancear
         return generateBalancedCravingPlan(input.cravingItem, originalMeal, profile)
      case 'not_hungry':
         return generateMinimumViableMeal(originalMeal.targets, profile)
      case 'very_hungry':
         return generateSatietyOptions(profile)
      case 'low_budget_today':
         return await findEconomicMeals(originalMeal.targets, profile)
   }
}
```

**Conecta con `meal-generator`**: cuando se necesitan alternativas con macros equivalentes, llama a `generateMealOptions` de Fase 5.

### Tarea 4 — Implementar rescates emocionales

`emotional-rescues.ts`:

```ts
export const handleEmotionalState = (
   recentLogs: ItfDailyLog[]
): ItfEmotionalRescueAction | null => {
   // Detección automática de patrones:
   // - Mood < 2 por 2+ días → activar rescate de ánimo bajo
   // - Reporte de atracón → mensaje normalizador, NO compensación
   // - 3+ días sin abrir app → notificación suave
   // - Estrés alto → reducir 20% intensidad esa semana
   // - Pesarse 5+ veces/día detectado → sugerir ocultar peso
}
```

Cada acción incluye:
- `trigger_type` para registro.
- `messageTitle` y `messageBody` con tono compasivo verificado.
- `cta` opcional (botón con acción específica).
- `severity` (info/warn/escalation) — escalation lleva a recursos profesionales.

### Tarea 5 — Calculadora de compensación calórica

`compensation-calculator.ts`:

```ts
export const calculateCompensation = (
   skippedActivity: ItfSkippedActivity,
   profile: ItfProfile
): ItfCompensationOptions => {
   // Devuelve 3 opciones:
   // 1. Reducir kcal del día (máx -150)
   // 2. Sumar pasos (10000 pasos ≈ 300-400 kcal)
   // 3. Aceptar día como mantenimiento (recomendado por default)
}
```

**Crítico:** la opción 1 nunca recomienda más de -150 kcal. Opción 3 es default y se presenta como la más sana.

### Tarea 6 — Router de triggers

`trigger-router.ts`:

```ts
export const routeRescue = async (
   trigger: ItfTriggerEvent,
   profile: ItfProfile
): Promise<ItfRescueResponse> => {
   switch (trigger.type) {
      case 'workout_skip':
      case 'no_energy':
      case 'low_mood':
         return generateWorkoutRescue(...)
      case 'meal_change':
      case 'no_cooking':
      case 'eating_out':
      case 'craving':
         return generateMealRescue(...)
      case 'injury':
         return handleInjury(...)
   }
}
```

Cada respuesta incluye `alternatives_offered` que se persiste cuando el usuario elige.

### Tarea 7 — Modo Emergencia

Crear `src/pages/rescue/EmergencyModePage.tsx`:

Pantalla minimalista con:
- Mensaje grande: "Estás aquí. Eso ya es suficiente para hoy 🌿".
- 3 cards opcionales (no obligatorias):
  - "Una caminata de 10 min" (con timer simple).
  - "Una comida balanceada simple" (huevos + plátano + agua).
  - "Solo registra tu peso" (input simple).
- Sin métricas, sin gráficas, sin presión.
- Botón "Volver a la app normal".

Accesible desde:
1. Botón "Hoy estoy mal" en home (max 2 taps desde apertura de app).
2. FAB → Quick Actions → "Modo emergencia".

Persiste activación en `rescue_events` con `trigger_type = 'emergency_mode'`.

**Salvaguarda:** si se activa 3+ veces por semana, mostrar pantalla con recursos profesionales (sin alarmar).

### Tarea 8 — Pattern Detector

`pattern-detector.ts`:

```ts
export const detectPatterns = (
   userId: string,
   period: 'week' | 'month'
): Promise<ItfPatternInsight[]> => {
   // Consulta rescue_events del periodo
   // Detecta:
   // - "Rechaza desayuno 4+ veces/semana" → sugerir eliminar
   // - "No cocina 3+ veces/semana" → simplificar plan
   // - "Falla lunes/martes 2 semanas seguidas" → mover entrenamiento
   // - "Comer fuera 5+ veces/mes" → activar modo "vida social"
   // - "RPE alto + rescates frecuentes" → reducir intensidad
   // Persiste insights en pattern_insights table
}
```

Esta función la llamará Fase 10 (revisión semanal) automáticamente.

### Tarea 9 — Edge Function

`supabase/functions/log-rescue-event/index.ts`:

- Recibe: `{ triggerType, reason, alternativesOffered, alternativeChosen?, originalPlan }`.
- Valida JWT.
- Inserta en `rescue_events`.
- Si la alternativa requiere regeneración (ej: comida), llama a Edge Function correspondiente.
- Devuelve confirmación + cualquier dato regenerado.

### Tarea 10 — Frontend: integración con Home

Modificar componentes de Fase 7:

#### Botón "Hoy no puedo" en `WorkoutTodayCard.tsx`:
- Tap → abre bottom sheet con 6 razones predefinidas (chips grandes):
  - 🕐 Sin tiempo
  - 😴 Sin energía
  - 😔 Sin ánimo
  - 🤕 Tengo molestia
  - ✈️ Fuera de casa
  - 🚫 No puedo ir al gym
- Al elegir razón → llama `fntRequestRescue` → muestra 3 alternativas en cards grandes.
- Usuario elige una o tap en "Ninguna me convence" → registra como skipped.

#### Botón "Cambiar comida" en `MealCard.tsx`:
- Tap → bottom sheet con razones:
  - 🍳 No quiero cocinar
  - 🛒 No tengo ingredientes
  - 🍽️ Voy a comer fuera
  - 🍕 Quiero algo trampa
  - 😋 No tengo hambre
  - 🍴 Tengo mucha hambre
  - 💸 Hoy poco presupuesto
- Razón → 3 alternativas con macros mostrados.

#### Botón "Hoy estoy mal" prominente:
- Visible en home pero discreto (no intimidante).
- Tap → directo a `EmergencyModePage`.

### Tarea 11 — APIs frontend

`src/api/fntRescue.ts`:
- `fntRequestRescue(trigger, reason, context)` → llama Edge Function.
- `fntChooseAlternative(rescueEventId, alternativeIndex)` → registra elección.
- `fntMarkRescueCompleted(rescueEventId, completed)` → marca si lo hizo.
- `fntActivateEmergencyMode()` → registra activación.

### Tarea 12 — Componentes UI

`src/components/rescue/`:
- `RescueReasonSheet.tsx` — bottom sheet con chips de razones.
- `RescueAlternativesSheet.tsx` — muestra 3 alternativas.
- `AlternativeCard.tsx` — card individual con descripción, impact en macros/tiempo.
- `EmergencyButton.tsx` — botón compasivo en home.

Todas con tono compasivo verificado:
- Header de razones: "¿Qué pasa hoy? 🌿"
- Header de alternativas: "Aquí tienes opciones, tú decides 🤝"
- Si no eligen ninguna: "No pasa nada. Mañana retomamos al ritmo que puedas 🌱"

### Tarea 13 — Mensajes contextuales (sin IA todavía)

Banco de mensajes determinísticos en `src/features/rescue-engine/messages.ts`:

```ts
export const RESCUE_MESSAGES = {
   workout_skip: {
      no_time: 'Aquí van 3 opciones cortas que aún suman 🌱',
      no_energy: 'Tu cuerpo te está pidiendo descanso. Eso también construye 🌿',
      low_mood: 'Hoy seamos amables contigo. Algo pequeño cuenta mucho 💛',
      injury: 'Vamos a cuidar esa zona. Aquí van opciones que la respetan 🩹',
      away_from_home: 'Donde estés, hay opción 🌍',
      not_gym: 'En casa también se puede. Aquí van alternativas 🏠'
   },
   meal_change: {
      no_cooking: '3 opciones que no requieren cocina 🌿',
      // ... etc
   },
   binge_reported: 'Pasa. Mañana retomamos sin compensar. Sin castigo 🌿'
}
```

**Filtro de palabras prohibidas** sobre estos mensajes en tests: ninguno contiene "fallaste", "debiste", "tienes que", "no puedes".

### Tarea 14 — Tests

**Tests unitarios** (cobertura > 90% en este motor por ser crítico):
- Cada `trigger_type` genera mínimo 2 alternativas válidas.
- `compensation-calculator`: nunca recomienda > -150 kcal.
- `binge_reported` NO sugiere compensación (caso explícito).
- `pattern-detector` con datos sintéticos detecta correctamente cada patrón.
- `messages` pasan filtro de palabras prohibidas.
- Modo emergencia accesible en max 2 taps (test con árbol de navegación).

**Tests integración:**
- Flujo completo: usuario tap "Hoy no puedo" → razón → alternativa → registro.
- Edge Function `log-rescue-event` end-to-end.

**Test E2E** (`tests/e2e/rescue-flow.spec.ts`):
- Usuario en home → tap "Hoy no puedo" en entrenamiento → elige "sin energía" → recibe 3 alternativas → elige caminata → marca completada → verifica registro en `rescue_events`.

**Test E2E adicional**: usuario reporta atracón → verifica que el mensaje NO sugiere compensación.

### Tarea 15 — Métricas internas

Implementar logging para análisis posterior:
- Cada rescate registra `event_time` para análisis temporal.
- `alternatives_offered` permite analizar cuáles fueron rechazadas.
- `user_completed` permite saber si la alternativa funcionó.

Estas métricas alimentan Fase 11 (detección de patrones).

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Motor `rescue-engine` con tests > 90% cobertura.
- [ ] Cada `trigger_type` produce mínimo 2 alternativas válidas.
- [ ] Compensación calórica nunca excede -150 kcal.
- [ ] Atracón NO sugiere compensación (validado).
- [ ] Modo emergencia accesible en max 2 taps desde home.
- [ ] Pattern detector identifica correctamente los 5 patrones definidos.
- [ ] Edge Function `log-rescue-event` funciona.
- [ ] Botones "Hoy no puedo" y "Cambiar comida" integrados en home.
- [ ] Mensajes pasan filtro de palabras prohibidas (test automatizado).
- [ ] Modo offline: rescates funcionan con datos cacheados, registros se encolan.
- [ ] Tests unit + integración + e2e pasan.
- [ ] `MEMORY.md` actualizado.

---

## CHECKPOINT FINAL — VALIDACIÓN EXTRA CUIDADOSA

Esta fase es el corazón del producto. Reporte detallado obligatorio.

```
✅ FASE 8 COMPLETADA — Sistema de Rescates Adaptativos

[Resumen ampliado: 10-15 líneas explicando cómo funciona el flujo
completo, qué tipos de rescates están disponibles, métricas de los
mensajes (cuántos pasaron filtro), cobertura de tests crítica]

📄 Reporte detallado: PHASE_8_REPORT.md

⚠️ ESTA ES LA FASE MÁS IMPORTANTE DEL PRODUCTO. Por favor valida con
profundidad antes de avanzar.

🔍 Validación obligatoria antes de Fase 9:

1. Prueba "Hoy no puedo" en entrenamiento con cada razón:
   - ¿Las alternativas tienen sentido?
   - ¿El lenguaje se siente compasivo?
   - ¿Te dan ganas de cumplir alguna?

2. Prueba "Cambiar comida" con cada razón:
   - ¿Las alternativas mantienen macros aproximados?
   - ¿Hay opciones reales para "no quiero cocinar"?

3. Activa Modo Emergencia:
   - ¿Se siente acogedor, no intimidante?
   - ¿Volverías de él fácilmente?

4. Simula reportar atracón:
   - VERIFICA que NO sugiera compensación.
   - El mensaje debe ser normalizador.

5. Lee 5-10 mensajes contextuales:
   - ¿Sientes que un humano te está hablando?
   - ¿Cero juicio?

¿Apruebas avanzar a Fase 9 (Progreso, gráficas, logros)?
Responde "sí, continúa con Fase 9" o ajustes específicos.
```

**Espera respuesta explícita y detallada del usuario.**

---

**Empieza por la Tarea 1.**
