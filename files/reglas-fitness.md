# 💪 Reglas de Fitness — Validadas por Carlos (Coach NSCA-CPT, 10 años con principiantes)

> Referencia técnica para el motor `src/features/workout-engine/`. Lee este archivo cuando vayas a implementar o modificar generación de rutinas, progresión, selección de ejercicios o reglas de descanso.

---

## Clasificación inicial del usuario

Determinar `fitness_level` al inicio:

```
absolute_beginner: 0-3 meses entrenando
beginner:          3-12 meses
intermediate:      1-3 años
advanced:          3+ años
```

**El usuario auto-reporta** en onboarding. Si reporta "nunca he entrenado" o no responde, asumir `absolute_beginner`.

---

## Frecuencia inicial recomendada

```
absolute_beginner: 2-3 días/sem, full body
beginner:          3-4 días/sem, full body o upper/lower
intermediate:      4-5 días/sem, split
advanced:          5-6 días/sem, split o push/pull/legs
```

**Nunca asignar más días de los que el usuario reportó disponibles** en `available_days`.

---

## Ejercicios base para principiantes (semanas 1-8)

Solo estos patrones. Cero aislamiento.

| Patrón | Ejercicio recomendado | Variantes según equipamiento |
|--------|----------------------|-------------------------------|
| Sentadilla | Sentadilla con peso corporal | Goblet squat (mancuerna), sentadilla con banda |
| Bisagra de cadera | Peso muerto rumano con mancuernas | Hip hinge con banda, glute bridge |
| Empuje horizontal | Flexiones (variantes) | Press con mancuernas en suelo |
| Empuje vertical | Press de hombros sentado con mancuernas | Press con banda |
| Jalón | Remo con mancuerna a una mano | Remo con banda, dominadas asistidas |
| Core | Plancha, dead bug, bird-dog | (mismas) |

**Movilidad obligatoria** al inicio (5-10 min): rotación de hombros, círculos de cadera, gato-vaca, world's greatest stretch.

---

## ❌ PROHIBIDO para principiantes absolutos

NO incluir en rutinas las primeras 8 semanas:

- Peso muerto convencional con barra
- Sentadilla trasera con barra
- Press de banca con barra
- Cargadas, arranques, pliométricos
- HIIT más de 1x/semana
- Cualquier ejercicio de aislamiento (curl bíceps, extensión tríceps, elevaciones laterales aisladas)
- Cardio de alta intensidad sostenido más de 20 min
- Ejercicios que requieran corrección de forma compleja sin supervisión

---

## RPE — Rate of Perceived Exertion (1-10)

**RPE es el dato más importante del sistema de progresión.** Se pregunta al final de cada ejercicio.

```
1-3: Muy fácil (calentamiento)
4-5: Fácil
6-7: Moderado (sweet spot para principiantes)
8: Duro
9: Muy duro
10: Máximo absoluto
```

**Pregunta en la app** (con caritas, no solo número): "¿Qué tan duro fue?"

---

## Reglas de progresión semanal

Al terminar cada semana, el motor evalúa adherencia y RPE para decidir progresión:

| Condición | Acción |
|-----------|--------|
| Adherencia > 80% Y RPE promedio < 7 | **Progresar:** subir UNO de los siguientes (no varios): +5% peso, o +1 rep, o +1 serie |
| Adherencia > 80% Y RPE 7-8.5 | **Mantener** carga, agregar variación de ejercicio (rotar accesorio similar) |
| Adherencia 50-80% Y RPE cualquiera | **Mantener** sin progresar. Mensaje motivacional |
| Adherencia < 50% O RPE > 8.5 sostenido | **Reducir:** -20% volumen, simplificar rutina, considerar descarga |
| Reportó dolor zona específica 2+ veces | **Sustituir** ejercicios que afecten esa zona. Activar bandera "consulta especialista" si persiste |

**Regla maestra:** subir solo UNA variable por semana. Nunca subir peso + reps + series a la vez. La progresión gradual evita lesiones y agotamiento.

---

## Descansos obligatorios

```
Mínimo 1 día completo de descanso entre sesiones de fuerza
  (para principiantes y absolutos)

Mínimo 48h sobre el mismo grupo muscular
  (para todos los niveles)

Cada 4-6 semanas: SEMANA DE DESCARGA
  -30% volumen total
  -20% peso o intensidad
  Mantener mismos patrones, menos exigentes
```

El motor debe **forzar** la descarga cada 5 semanas automáticamente para principiantes (no opcional).

---

## Tiempos de descanso entre series

```
Fuerza máxima (1-5 reps):       2-5 min
Hipertrofia (6-12 reps):        60-90 seg
Resistencia muscular (12+ reps): 30-60 seg
Principiantes (cualquiera):      90 seg como default seguro
```

La app implementa **timer automático de descanso** después de cada serie.

---

## Variables que el motor debe trackear

Por sesión:
- Adherencia (¿completó la sesión?)
- RPE promedio (de los ejercicios reportados)
- Duración real vs estimada
- Dolor reportado por zona (lista de zonas)
- Energía pre y post (1-5)
- Notas del usuario

Por semana:
- % adherencia (sesiones completadas / planeadas)
- RPE promedio semanal
- Cambio en cargas (progresión real)
- Frecuencia de "rescates" usados
- Patrones de día con menor adherencia

---

## Sistema de selección de ejercicios

Filtros del motor `exercise-selector.ts`:

```ts
const filters = {
   difficulty: profile.fitness_level,           // matchea exactamente
   equipment: includes(profile.equipment),      // tiene al menos uno
   muscle_groups: targetGroups,                 // según día del split
   excluded_zones: profile.injured_zones,       // excluye dolor
   excluded_for_beginners: fitness_level === 'absolute_beginner'
}
```

