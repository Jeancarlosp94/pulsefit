# 📋 Prompt Fase 10 — Sistema de revisión semanal + IA generativa (Groq)

> Pega este prompt a Claude Code después de haber completado Fase 9 y validado.

---

## INSTRUCCIÓN PARA CLAUDE CODE

Antes de empezar, lee:
1. `pulsefit-skill/SKILL.md`
2. `pulsefit-skill/MEMORY.md`
3. `pulsefit-skill/references/sistema-rescates.md` (sección IA al final)
4. `pulsefit-skill/references/generadores-hibridos.md` (sección 9 caché y costos)
5. `pulsefit-skill/references/reglas-fitness.md` (reglas de progresión)
6. `pulsefit-skill/references/formulas-nutricion.md`
7. `PHASE_9_REPORT.md`

---

## REGLAS DE OPERACIÓN (críticas en esta fase)

1. **IA generativa SOLO redacta**, nunca calcula ni decide.
2. Cálculos de ajustes los hace el motor determinístico, IA los narra.
3. Toda decisión propuesta es **opt-in del usuario**, no automática.
4. Mensajes generados por IA pasan validador (sin diagnósticos, sin afirmaciones médicas).
5. Si Groq falla, fallback con plantillas determinísticas funcionando.
6. Convenciones inviolables.

---

## OBJETIVO DE LA FASE 10

Cada domingo (o intervalo configurable, default 7-14 días), el sistema analiza la semana del usuario, calcula ajustes recomendados con reglas determinísticas, y genera un mensaje cálido con IA explicando los cambios. El usuario revisa, aprueba/rechaza/modifica, y el plan se actualiza para la siguiente semana.

Adicionalmente: mensajes motivacionales contextuales diarios generados con IA, también validados.

---

## TAREAS

### Tarea 1 — Estructura del motor `src/features/review-engine/`

```
src/features/review-engine/
├── index.ts
├── weekly-analyzer.ts          # calcula métricas de la semana
├── adjustment-rules.ts         # reglas para proponer ajustes
├── ai-summary-writer.ts        # genera mensaje cálido con Groq
├── summary-validator.ts        # valida output de IA
├── fallback-templates.ts       # plantillas si IA falla
├── types.ts
└── *.test.ts
```

### Tarea 2 — `weekly-analyzer.ts`

```ts
export const analyzeWeek = async (userId: string, weekStart: Date): Promise<ItfWeeklyMetrics> => {
   // Calcula:
   // - meal_adherence: % comidas registradas vs planeadas
   // - workout_adherence: % sesiones completadas vs planeadas
   // - weight_change: peso inicio - peso fin de semana
   // - weight_change_pct: % del peso corporal
   // - rpe_average: promedio de RPE de entrenamientos
   // - energy_average: promedio de energy_level
   // - mood_average: promedio de mood_level
   // - sleep_average: horas promedio
   // - protein_target_hit_days: días que cumplió proteína
   // - rescues_used_count: cuántos rescates usó
   // - rescues_breakdown: por trigger_type
   // - patterns_detected: insights del pattern-detector
   // - red_flags: flags activos
}
```

### Tarea 3 — `adjustment-rules.ts`

Aplica reglas de Carlos y Lucía para proponer ajustes:

```ts
export const proposeAdjustments = (metrics: ItfWeeklyMetrics, profile: ItfProfile): ItfProposedAdjustments => {
   const adjustments: ItfAdjustment[] = []

   // Calorías
   if (metrics.weight_change_pct > 1.0) {
      adjustments.push({
         type: 'kcal_increase',
         from: profile.target_kcal,
         to: profile.target_kcal + 200,
         reason: 'Pérdida más rápida de lo recomendado'
      })
   }
   if (metrics.weight_change_pct < 0.2 && profile.goal === 'lose' && weeksWithoutChange >= 2) {
      adjustments.push({
         type: 'kcal_decrease',
         from: profile.target_kcal,
         to: profile.target_kcal - 100,
         reason: 'Estancamiento sostenido'
      })
   }

   // Entrenamiento
   if (metrics.workout_adherence > 80 && metrics.rpe_average < 7) {
      adjustments.push({
         type: 'workout_progress',
         action: 'Subir intensidad: +5% peso o +1 rep en compuestos'
      })
   }
   if (metrics.workout_adherence < 50 || metrics.rpe_average > 8.5) {
      adjustments.push({
         type: 'workout_simplify',
         action: 'Reducir 20% volumen, simplificar rutina'
      })
   }

   // Patrones detectados
   metrics.patterns_detected.forEach(pattern => {
      adjustments.push(buildAdjustmentForPattern(pattern))
   })

   // Banderas rojas
   metrics.red_flags.forEach(flag => {
      adjustments.push(buildAdjustmentForRedFlag(flag))
   })

   return { adjustments, priority: rankByImpact(adjustments) }
}
```

### Tarea 4 — `ai-summary-writer.ts`

Cliente Groq que SOLO redacta el resumen narrativo.

Prompt template (en `pulsefit-skill/references/generadores-hibridos.md` agregar nueva sección 13 con este prompt):

