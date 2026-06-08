# 📋 Prompt Fase 7 — Home dinámico + registro rápido (3 taps)

> Pega este prompt a Claude Code después de haber completado Fase 6 y validado.

---

## INSTRUCCIÓN PARA CLAUDE CODE

Antes de empezar, lee:
1. `pulsefit-skill/SKILL.md`
2. `pulsefit-skill/MEMORY.md`
3. `pulsefit-skill/references/guia-completa.md` (sección de UX Home)
4. `PHASE_6_REPORT.md`

Verifica que Fases 4, 5 y 6 estén completas.

---

## REGLAS DE OPERACIÓN (recordatorio)

1. **Máximo 3 taps** para registrar cualquier acción. Si requiere más, replantear.
2. Lenguaje compasivo, cero rojo punitivo, cero "fallaste".
3. Mobile-first absoluto, modo oscuro funcional.
4. Convenciones: 3 espacios, comillas simples, sin punto y coma, alias `@`, prefijos `fnt`/`Itf`.
5. **Filtro de Roberto**: ¿abriría esta pantalla y en 2 segundos sabría qué hacer hoy?

---

## OBJETIVO DE LA FASE 7

`HomePage.tsx` se convierte en el centro de comando diario del usuario. Muestra plan del día, permite registrar comidas y entrenamiento en 3 taps, expone progreso rápido, y conecta con todas las features anteriores. Es la pantalla que el usuario verá 5+ veces al día.

---

## TAREAS

### Tarea 1 — Diseño del HomePage

Estructura propuesta (de arriba a abajo):

```
[TopBar — saludo dinámico + avatar + notificaciones]

[Card "Hoy es {tipo de día}"]
  - Tipo: día de entrenamiento / día de descanso / semana de descarga
  - Mensaje breve contextual

[Card grande: Entrenamiento de hoy] (si aplica)
  - Tipo de sesión + duración estimada
  - Vista previa de 2-3 ejercicios principales
  - Botón principal: "Empezar"
  - Botón secundario: "Hoy no puedo" (link a rescate)
  - Botón terciario: "Ya entrené"

[Cards: Comidas de hoy] (4-5 cards horizontales scrollables)
  - Cada card: emoji + nombre del plato + kcal
  - Estado visual: pendiente / completada / sustituida
  - Tap → abre detalle/registro

[Card: Resumen del día]
  - Progreso de macros (barras visuales: proteína, carbos, grasas)
  - Pasos del día (si tiene tracker conectado, opcional)
  - Agua (chips tappables, ej: 8 vasos)

[Card: Cómo te sientes hoy] (mini-encuesta)
  - Energía (slider 1-5 con caritas)
  - Ánimo (slider 1-5 con caritas)
  - Aparece solo 1 vez al día, después se colapsa

[FAB (Floating Action Button) en esquina inferior derecha]
  - "+" abre sheet con accesos rápidos:
    - Registrar peso
    - Registrar comida extra
    - Registrar agua
    - Registrar entrenamiento manual
```

### Tarea 2 — Componentes nuevos

Crear en `src/components/home/`:

- `WelcomeCard.tsx` — saludo contextual según hora y día.
- `WorkoutTodayCard.tsx` — card de entrenamiento de hoy.
- `MealsRowCard.tsx` — scroll horizontal de comidas.
- `MealCard.tsx` — card individual de comida.
- `MacrosProgressCard.tsx` — barras visuales de macros.
- `WaterTrackerCard.tsx` — chips de vasos de agua.
- `MoodCheckCard.tsx` — encuesta de ánimo y energía.
- `QuickActionFAB.tsx` — botón flotante con bottom sheet.

Componentes compartidos en `src/components/shared/`:
- `MacroBar.tsx` — barra visual reusable.
- `EnergyMoodSlider.tsx` — slider con caritas.
- `EmptyDayState.tsx` — estado cuando no hay plan aún.

### Tarea 3 — Pantalla de ejecución de entrenamiento

Crear `src/pages/workouts/WorkoutSessionPage.tsx` (accesible desde "Empezar" en home):

- Header: nombre de sesión + botón "Salir" (con confirmación).
- Lista de ejercicios verticales:
  - Cada ejercicio expandible.
  - Video/GIF embebido.
  - Tips de forma visibles.
  - Series con checkboxes individuales.
  - Input de reps logradas por serie (opcional, default = prescritas).
  - Slider de RPE al terminar el ejercicio (1-10 con caritas).
  - Timer de descanso automático entre series.
- Al terminar todos: pantalla de resumen.
  - Tiempo total.
  - RPE promedio.
  - Energía y ánimo post-entrenamiento.
  - Botón "Guardar entrenamiento".
- Persiste en `workout_logs`.

### Tarea 4 — Pantalla de registro de comida

Crear `src/pages/meals/MealLogDialog.tsx` (modal/bottom sheet desde card de comida):

Flujo en 3 taps:
1. Tap en card de comida → abre dialog.
2. Pregunta: "¿Comiste lo planeado?" → 3 botones grandes:
   - ✅ "Sí, lo comí" → tap único, registra y cierra.
   - 🔄 "Comí algo distinto" → siguiente paso.
   - ❌ "No comí esto" → marca como skipped y cierra.
3. Si "comí algo distinto": muestra buscador rápido + alimentos recientes + favoritos. Tap en alternativa → registra.

Persiste en `meal_logs`.

### Tarea 5 — Sistema de saludo dinámico

`WelcomeCard.tsx` muestra saludo según contexto:

