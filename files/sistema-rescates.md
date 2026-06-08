# 🌿 Sistema de Rescates Adaptativos — Validado por todo el equipo

> Referencia técnica para el motor `src/features/rescue-engine/`. Lee este archivo cuando vayas a implementar o modificar la lógica adaptativa en tiempo real (alternativas cuando el usuario no puede cumplir el plan original).

> **Este es el corazón diferenciador del producto.** Lo que hace que Roberto NO abandone PulseFit como abandonó las 5 apps anteriores.

---

## Filosofía del sistema

La rigidez es la razón #1 de abandono de apps fitness. PulseFit reacciona a cómo se siente el usuario AHORA, no según un plan escrito hace 7 días.

**Principios:**
1. **Nunca culpar** al usuario por no cumplir el plan.
2. **Siempre ofrecer una alternativa** que mantenga el objetivo del día.
3. **El usuario puede rechazar** todas las alternativas sin consecuencia.
4. **Aprender silenciosamente** del patrón para ajustar la próxima semana.
5. **Balance semanal sobre balance diario.** Un día "perdido" no arruina la semana.

---

## Tipos de triggers

Definidos en el enum SQL `trigger_type`:

```
workout_skip   - "Hoy no puedo entrenar"
meal_change    - "Quiero cambiar esta comida"
no_cooking     - "No quiero cocinar"
eating_out     - "Voy a comer fuera"
low_mood       - "Hoy me siento mal"
no_energy      - "Sin energía"
injury         - "Tengo una molestia"
craving        - "Quiero algo trampa"
```

---

## Rescates de entrenamiento

Cuando el usuario marca "Hoy no puedo entrenar" o "Sin ánimo":

| Razón seleccionada | Sugerencia primaria | Compensación calórica |
|---------------------|---------------------|----------------------|
| `no_time` (< 30 min) | Rutina express 10-15 min con compuestos | "Súmale 2000 pasos al día" |
| `no_energy` | Caminata 20-30 min + estiramiento | Reducir 100 kcal del día |
| `low_mood` | Opción A: 10 min de algo. Opción B: descansar sin culpa | Aceptar día como mantenimiento |
| `injury` | Rutina alternativa que evite zona afectada | Mantener déficit normal |
| `away_from_home` | Rutina sin equipamiento + caminata | Mantener |
| `not_gym` | Rutina equivalente en casa | Mantener |

**Lógica de compensación calórica:**
Si se reduce/elimina ejercicio del día, ofrecer 3 opciones al usuario:

1. **Reducir kcal del día**: ajustar -100 a -150 kcal (máximo).
2. **Sumar pasos**: 10,000 pasos ≈ 300-400 kcal según peso.
3. **Aceptar día de mantenimiento**: sin déficit hoy, el balance semanal compensa.

**El usuario elige.** Default sugerido: opción 3 (la más compasiva, reduce ansiedad).

---

## Rescates de comida

| Situación | Respuesta de la app |
|-----------|---------------------|
| `no_cooking` | 3 alternativas: sin cocción (5 min), microondas (10 min), comprada (qué pedir y dónde) |
| `no_ingredients` | Buscador inverso: usuario pone ingredientes disponibles, motor sugiere comida con esos que cumpla macros |
| `eating_out` | Pregunta tipo de restaurante, devuelve guía de qué pedir. Lee `restaurant_guides` |
| `craving` (pizza, helado, etc.) | Calcula cuánto puede comer y cómo balancear el resto del día. Sin culpa |
| `not_hungry` | Sugerencia mínima viable + recordatorio de proteína |
| `very_hungry` | Snacks saciantes bajo aporte calórico + check sueño/agua |
| `low_budget_today` | Plan económico con básicos: huevo, atún enlatado, arroz, frijoles, plátano, lentejas, avena |

### Guías de restaurante (datos en tabla `restaurant_guides`)

Precompilar estas guías. Ejemplos:

```json
{
   "cuisine_type": "chinese",
   "recommended_orders": [
      { "name": "Pollo a la plancha con verduras al wok", "kcal_approx": 500, "protein_g_approx": 40 },
      { "name": "Sopa wonton + brócoli con ajo", "kcal_approx": 400, "protein_g_approx": 25 }
   ],
   "avoid_list": ["arroz frito", "salsas dulces tipo orange chicken", "tempura", "egg rolls"],
   "tips": "Pide salsas aparte. Prioriza vapor o plancha sobre frituras."
},
{
   "cuisine_type": "pizza",
   "recommended_orders": [
      { "name": "2 porciones medianas + ensalada", "kcal_approx": 700, "protein_g_approx": 30 }
   ],
   "avoid_list": ["pepperoni doble", "queso extra", "borde relleno"],
   "tips": "Prioriza vegetales como topping. Agua sin gas."
}
```

Cubrir mínimo: chinese, pizza, hamburguesa, sushi, mexicano, peruano, ecuatoriano, colombiano, argentino, brasileño, italiano, japonés, tailandés, vegetariano genérico.