```
SYSTEM:
Eres el coach de PulseFit. Tu único trabajo es redactar un resumen
semanal cálido y compasivo basado en métricas que se te entregan.

REGLAS ABSOLUTAS:
- NUNCA inventas números, métricas o ajustes.
- SOLO usas los datos del input.
- NUNCA das consejos médicos ni nutricionales específicos.
- NUNCA mencionas "fallaste", "no cumpliste", "estás mal".
- Tono: como un amigo que se preocupa, no como un entrenador exigente.
- Máximo 4 párrafos cortos.
- Termina siempre con una frase de apoyo.
- Devuelves JSON con estructura exacta.

USER:
Esta es la semana de {nombre}:
- Adherencia comidas: {meal_adherence}%
- Adherencia entrenamientos: {workout_adherence}%
- Cambio peso: {weight_change} kg ({weight_change_pct}%)
- RPE promedio: {rpe_average}
- Energía promedio: {energy_average}/5
- Ánimo promedio: {mood_average}/5
- Rescates usados: {rescues_used_count}
- Patrones notados: {patterns_detected}

Ajustes que el motor propone (NO los inventes, úsalos como están):
{proposed_adjustments_summary}

Devuelve JSON:
{
  "greeting": "saludo personalizado de 1 oración",
  "summary": "resumen empático de la semana, 2-3 oraciones",
  "highlights": ["positivo 1 concreto", "positivo 2 concreto"],
  "adjustments_intro": "frase introduciendo los cambios sugeridos",
  "closing": "mensaje de apoyo final, 1 oración"
}
```

### Tarea 5 — `summary-validator.ts`

Valida output de IA:

1. ✓ Parsing JSON correcto.
2. ✓ Campos obligatorios presentes.
3. ✓ Longitudes razonables (greeting 5-100 chars, summary 50-300, etc).
4. ✓ No contiene palabras prohibidas: "fallaste", "no cumpliste", "deberías haber", "necesitas", "tienes que".
5. ✓ No menciona números/métricas que no estén en el input (regex contra los números proporcionados).
6. ✓ No contiene afirmaciones médicas: regex contra "diagnostico", "trastorno", "enfermedad", "patología", "déficit nutricional".

Si falla: 1 reintento con prompt más estricto, luego fallback.

### Tarea 6 — `fallback-templates.ts`

Plantillas determinísticas con placeholders:

```ts
export const buildFallbackSummary = (metrics: ItfWeeklyMetrics, profile: ItfProfile): ItfSummary => {
   const adherenceLevel =
      metrics.meal_adherence > 80 ? 'high' :
      metrics.meal_adherence > 50 ? 'medium' : 'low'

   return {
      greeting: `Hola ${profile.name}, revisemos tu semana 🌿`,
      summary: TEMPLATE_BY_ADHERENCE[adherenceLevel](metrics),
      highlights: extractHighlights(metrics),
      adjustments_intro: 'Te propongo estos pequeños cambios:',
      closing: '¡Sigamos paso a paso, sin prisa! 🌱'
   }
}
```

### Tarea 7 — Edge Function `weekly-review`

`supabase/functions/weekly-review/index.ts`:

1. Identifica usuarios con revisión pendiente (último review > 7 días, con `pg_cron`).
2. Por cada usuario:
   - Llama `analyzeWeek`.
   - Llama `proposeAdjustments`.
   - Llama `composeSummary` (IA + validador + fallback).
   - Inserta en `reviews` con status `pending` y `user_decision = null`.
   - Envía notificación al usuario "Tu revisión semanal está lista 🌿".

Programada con `pg_cron`:

```sql
SELECT cron.schedule('weekly-review', '0 8 * * 0', $$ -- domingos 8am
   SELECT net.http_post(
      url := 'https://<project>.supabase.co/functions/v1/weekly-review',
      headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
   );
$$);
```

### Tarea 8 — Pantalla de revisión semanal

`src/pages/review/WeeklyReviewPage.tsx`:

Estructura:

```
[Card grande: Resumen de la semana]
  - Greeting personalizado (de IA)
  - Summary párrafo (de IA)
  - Highlights (chips con logros concretos)

[Sección: Métricas visuales]
  - 4 mini cards: adherencia, peso, energía, RPE
  - Comparativa con semana anterior

[Sección: Ajustes propuestos]
  - Lista de cambios sugeridos
  - Cada uno con explicación clara
  - Toggle individual: aceptar / rechazar
  - Botón global: "Aceptar todo" / "Mantener plan actual"

[Closing message]
  - Mensaje de apoyo (de IA)

[Botón principal]
  - "Aplicar cambios y empezar nueva semana"
```

### Tarea 9 — Aplicación de ajustes

`src/features/review-engine/apply-adjustments.ts`:

```ts
export const applyAdjustments = async (reviewId: string, decisions: ItfDecisions): Promise<void> => {
   // Para cada ajuste aceptado:
   // - kcal_increase/decrease: actualizar profile.target_kcal y regenerar plan de comidas
   // - workout_progress: aplicar progresión via progression-rules
   // - workout_simplify: reducir volumen
   // - schedule_change: mover días de entrenamiento
   // 
   // Marca review como applied_changes con qué se aplicó.
   // Marca user_decision (accepted_all / partial / rejected).
}
```