```ts
const getGreeting = (hour: number, name: string, todaysContext: ItfTodayContext) => {
   const timeGreeting =
      hour < 6 ? '¿Madrugaste?' :
      hour < 12 ? 'Buenos días' :
      hour < 18 ? 'Buenas tardes' :
      'Buenas noches'

   const contextMessage =
      todaysContext.isWorkoutDay ? `Hoy es día de ${todaysContext.sessionType} 💪` :
      todaysContext.isRestDay ? 'Hoy descansamos 🌿' :
      todaysContext.isDeloadWeek ? 'Esta semana bajamos un poco el ritmo 🌊' :
      'Vamos paso a paso 🌱'

   return `${timeGreeting}, ${name}. ${contextMessage}`
}
```

### Tarea 6 — Lógica de "estado del día"

Función en `src/features/home-engine/today-state.ts`:

```ts
export const getTodayState = (profile, mealPlan, workoutPlan, logs): ItfTodayState => {
   // Determina:
   // - Si hoy es día de entrenamiento (consultando workout_plan_items)
   // - Comidas del día con su estado (pendiente/completada/sustituida)
   // - Macros consumidos vs target
   // - Si la encuesta de ánimo ya se respondió hoy
   // - Si hay revisión semanal pendiente (Fase 10)
   // - Si está en semana de descarga
}
```

### Tarea 7 — APIs frontend

`src/api/fntHome.ts` con:
- `fntGetTodayData()`: consulta optimizada que devuelve todo lo necesario para home.
- `fntLogMeal(params)`: registra comida (planned/sustituted/skipped).
- `fntLogWorkout(params)`: registra entrenamiento.
- `fntLogMood(energy, mood)`: registra ánimo y energía.
- `fntLogWater(amount)`: registra vasos de agua.
- `fntLogWeight(weight)`: registra peso del día.

Todas usan optimistic updates con react-query para sentirse instantáneas.

### Tarea 8 — Quick Actions FAB

`QuickActionFAB.tsx` abre bottom sheet con:

- 🏋️ Registrar entrenamiento (manual, sin haberlo planeado).
- 🍽️ Registrar comida extra (no planeada).
- 💧 Registrar agua.
- ⚖️ Registrar peso.
- 📷 Tomar foto de progreso (placeholder, se completa en Fase 9).

Cada acción es un mini-flujo de 2-3 taps.

### Tarea 9 — Performance y caché

- React Query con `staleTime: 60_000` para datos de home (1 min).
- Prefetch de detalles de comidas al cargar home (anticipa taps).
- Skeleton loaders compasivos durante carga: "Preparando tu día 🌱".
- Modo offline: leer todo desde Dexie si no hay red, sincronizar al volver.

### Tarea 10 — Microinteracciones (framer-motion)

- Cards aparecen en cascada (stagger) al cargar home: 50-100ms entre cada una.
- Tap en card → ligero scale-down (0.97).
- Registrar comida → check verde animado + confeti sutil 1 vez (no abusar).
- Cambio de día (cuando cruza medianoche) → animación de transición suave.

**No abusar de animaciones.** Cada una < 300ms.

### Tarea 11 — Tests

**Tests unitarios:**
- `today-state.test.ts`: todos los escenarios (día entrenamiento, descanso, descarga, datos faltantes).
- Componentes principales con React Testing Library (renderizado correcto en estados vacíos, cargando, completos).

**Tests de integración:**
- `MealLogDialog`: flujo completo de registro de comida.
- `WorkoutSessionPage`: flujo de ejecución de entrenamiento.

**Test E2E** (`tests/e2e/home-flow.spec.ts`):
- Usuario completa onboarding.
- Llega a home.
- Registra desayuno como "lo comí".
- Empieza entrenamiento, completa 1 ejercicio, registra RPE, guarda.
- Verifica que todo aparece en el dashboard de progreso.

### Tarea 12 — Accesibilidad

- Cada card tiene `role` y `aria-label` apropiados.
- FAB es accesible por teclado (Tab + Enter).
- Sliders de ánimo/energía operables por teclado (flechas).
- Contraste verificado en modo claro y oscuro.
- Tamaños de tap mínimo 44x44px (Apple HIG).
- Texto escala correctamente con configuración del sistema.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] HomePage carga en < 2s con datos del usuario.
- [ ] Saludo dinámico muestra mensaje correcto según hora y día.
- [ ] Plan del día muestra entrenamiento (si aplica) y comidas correctas.
- [ ] Registrar comida cumple regla de 3 taps.
- [ ] Registrar peso cumple regla de 3 taps.
- [ ] Registrar agua cumple regla de 1-2 taps.
- [ ] Pantalla de ejecución de entrenamiento funciona end-to-end.
- [ ] RPE se registra correctamente y persiste en `workout_logs`.
- [ ] Modo offline: home funciona, registros se encolan.
- [ ] Microinteracciones sutiles, no distraen.
- [ ] Accesibilidad WCAG AA verificada.
- [ ] Mobile (375px) y modo oscuro impecables.
- [ ] Tests unit + integración + e2e pasan.
- [ ] `MEMORY.md` actualizado.

---

## CHECKPOINT FINAL

```
✅ FASE 7 COMPLETADA — Home dinámico y registro rápido

[Resumen]

📄 Reporte: PHASE_7_REPORT.md

🔍 Antes de avanzar a Fase 8 verifica con uso real:
- Abre la app, ¿en 2 segundos sabes qué hacer hoy?
- Registra una comida: ¿en 3 taps o menos?
- Empieza un entrenamiento: ¿el flujo es claro?
- Apaga datos/wifi: ¿la home sigue funcionando?
- Modo oscuro impecable.

¿Apruebas avanzar a Fase 8 (Sistema de rescates adaptativos)?
Responde "sí, continúa con Fase 8" o ajustes.
```

**Espera respuesta explícita.**

---

**Empieza por la Tarea 1.**