### Integración con el generador híbrido

Cuando el usuario rechaza una comida sugerida y pide alternativa, el motor llama al generador híbrido (`generate-meal-options`) que devuelve 3 nuevas opciones con los **mismos macros** pero diferentes ingredientes/preparación. La IA solo combina creativamente — el motor garantiza que los macros target del día se mantienen. Si la IA falla 2 veces, el rescate cae a las plantillas determinísticas. Ver `generadores-hibridos.md` sección 2.

---

## Rescates emocionales

| Estado detectado | Acción |
|------------------|--------|
| Ánimo bajo (1-2/5) reportado por 2+ días | Mensaje: "Hoy seamos amables contigo. Solo registra tu peso y come algo nutritivo. Eso ya es ganar." |
| Ansiedad por la balanza | Sugiere ocultar peso por 1 semana, enfocar en otras métricas (energía, fuerza, ropa) |
| Atracón reportado | "Pasa. Mañana retomamos sin compensar. Sin castigo 🌿" — NUNCA sugerir compensación |
| 3+ días sin abrir la app | Email/notificación: "Sin presión. Cuando quieras, aquí estamos." |
| Estrés alto reportado | Reducir automáticamente 20% intensidad esa semana, sin pedir confirmación |
| Reporta dolor o lesión 2+ veces | Sugerir consulta con fisioterapeuta, ofrecer recursos |

**LENGUAJE OBLIGATORIO:** nunca normativo, nunca diagnosticar. Siempre invitar.

---

## Flujo técnico del Modo Adaptativo

```
Usuario abre la app
   ↓
App detecta hora/contexto:
   - ¿Es mañana? Sugiere desayuno y check de ánimo
   - ¿Es horario de entrenamiento? Pregunta si va a entrenar
   - ¿Es noche? Resumen del día, ánimo de cierre
   ↓
Usuario presiona "Hoy no puedo" / "Cambiar comida" / "Sin ánimo"
   ↓
Motor de decisión (rescue-engine):
   1. Detecta razón (1 tap)
   2. Consulta plan original del día
   3. Aplica reglas de rescate
   4. Calcula compensación necesaria
   5. Genera 2-3 alternativas
   ↓
Usuario elige (o rechaza todas)
   ↓
App registra en rescue_events:
   - trigger_type
   - reason
   - alternatives_offered
   - alternative_chosen
   - user_completed (después)
   ↓
Datos alimentan revisión semanal:
   - Si recurrentemente falla los lunes → mover entrenamiento a otro día
   - Si recurrentemente "no quiere cocinar" → ajustar plan a comidas más simples
   - Si rechaza siempre el desayuno → cambiar estructura de comidas
```

---

## Implementación esperada del motor

### Estructura de archivos
```
src/features/rescue-engine/
├── index.ts                    # API pública del motor
├── workout-rescues.ts          # Lógica de rescates de entrenamiento
├── meal-rescues.ts             # Lógica de rescates de comida
├── emotional-rescues.ts        # Lógica de rescates emocionales
├── compensation-calculator.ts  # Cálculo de compensación calórica
└── types.ts                    # Tipos del dominio
```

### Patrón de implementación

```ts
// src/features/rescue-engine/workout-rescues.ts
import type { ItfWorkoutRescueInput, ItfRescueAlternative } from './types'

export const generateWorkoutRescue = (input: ItfWorkoutRescueInput): ItfRescueAlternative[] => {
   const { reason, originalPlan, profile } = input

   switch (reason) {
      case 'no_time':
         return [
            buildExpressRoutine(originalPlan, 15),
            buildWalkAlternative(20),
            buildSkipWithCompensation(originalPlan, profile)
         ]
      case 'no_energy':
         return [
            buildWalkAlternative(20),
            buildStretchOnly(15),
            buildRestDay(profile)
         ]
      case 'low_mood':
         return [
            buildMicroSession(10),
            buildRestDay(profile)
         ]
      // ... etc
   }
}
```

**Funciones puras.** Sin acceso a Supabase ni Dexie. Reciben input, devuelven output. Testeables al 100%.

### Edge Function asociada

```ts
// supabase/functions/log-rescue-event/index.ts
// Recibe la alternativa elegida del cliente y la persiste en rescue_events.
// El motor frontend hizo el cálculo, el backend solo registra.
```

---

## Detección de patrones (para el `review-engine`)

El motor de revisión semanal lee `rescue_events` y detecta:

| Patrón | Umbral | Ajuste sugerido |
|--------|--------|-----------------|
| Rechaza desayuno 4+ veces/semana | 4+ rescates `meal_change` en breakfast | Eliminar desayuno del plan, ajustar a 4 comidas |
| "No cocina" 3+ veces/semana | 3+ rescates `no_cooking` | Cambiar plan a comidas de máx 15 min de prep |
| Falla lunes/martes 2 semanas seguidas | Rescates `workout_skip` esos días | Mover entrenamiento de esos días a otros |
| Recurrentes "comer fuera" | 5+ rescates `eating_out` por mes | Activar modo "vida social" con plan flexible |
| RPE alto + rescates frecuentes | Combo detectado | Reducir intensidad 20% próxima semana |