Si ajustes incluyen regeneración de plan: invoca Edge Function correspondiente (Fases 5/6).

### Tarea 10 — Mensajes motivacionales diarios con IA

`supabase/functions/ai-message/index.ts`:

Generación bajo demanda cuando el usuario abre la app por primera vez en el día:

```
Input al modelo:
- Resumen breve del estado: día N de plan, adherencia últimos 3 días,
  ánimo último día, hoy es día de entrenamiento o descanso.

Output: 1 mensaje motivacional contextual de 1-2 oraciones.

Ejemplos esperados:
- "Llevas 3 días al hilo, tu cuerpo está respondiendo bien 🌱"
- "Hoy descansamos. El descanso también construye 🌿"
- "Sin presión, vamos paso a paso 💛"
```

Validador rechaza si:
- Más de 200 caracteres.
- Contiene palabras prohibidas.
- Menciona métricas que no recibió.

Caché: 1 mensaje por usuario por día. Si Groq falla, plantilla determinística.

### Tarea 11 — Sustituciones creativas con IA (en rescates)

Mejora del motor de rescates de Fase 8: cuando el usuario rechaza las 3 alternativas iniciales, llamar a IA para generar 3 nuevas más creativas.

Aplica las mismas reglas: ingredientes restringidos, validador estricto, fallback.

### Tarea 12 — APIs frontend

`src/api/fntReview.ts`:
- `fntGetPendingReview()`.
- `fntApplyReviewDecisions(reviewId, decisions)`.
- `fntGetDailyMessage()` (con caché local del día).

### Tarea 13 — Componentes UI

`src/components/review/`:
- `ReviewSummaryCard.tsx` — card grande con greeting + summary.
- `MetricsComparisonGrid.tsx` — 4 mini cards comparativas.
- `AdjustmentToggleList.tsx` — lista de ajustes con toggles.
- `AdjustmentCard.tsx` — card individual de ajuste con explicación.

### Tarea 14 — Caché y optimización de costos Groq

- Mensajes diarios: cache 24h.
- Resúmenes de revisión: cache hasta nueva revisión.
- Sustituciones de rescate: no cache (usuario espera variedad).
- Estimar uso: ~26 llamadas/usuario/semana en pico, dentro del free tier de Groq (14400/día).
- Implementar circuit breaker: si Groq falla 5 veces consecutivas, deshabilitar temporalmente y usar solo fallbacks.

### Tarea 15 — Tests

**Tests unitarios** (cobertura > 85%):
- `weekly-analyzer`: cálculos correctos con datos sintéticos.
- `adjustment-rules`: cada regla dispara correctamente.
- `summary-validator`: rechaza outputs alterados, palabras prohibidas, números inventados.
- `fallback-templates`: genera summaries coherentes.

**Tests integración:**
- Mock Groq válido → review generada y aplicada.
- Mock Groq inválido → fallback usado.
- Edge Function `weekly-review` end-to-end con datos sintéticos.

**Test E2E** (`tests/e2e/weekly-review.spec.ts`):
- Usuario con 7 días de datos sintéticos.
- Trigger manual de revisión.
- Pantalla de revisión carga.
- Usuario acepta ajustes parciales.
- Verifica plan actualizado.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Motor `review-engine` funcional con tests > 85%.
- [ ] Edge Function `weekly-review` programada con `pg_cron`.
- [ ] Edge Function `ai-message` con caché de 24h.
- [ ] Validador de IA bloquea: alucinaciones de números, palabras prohibidas, afirmaciones médicas.
- [ ] Fallbacks funcionan en todos los puntos donde se usa IA.
- [ ] Pantalla de revisión semanal funcional.
- [ ] Aplicación de ajustes actualiza plan correctamente.
- [ ] Caché optimiza costos.
- [ ] Mensajes diarios contextuales aparecen en home.
- [ ] Tests pasan.
- [ ] `MEMORY.md` actualizado.
- [ ] Sección sobre IA en revisión agregada a `references/generadores-hibridos.md`.

---

## CHECKPOINT FINAL

```
✅ FASE 10 COMPLETADA — Revisión semanal con IA generativa

[Resumen ampliado: cómo funciona el flujo, métricas de Groq de prueba,
casos donde se activó fallback, ejemplos de mensajes generados]

📄 Reporte: PHASE_10_REPORT.md

🔍 Antes de avanzar a Fase 11 verifica:
- Genera datos sintéticos de 7 días.
- Trigger manual una revisión.
- Lee el resumen generado: ¿se siente humano y compasivo?
- Mensaje del día: ¿es contextual a tu estado real?
- Pruébala con Groq deshabilitado: ¿el fallback funciona?
- Aplica ajustes y verifica que el plan se actualizó.
- Revisa el reporte para entender uso de IA y costos proyectados.

¿Apruebas avanzar a Fase 11 (Detección de patrones avanzada)?
```

**Espera respuesta explícita.**

---

**Empieza por la Tarea 1.**
