# 📋 Prompt Fase 9 — Progreso, gráficas y logros

> Pega este prompt a Claude Code después de haber completado Fase 8 y validado.

---

## INSTRUCCIÓN PARA CLAUDE CODE

Antes de empezar, lee:
1. `pulsefit-skill/SKILL.md`
2. `pulsefit-skill/MEMORY.md`
3. `pulsefit-skill/references/guia-completa.md` (sección de progreso)
4. `pulsefit-skill/references/formulas-nutricion.md` (banderas rojas)
5. `PHASE_8_REPORT.md`

---

## REGLAS DE OPERACIÓN

1. **Progreso no es solo el peso.** Mostrar múltiples métricas: fuerza, energía, ánimo, adherencia, ropa, fotos.
2. **Sin gráficas alarmantes.** Pérdida lenta es buena, no graficar tendencia roja.
3. **Logros nunca comparativos** con otros usuarios. Solo con tu yo pasado.
4. **Detección de banderas rojas** (Lucía) activa mensajes compasivos, nunca alarmantes.
5. Convenciones inviolables.

---

## OBJETIVO DE LA FASE 9

Pantalla de progreso completa con gráficas que motivan sin obsesionar. Sistema de logros que celebra hitos personales. Comparativas tipo "tú hace 30 días vs hoy" en múltiples dimensiones (no solo peso).

---

## TAREAS

### Tarea 1 — Estructura de pantalla de progreso

`src/pages/progress/ProgressPage.tsx` con tabs:

```
[Tab: Peso]
  - Gráfica de evolución (Recharts, line chart)
  - Comparativa: hace 30 días / actual / meta
  - Botón: "Ocultar peso por 1 semana" (caso ansiedad)
  - Frecuencia recomendada: 1 vez por semana misma hora

[Tab: Adherencia]
  - Heatmap calendario (días registrados vs vacíos)
  - % comidas registradas / planeadas (semanal)
  - % entrenamientos completados
  - Racha actual de días registrados

[Tab: Fuerza]
  - Por ejercicio principal: gráfica de carga × volumen
  - Records personales (PR) celebrados
  - Comparativa primer vs último mes

[Tab: Bienestar]
  - Energía promedio por semana (line chart)
  - Ánimo promedio por semana (line chart)
  - Horas de sueño promedio
  - Correlaciones simples: "tu ánimo es mejor los días que entrenas"

[Sección: Logros]
  - Grid de logros desbloqueados (con fecha)
  - Logros próximos a desbloquear (progreso visible)
```

### Tarea 2 — Componentes de gráficas

Crear en `src/components/charts/`:

- `WeightChart.tsx` — line chart de peso con banda objetivo.
- `AdherenceHeatmap.tsx` — calendario tipo GitHub contributions.
- `MacrosBarChart.tsx` — barras horizontales de macros del día/semana.
- `StrengthProgressChart.tsx` — gráfica de progresión por ejercicio.
- `WellbeingLineChart.tsx` — energía/ánimo a lo largo del tiempo.
- `ComparisonCard.tsx` — comparativa "antes vs ahora" de cualquier métrica.

Todas usando Recharts, accesibles, con tooltip en español, y compatible con modo oscuro.

### Tarea 3 — Sistema de logros (achievements)

Seed inicial en `supabase/seed/achievements.sql`:

```sql
INSERT INTO achievements (code, name, description, icon, criteria) VALUES
('first_week', 'Primera semana', 'Completaste tu primera semana en PulseFit', '🌱', '{"days_active": 7}'),
('first_workout', 'Primer entrenamiento', 'Completaste tu primer entrenamiento', '💪', '{"workouts_completed": 1}'),
('streak_7', 'Una semana al hilo', 'Registraste 7 días seguidos', '🔥', '{"streak_days": 7}'),
('streak_30', 'Un mes constante', 'Registraste 30 días en total', '⭐', '{"streak_days": 30}'),
('first_pr', 'Primer record personal', 'Subiste carga en un ejercicio', '🏆', '{"first_pr": true}'),
('used_rescue', 'Te cuidaste', 'Usaste un rescate cuando lo necesitaste', '🌿', '{"rescues_used": 1}'),
('emergency_recovered', 'Volviste', 'Después de un día difícil, volviste', '🌅', '{"emergency_then_active": true}'),
('balanced_week', 'Semana balanceada', 'Cumpliste >80% adherencia 1 semana', '⚖️', '{"adherence_week": 80}'),
('three_months', 'Tres meses', 'Llevas 3 meses de viaje', '🌳', '{"days_active": 90}'),
('flexibility', 'Flexible', 'Usaste rescates 5 veces sin abandonar', '🌊', '{"rescues_with_continued_use": 5}'),
('mood_improver', 'Tu ánimo subió', 'Tu ánimo promedio mejoró vs primer mes', '☀️', '{"mood_improvement": true}'),
('protein_master', 'Cumplir proteína', 'Llegaste a tu meta de proteína 7 días', '🥚', '{"protein_target_days": 7}');
```