Estos patrones se persisten en `pattern_insights` y se aplican automáticamente en la revisión semanal con confirmación del usuario.

---

## Modo Emergencia

Pantalla especial accesible desde el botón "Hoy estoy mal". Reduce TODO al mínimo viable:

```
- Una caminata de 10 minutos (opcional)
- Una comida balanceada simple (huevos + plátano + agua)
- Mensaje: "Estás aquí. Eso ya es suficiente para hoy."
- Sin métricas, sin gráficas, sin presión.
```

Activable cualquier día, máximo 2 veces por semana sin alertar (más allá de eso el motor sugiere apoyo profesional).

---

## Lenguaje obligatorio del sistema

✅ Mensajes correctos:
- "Ajustemos juntos 🌱"
- "Hoy no, mañana sí 🌿"
- "Pasa. Mañana retomamos."
- "Te ofrezco estas opciones, tú decides 🤝"
- "Tu cuerpo te está hablando, escuchémoslo 🌊"

❌ Mensajes prohibidos:
- "Fallaste"
- "No cumpliste"
- "Tienes que..."
- "Debiste..."
- "Te estás saboteando"
- Cualquier comparación con otros usuarios

---

## Capa de IA generativa

**La IA entra al producto en Fases 5, 6 y 10**, no solo en la última. Está integrada a:

| Fase | Función IA | Edge Function |
|------|-----------|---------------|
| **5** | Componer creativamente platos (nombre + pasos) sobre ingredientes ya seleccionados por el motor | `generate-meal-options` |
| **6** | Organizar ejercicios ya prescritos + agregar tips por ejercicio | `generate-workout-session` |
| **10** | Resumen semanal personalizado + mensajes contextuales diarios + sugerencias creativas en rescates | `weekly-review`, `ai-message` |

### En todas las fases la IA cumple las mismas reglas

**Sí usar IA para:**
1. Combinar ingredientes pre-seleccionados en platos con nombre cálido y pasos (Fase 5).
2. Organizar ejercicios pre-prescritos en el mejor orden y agregar tips de forma/respiración (Fase 6).
3. Redactar resumen de la revisión semanal en lenguaje cálido y personalizado (Fase 10).
4. Generar mensaje motivacional contextual diario, basado en datos reales del usuario (Fase 10).
5. Sugerir sustituciones creativas de comida cuando el usuario rechaza varias alternativas en un rescate (Fase 8 + Fase 10).

**NO usar IA para:**
- Decisiones médicas o nutricionales (todo determinístico con reglas validadas).
- Cálculos calóricos, TMB, GET, distribución de macros.
- Prescripción de ejercicio: series, reps, cargas, descansos, progresión.
- Diagnóstico de patrones problemáticos (banderas rojas, atracones, sobre-ejercicio).
- Cualquier output sin validación posterior.

**Razón:** la IA generativa puede alucinar. Los cálculos críticos van con reglas determinísticas. La IA solo embellece, organiza y personaliza el lenguaje sobre datos ya validados por el motor.

**Capa de seguridad obligatoria:** después de cada respuesta de IA hay un validador estricto. Si el output viola las restricciones (modifica cantidades, agrega ingredientes nuevos, cambia series/reps, mete consejos médicos), se reintenta una vez con prompt más estricto y, si vuelve a fallar, se cae a una plantilla determinística (fallback). La app NUNCA queda sin plan.

> Para detalles del uso de IA en generación de comidas y rutinas — flujos paso a paso, prompts exactos, reglas del validador, plantillas de fallback, métricas de monitoreo — ver `references/generadores-hibridos.md`.

---

## Tests obligatorios

Antes de cerrar el sistema de rescates, tener tests unitarios para:

- [ ] Cada `trigger_type` genera al menos 2 alternativas válidas.
- [ ] La compensación calórica nunca recomienda > -150 kcal en un día.
- [ ] Atracón reportado NO sugiere compensación.
- [ ] Modo emergencia accesible en máximo 2 taps desde el home.
- [ ] Patrón "rechaza desayuno" se detecta correctamente con datos sintéticos.
- [ ] Lenguaje de cada mensaje pasa filtro de "palabras prohibidas".

---

## Métricas de éxito del sistema

Para validar que el sistema funciona, medir en beta:

- **Adherencia 30 días**: % de usuarios que abren la app día 30.
- **Uso de rescates**: % de usuarios que han usado al menos 1 rescate (objetivo: > 70%).
- **NPS específico de rescates**: pregunta "¿Te ayudó la opción 'Hoy no puedo'?" (objetivo: > 8/10).
- **Reducción de churn**: comparar con benchmark de apps fitness (típico: 70% abandono al mes 1; objetivo: < 50%).