**Reglas:**
1. Si `fitness_level === 'absolute_beginner'`: filtrar SOLO ejercicios de la lista permitida (los 6 patrones base + movilidad).
2. Si reporta dolor en zona X: excluir todos los ejercicios cuyos `muscle_groups` o `affected_zones` incluyan X.
3. Variar ejercicios entre semanas (el mismo patrón pero diferente ejecución) para evitar aburrimiento, **pero mantener al menos 1 ejercicio igual** para poder medir progresión.

---

## Plantillas de rutina por tiempo disponible

### 15 minutos (sesión express)
- 1 ejercicio compuesto principal: 3 series × 8-10 reps.
- 1 ejercicio compuesto secundario: 2 series × 10-12 reps.
- 1 core: 2 series × 30-45 seg.

### 30 minutos
- 5 min calentamiento.
- 3 ejercicios compuestos: 3 series × 8-12 reps cada uno.
- 1 core o accesorio: 2 series.
- 5 min cool-down.

### 45 minutos
- 5 min calentamiento.
- 4 ejercicios compuestos: 3 series × 8-12 reps.
- 2 ejercicios accesorios: 3 series × 12-15 reps.
- Core: 3 series.
- 5 min cool-down.

### 60+ minutos
- 5-10 min calentamiento + movilidad.
- 5-6 ejercicios.
- Trabajo de debilidades específicas.
- Cool-down + estiramientos.

**El motor escoge la plantilla según `available_minutes` del perfil.**

---

## Días sin entrenar planeado

En días de descanso, el motor sugiere actividad ligera opcional (no obligatoria):

- Caminata 20-30 min.
- Estiramientos 10 min.
- Yoga suave 15 min.
- Movilidad articular 10 min.

**Importante:** marcar como **opcional** y sin presión. Roberto explícitamente dijo que apreciar el descanso es parte de la app.

---

## Casos especiales

### Lesión leve reportada
1. Identificar zona afectada.
2. Sustituir todos los ejercicios que la involucren por alternativas.
3. Si dolor persiste 2+ semanas, mostrar pantalla "Recomendamos consulta con fisioterapeuta" + recursos.
4. Nunca diagnosticar ni "asegurar" recuperación. Solo adaptar.

### Mujer embarazada / postparto
- Activar disclaimer obligatorio.
- Limitar a ejercicios de peso corporal y bandas.
- Excluir core que involucre flexión profunda en embarazo.
- Recomendar fuertemente supervisión médica.

### Adulto mayor (60+)
- Default a `absolute_beginner` independiente de experiencia previa.
- Priorizar movilidad, equilibrio, fuerza con peso corporal.
- Más tiempo de calentamiento.
- Descansos más largos entre series (90-120 seg default).

### Condiciones médicas reportadas
Si en `medical_conditions` aparece: diabetes, hipertensión, problema cardíaco, articular, columna:
- Disclaimer obligatorio en cada plan generado.
- Sugerir consulta médica antes de empezar.
- Limitar intensidad inicial (no superar RPE 7 las primeras 4 semanas).

---

## Mensajes contextuales por sesión

El motor `ai-messages` genera mensajes según contexto. Lenguaje compasivo siempre.

| Contexto | Mensaje ejemplo |
|----------|----------------|
| Inicio de semana 1 | "Empezamos suave. Lo importante hoy es moverte 🌱" |
| RPE alto reportado | "Esa fue intensa. Mañana descanso 💪" |
| 3 sesiones seguidas completadas | "Llevas 3 al hilo, tu cuerpo lo está agradeciendo 🙌" |
| Sesión saltada | "Sin culpa. Mañana retomamos al ritmo que puedas 🌿" |
| Semana de descarga | "Esta semana bajamos un poco. Es parte del plan, no debilidad 🌊" |
| Progresión efectiva | "Subiste carga sin que el RPE se disparara. Eso es progreso real 🌟" |

**Regla:** nunca mensajes genéricos tipo "¡Vamos!" o "¡Tú puedes!". Siempre contextual al dato real del usuario.

---

## Integración con generador híbrido

Las reglas de progresión, selección de ejercicios, series, reps y descansos de este documento son la **PRIMERA CAPA** del motor `routine-generator`. La IA solo organiza el orden y agrega tips motivacionales sobre ejercicios YA seleccionados con series y reps YA prescritas.

Si la IA modifica cualquier ejercicio, serie, rep o descanso, el validador rechaza la respuesta. Las reglas de este archivo son la **fuente única de verdad biomecánica** — selección por nivel, ejercicios prohibidos para principiantes, RPE objetivo, descansos entre series, descarga forzada cada 5 semanas, sustitución por lesión.

Flujo resumido:

```
1. Motor determina el objetivo del día (focus + tiempo + RPE objetivo).
2. Motor filtra ejercicios válidos por nivel, equipamiento, lesiones (este archivo).
3. Motor prescribe series, reps y descansos exactos según plantilla por tiempo.
4. IA recibe la lista cerrada de ejercicios prescritos y solo:
   - Decide el orden óptimo (calentamiento, compuestos, accesorios, core, cool-down).
   - Agrega 1 tip motivacional breve por ejercicio sobre forma/respiración.
5. Validador rechaza cualquier respuesta que añada/quite ejercicios, modifique
   series/reps/descansos, o meta consejos médicos en los tips.
6. Si IA falla 2 veces → fallback determinístico (orden alfabético + tips genéricos
   por patrón muscular).
```

Ver `generadores-hibridos.md` para el flujo completo, prompts exactos y reglas del validador.