**Lógica clave:**
- `flexibility`: premia que usar rescates NO es debilidad.
- `emergency_recovered`: premia volver después de día malo.
- Sin logros tipo "perdiste X kg" para no reforzar obsesión con balanza.

### Tarea 4 — Motor de detección de logros

`src/features/achievement-engine/`:

```ts
export const checkAchievements = async (userId: string): Promise<ItfAchievement[]> => {
   // Consulta logs y compara contra criteria de achievements
   // Detecta cuáles se desbloquearon hoy (no estaban antes)
   // Inserta en user_achievements
   // Devuelve lista de nuevos logros para mostrar al usuario
}
```

Se invoca:
- Al cerrar el día (cron diario en Fase 10).
- Después de cada entrenamiento completado.
- Después de cada registro de comida que cumple meta de macro.

Mostrar logro nuevo con animación sutil + toast: `'¡Logro desbloqueado! 🌱 Tu primera semana'`.

### Tarea 5 — Detector de banderas rojas

`src/features/wellbeing-monitor/`:

```ts
export const detectRedFlags = async (userId: string): Promise<ItfRedFlag[]> => {
   // Aplica reglas de Lucía y Carlos:
   // - Pérdida >1%/sem sostenida 2 semanas → flag 'rapid_loss'
   // - Ingesta <50% GET por 3+ días → flag 'undereating'
   // - Atracón reportado 3+ semanas seguidas → flag 'binge_pattern'
   // - Ejercicio aumentado + ingesta reducida → flag 'compensatory_pattern'
   // - Pesarse 5+ veces/día → flag 'scale_obsession'
   // - Mood <2 por 5+ días seguidos → flag 'persistent_low_mood'
   
   // Cada flag tiene severity y action
}
```

**Acciones según severity:**

- `info`: mensaje compasivo en card del progreso.
- `warn`: pantalla con sugerencia de hablar con profesional.
- `escalation`: pantalla obligatoria con recursos profesionales (no se puede saltar).

**LENGUAJE OBLIGATORIO** en todos los mensajes de flag:

✅ "Notamos algo que vale la pena revisar con un profesional. ¿Te ayudamos a buscar uno cerca? 🌿"

❌ NUNCA: "Estás haciendo algo mal", "Tienes un trastorno", "Estás en peligro".

### Tarea 6 — Pantalla de "Tu yo hace 30 días"

`src/components/progress/TimeTravelComparison.tsx`:

Comparativa multidimensional:
- Peso: -1.2 kg.
- Energía promedio: 3.2 → 3.8/5.
- Adherencia: 60% → 78%.
- Ánimo promedio: 3.0 → 3.5/5.
- Sueño promedio: 6.5h → 7.2h.
- Mensaje generado: "Hace 30 días empezaste. Hoy duermes mejor, te sientes con más energía y ya no te cuesta tanto cumplir el plan. Eso es progreso real 🌱".

(En Fase 10 con IA este mensaje se hace dinámico y personalizado. Por ahora plantilla.)

### Tarea 7 — Recursos profesionales

Pantalla `src/pages/resources/ProfessionalResourcesPage.tsx`:

Lista compasiva de recursos:
- Búsqueda de nutricionistas certificados (link genérico, ej: directorio del colegio profesional del país).
- Búsqueda de psicólogos especializados en relación con la comida.
- Líneas de ayuda en salud mental (números 24/7 según país del usuario).
- Mensaje: "No estás solo en esto. Buscar ayuda es valentía, no debilidad 🌿".

Configuración por país: detectar por `profile.region` o IP, mostrar recursos locales.

**Disclaimer:** PulseFit no recomienda profesionales específicos. Solo ofrece directorios y recursos públicos.

### Tarea 8 — Botón "Ocultar peso 1 semana"

En tab Peso, botón discreto:
- Tap → confirma con dialog: "Esto oculta tu peso por 1 semana. Te ayudará a enfocarte en otros logros 🌿".
- Confirmar → setting en `profiles.preferences.hide_weight_until = date + 7d`.
- Durante esa semana, registros de peso son aceptados pero no visibles ni graficados.
- Al cumplir, se pregunta si quiere mostrar de nuevo.

### Tarea 9 — Notificaciones de logros

Cuando se desbloquea logro:
- Toast inmediato si la app está abierta.
- En home, badge en icono de progreso.
- Mensaje en formato cálido: "¡Has desbloqueado: {nombre}! 🌱 {descripción}".
- Logros importantes (3 meses, primera semana) muestran modal celebratorio breve.

### Tarea 10 — APIs y tipos

`src/api/fntProgress.ts`:
- `fntGetWeightHistory(period)`.
- `fntGetAdherenceData(period)`.
- `fntGetStrengthProgress(exerciseId, period)`.
- `fntGetWellbeingData(period)`.
- `fntGetUserAchievements()`.
- `fntCheckRedFlags()`.
- `fntToggleHideWeight(weeks)`.

### Tarea 11 — Tests

**Tests unitarios:**
- `achievement-engine`: cada criteria se cumple correctamente.
- `wellbeing-monitor`: cada flag se dispara con datos sintéticos correctos.
- Componentes de gráficas renderizan correctamente con datos vacíos / parciales / completos.

**Test E2E** (`tests/e2e/progress.spec.ts`):
- Usuario con datos de 30 días simulados navega a `/progreso`.
- Verifica que las 4 tabs cargan correctamente.
- Verifica que comparativa "30 días" muestra datos correctos.
- Verifica que logros desbloqueados aparecen.
- Simula bandera roja (`rapid_loss`) → verifica mensaje compasivo.

### Tarea 12 — Accesibilidad de gráficas

- Cada gráfica tiene `aria-label` descriptivo.
- Tooltips operables por teclado.
- Tabla de datos alternativa accesible (toggle "Ver datos como tabla").
- Contraste verificado en ambos modos.
- Daltonismo: usar formas además de colores para distinguir series.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Pantalla de progreso con 4 tabs funcionales.
- [ ] 12 logros del seed inicial implementados con criteria detectados correctamente.
- [ ] Gráficas renderizan en mobile sin problemas.
- [ ] Modo oscuro impecable en todas las gráficas.
- [ ] Comparativa "30 días" muestra múltiples métricas, no solo peso.
- [ ] Detector de banderas rojas funciona con casos sintéticos.
- [ ] Mensajes de banderas rojas pasan filtro compasivo.
- [ ] Botón "Ocultar peso" funciona.
- [ ] Pantalla de recursos profesionales accesible y respetuosa.
- [ ] Tests pasan.
- [ ] `MEMORY.md` actualizado.

---

## CHECKPOINT FINAL

```
✅ FASE 9 COMPLETADA — Progreso, gráficas y logros

[Resumen]

📄 Reporte: PHASE_9_REPORT.md

🔍 Antes de avanzar a Fase 10 verifica:
- Genera datos simulados de 30 días y revisa cada tab.
- Las gráficas en modo oscuro: ¿se ven bien?
- Los logros: ¿celebran sin sentirse infantiles?
- Botón "Ocultar peso 1 semana": ¿funciona y se siente respetuoso?
- Simula bandera roja `rapid_loss`: ¿el mensaje es compasivo?
- Pantalla de recursos profesionales: ¿se siente acogedora, no clínica?

¿Apruebas avanzar a Fase 10 (Revisión semanal con IA)?
```

**Espera respuesta explícita.**

---

**Empieza por la Tarea 1.**
