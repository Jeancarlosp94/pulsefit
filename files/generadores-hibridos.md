# 🤝 Generadores Híbridos — APIs + Reglas + IA + Validador

> Referencia técnica para los motores `src/features/meal-generator/` (Fase 5) y `src/features/routine-generator/` (Fase 6). **Lee este documento ANTES de escribir cualquier código de generación**: define filosofía, flujos exactos, prompts a Groq, validadores, fallbacks y métricas.

> Validado por todo el equipo (Lucía, Carlos, Diego, Roberto, Valentina). La estrategia híbrida es la única forma de combinar **creatividad** (que Roberto se enganche) con **seguridad** (que Lucía y Carlos puedan firmar el plan).

---

## 1. Filosofía del enfoque híbrido

PulseFit combina **cuatro capas** para producir cada plato y cada sesión de entrenamiento:

```
APIs externas (Open Food Facts + wger)
    ↓ filtran y aportan ingredientes/ejercicios validados
Motor determinístico (reglas de Carlos + fórmulas de Lucía)
    ↓ calcula macros, selecciona componentes, prescribe series/reps
IA generativa (Groq + Llama 3.3, free tier)
    ↓ SOLO combina creativamente: nombre, pasos de prep, orden, tips
Validador estricto
    ↓ rechaza outputs que modifiquen ingredientes, cantidades, series, reps
Fallback con plantillas
    ↓ si IA falla 2 veces, usa plantilla genérica
Usuario recibe 3 opciones para elegir
```

### Qué hace cada capa

| Capa | Responsabilidad | Tecnología |
|------|----------------|------------|
| **APIs externas** | Catálogo crudo de ingredientes y ejercicios reales | Open Food Facts, wger |
| **Motor determinístico** | Decidir QUÉ usar y EN QUÉ CANTIDAD | TS puro, fórmulas de Lucía + reglas de Carlos |
| **IA generativa** | Cómo COMBINAR y NARRAR creativamente | Groq + Llama 3.3 (free tier), solo desde Edge Functions |
| **Validador** | Rechazar outputs que rompan restricciones | TS puro, sin red |
| **Fallback** | Garantizar que la app NUNCA queda sin plan | Plantillas hardcoded |

### Lo que la IA SÍ hace
- Combina ingredientes pre-seleccionados en platos con **nombre creativo** y **pasos de preparación**.
- Ordena ejercicios pre-prescritos en la mejor secuencia y agrega **tips motivacionales** por ejercicio.
- Genera **3 opciones distintas** para que el usuario elija.

### Lo que la IA NUNCA hace
- Calcular calorías, macros, TMB, GET, déficit, superávit.
- Decidir qué ingredientes o ejercicios usar.
- Modificar cantidades prescritas.
- Modificar series, repeticiones, descansos o cargas.
- Diagnosticar al usuario o sugerir consultas médicas.
- Prescribir progresión.

### Regla de oro

> **Si la IA puede causar daño al usuario equivocándose, NO se usa IA.** Se usan reglas validadas por especialistas humanos.

---

## 2. Generador de comidas — flujo paso a paso

Las **7 etapas** del pipeline `meal-generator`. Cada una es función pura testeable salvo la 4 (que llama a Groq desde Edge Function).

### Etapa 1 — Calcular objetivo nutricional de la comida (motor)

```
Input:  perfil del usuario + meal_type ('breakfast' | 'lunch' | 'dinner' | 'snack_am' | 'snack_pm')
Output: { kcal, protein_g, carbs_g, fats_g } target para esa comida
Lógica:
   1. Leer profile.target_kcal y macros target del día.
   2. Distribuir según meal_type:
      - breakfast: 25%
      - lunch:     35%
      - dinner:    30%
      - snack_am/pm: 5% cada uno
   3. Devolver el target macroespecífico.
```

> Archivo: `src/features/meal-generator/nutritional-target.ts`. Usa fórmulas de [`formulas-nutricion.md`](formulas-nutricion.md).

### Etapa 2 — Consultar Open Food Facts y filtrar ingredientes

```
Input:  perfil + target macros + meal_type
Output: Pool de ~30 ingredientes válidos para componer la comida
Filtros:
   1. Excluir cualquier ingrediente en profile.dietary_restrictions
      (vegetarian, vegan, gluten_free, lactose_free, kosher, halal).
   2. Excluir profile.disliked_foods.
   3. Excluir profile.allergies.
   4. Priorizar ingredientes de profile.region (LATAM por default).
   5. Filtrar por budget_level (low → básicos: huevo, arroz, frijoles, plátano).
   6. Solo ingredientes con macros conocidos (kcal_per_100g != null).
   7. Si la app tiene foods_cache local, preferir cache para reducir llamadas.
```

> Archivo: `src/features/meal-generator/ingredient-pool.ts`.

### Etapa 3 — Seleccionar componentes que cuadren con macros (motor)

```
Input:  pool de ingredientes + target macros
Output: { proteína, carbo, grasa, verdura, condimentos[] } con cantidades en gramos
Lógica:
   1. Elegir 1 fuente de proteína primaria (~70% del proteína target).
   2. Elegir 1 fuente de carbo primaria (~80% del carbos target).
   3. Elegir 1 fuente de grasa (~70% del fats target).
   4. Elegir 1 verdura (libre, ~100-300 g).
   5. Agregar condimentos libres (sal, pimienta, ajo, limón, hierbas).
   6. Ajustar gramajes con regla de 3 hasta encajar ±5% en cada macro.
   7. Si en 5 intentos no encaja, devolver `null` → se usa fallback antes de invocar IA.
```

> Archivo: `src/features/meal-generator/component-selector.ts`. Función pura, 100% testeable.

### Etapa 4 — Llamar a IA con prompt restringido (Edge Function)

Solo desde la Edge Function `generate-meal-options`. El cliente nunca llama directamente a Groq.

```
Input:  componentes seleccionados con cantidades + restricciones del perfil + meal_type
Output: 3 opciones con { name, description, prep_time_min, difficulty, steps }
Prompt: ver sección 3 de este documento.
Modelo: llama-3.3-70b-versatile (Groq free tier).
Timeout: 8 segundos.
```

### Etapa 5 — Validar respuesta de IA

```
Input:  respuesta JSON de Groq + lista de ingredientes permitidos
Output: { valid: true, options: [...] } | { valid: false, reason: '...' }
Reglas: ver sección 4.
```

### Etapa 6 — Reintentar o caer a fallback

```
Si validación FALLA primer intento:
   → Reintentar UNA vez con prompt MÁS estricto (agregar "ATENCIÓN: en el intento anterior usaste X, NO lo uses").
Si segundo intento también FALLA:
   → Usar fallback templates (ver sección 8).
   → Loggear el evento en `pattern_insights` con tipo `ai_fallback_used`.
```

### Etapa 7 — Devolver opciones al usuario

Las 3 opciones llegan al cliente con macros calculados (los del motor, no los de la IA). El usuario elige una. Las otras 2 se descartan o se ofrecen como alternativas en el sistema de rescates.

---

## 3. Prompt exacto para Groq — comidas

Este es el prompt template que envía la Edge Function `generate-meal-options`. **Cualquier cambio aquí debe ser revisado por Lucía + Diego antes de desplegar.**

### System message

```
Eres un asistente culinario que compone platos usando EXCLUSIVAMENTE
los ingredientes y cantidades exactas que se te proporcionan.

REGLAS INVIOLABLES:
- NUNCA agregas ingredientes nuevos.
- NUNCA modificas cantidades.
- NUNCA calculas calorías ni macros (vienen impuestos).
- NUNCA das consejos médicos ni nutricionales.
- NUNCA usas tono punitivo ("debes", "tienes que", "fallaste").
- Devuelves SOLO JSON válido, sin texto adicional, sin markdown.
- Si las restricciones culturales o dietéticas chocan con un ingrediente,
  igual lo usas: ya fue validado por el motor antes de llegar a ti.

Tu única tarea es COMBINAR creativamente los ingredientes dados en
3 platos diferentes con nombre cálido (en español) y pasos claros.
```

### User message template

```
Genera 3 platos diferentes para {meal_type} usando SOLO estos ingredientes:

{ingredient_list}

Restricciones:
- Tiempo de preparación: máximo {max_prep_time} minutos
- Cocina cultural: {region_cuisine}
- Dificultad: {difficulty_default}
- Equipo de cocina disponible: {kitchen_equipment}

Devuelve JSON con esta estructura EXACTA:

{
  "options": [
    {
      "name": "nombre del plato (cálido, en español, sin emojis)",
      "description": "descripción breve, 1 oración, máximo 120 caracteres",
      "prep_time_min": número entero entre 5 y 60,
      "difficulty": "easy" | "medium" | "hard",
      "steps": ["paso 1", "paso 2", ...]
    },
    ...
  ]
}

Restricciones del JSON:
- "options" debe tener EXACTAMENTE 3 elementos.
- "steps" debe tener entre 2 y 10 elementos.
- Cada step entre 10 y 200 caracteres, en imperativo amable.
- Los 3 platos deben ser distintos entre sí en preparación.
```

### Ejemplo de input concreto

```
Genera 3 platos diferentes para lunch usando SOLO estos ingredientes:
- pollo: 150g
- arroz: 100g
- brócoli: 200g
- aceite de oliva: 5g
- ajo, sal, pimienta, limón, hierbas (libre uso)

Restricciones:
- Tiempo de preparación: máximo 25 minutos
- Cocina cultural: latinoamericana
- Dificultad: easy
- Equipo de cocina disponible: estufa, sartén, olla
```

### Ejemplo de output válido (few-shot incluido en el prompt)

```json
{
  "options": [
    {
      "name": "Bowl de pollo al limón con arroz y brócoli",
      "description": "Pollo jugoso al limón con arroz suelto y brócoli al ajillo, listo en 25 min.",
      "prep_time_min": 25,
      "difficulty": "easy",
      "steps": [
        "Pon a cocer el arroz con un poco de sal hasta que esté suelto.",
        "Corta el pollo en cubos y márinalo con limón, ajo, sal y pimienta 5 minutos.",
        "Saltea el pollo en sartén con el aceite de oliva, 6 a 8 minutos.",
        "En la misma sartén, añade el brócoli y un poco de ajo, saltea 4 minutos.",
        "Sirve el arroz como base, encima el pollo y el brócoli, decora con limón."
      ]
    },
    {
      "name": "Arroz salteado al ajillo con pollo y verduras",
      "description": "Estilo asiático rápido: arroz al wok con pollo dorado y brócoli crujiente.",
      "prep_time_min": 20,
      "difficulty": "easy",
      "steps": [
        "Cocina el arroz por separado y deja enfriar 5 minutos.",
        "Dora los cubos de pollo con ajo y aceite hasta sellar bien.",
        "Suma el brócoli y saltea 3 minutos manteniendo crujiente.",
        "Incorpora el arroz cocido, mezcla con sal, pimienta y unas gotas de limón.",
        "Sirve caliente, espolvorea hierbas frescas si tienes."
      ]
    },
    {
      "name": "Pollo a la plancha con arroz y brócoli al vapor",
      "description": "Versión simple y digestiva, ideal cuando quieres algo ligero.",
      "prep_time_min": 22,
      "difficulty": "easy",
      "steps": [
        "Sala y pimienta el pollo, déjalo reposar 5 minutos.",
        "Cocina el arroz con un toque de aceite y sal.",
        "Cocina el brócoli al vapor 4 minutos hasta que tome color brillante.",
        "Plancha el pollo en sartén con el aceite, 4 minutos por lado.",
        "Emplata el arroz, el pollo y el brócoli, riega con limón."
      ]
    }
  ]
}
```

### Errores que el modelo NO debe cometer (ejemplos para excluir explícitamente en el prompt)

| Error | Ejemplo |
|-------|---------|
| Agregar ingrediente nuevo | usar "queso parmesano" cuando no estaba en la lista |
| Modificar cantidad | "200g de pollo" cuando se prescribieron 150g |
| Calcular macros | incluir un campo "kcal" en el JSON |
| Agregar texto fuera del JSON | "Aquí están tus opciones: { ... }" |
| Usar tono punitivo | "para no fallar tu dieta…" |
| Diagnóstico | "ideal si tienes diabetes…" |
| Markdown | bloques ```json |

### Parámetros del modelo

```
model: llama-3.3-70b-versatile
temperature: 0.4    // suficiente para variedad sin alucinar
max_tokens: 1500
response_format: { type: 'json_object' }
```

---

## 4. Validador de comidas

El validador es **función pura, sin red**. Se ejecuta en la Edge Function justo después de recibir la respuesta de Groq.

### Implementación esperada

```ts
// src/features/meal-generator/plate-validator.ts
import type { ItfPlateOption, ItfValidation } from './types'

const FORBIDDEN_WORDS = [
   'fallaste', 'incorrecto', 'debes', 'tienes que', 'malo',
   'diagnóstico', 'enfermedad', 'cura', 'medicamento'
]

const FREE_USE = new Set([
   'sal', 'pimienta', 'ajo', 'limón', 'limon', 'agua',
   'hierbas', 'orégano', 'tomillo', 'cilantro', 'perejil', 'comino'
])

export const validateMealResponse = (
   raw: string,
   allowedIngredients: string[]
): ItfValidation => {
   // 1. Parsing JSON correcto
   let parsed: { options?: ItfPlateOption[] }
   try {
      parsed = JSON.parse(raw)
   } catch {
      return { valid: false, reason: 'invalid_json' }
   }

   // 2. Tiene exactamente 3 opciones
   const opts = parsed.options
   if (!Array.isArray(opts) || opts.length !== 3) {
      return { valid: false, reason: 'wrong_option_count' }
   }

   const allowed = allowedIngredients.map((s) => s.toLowerCase().trim())

   for (const [i, opt] of opts.entries()) {
      // 3. Cada opción tiene los campos requeridos
      if (!opt.name || !opt.description || !opt.prep_time_min || !opt.difficulty || !opt.steps) {
         return { valid: false, reason: `missing_fields_in_option_${i}` }
      }

      // 4. Solo menciona ingredientes permitidos (case-insensitive, fuzzy)
      const text = (opt.name + ' ' + opt.description + ' ' + opt.steps.join(' ')).toLowerCase()
      const tokens = text.split(/[\s,.;:()¡!¿?]+/).filter(Boolean)
      const unknown = tokens.find((t) =>
         t.length >= 4 &&
         !FREE_USE.has(t) &&
         allowed.every((a) => !a.includes(t) && !t.includes(a)) &&
         isLikelyFood(t)
      )
      if (unknown) {
         return { valid: false, reason: `unknown_ingredient:${unknown}` }
      }

      // 5. prep_time_min entre 5 y 60
      if (opt.prep_time_min < 5 || opt.prep_time_min > 60) {
         return { valid: false, reason: `prep_time_out_of_range_${i}` }
      }

      // 6. steps entre 2 y 10
      if (opt.steps.length < 2 || opt.steps.length > 10) {
         return { valid: false, reason: `steps_out_of_range_${i}` }
      }

      // 7. Cada step entre 10 y 200 chars
      const badStep = opt.steps.find((s) => s.length < 10 || s.length > 200)
      if (badStep) {
         return { valid: false, reason: `step_length_${i}` }
      }

      // 8. difficulty válida
      if (!['easy', 'medium', 'hard'].includes(opt.difficulty)) {
         return { valid: false, reason: `bad_difficulty_${i}` }
      }

      // 9. name no contiene palabras prohibidas
      const lowerName = opt.name.toLowerCase()
      if (FORBIDDEN_WORDS.some((w) => lowerName.includes(w) || text.includes(w))) {
         return { valid: false, reason: `forbidden_words_${i}` }
      }
   }

   return { valid: true, options: opts }
}
```

### Acción ante cada tipo de fallo

| Reason | Primer intento | Segundo intento | Acción |
|--------|----------------|-----------------|--------|
| `invalid_json` | Reintentar | Reintentar | Si falla 2x → fallback |
| `wrong_option_count` | Reintentar | Reintentar | 2x → fallback |
| `missing_fields_*` | Reintentar | Reintentar | 2x → fallback |
| `unknown_ingredient:X` | Reintentar con prompt extra: `"ATENCIÓN: en el intento anterior usaste X que NO está permitido"` | Fallback inmediato | — |
| `prep_time_out_of_range_*` | Reintentar | Fallback | — |
| `steps_out_of_range_*` | Reintentar | Fallback | — |
| `step_length_*` | Reintentar | Fallback | — |
| `bad_difficulty_*` | Reintentar | Fallback | — |
| `forbidden_words_*` | **Fallback inmediato** | — | Loggear `pattern_insights` con tipo `ai_safety_violation` |

> El reintento usa la respuesta cruda del primer intento como contexto para que el modelo entienda qué arreglar.

---

## 5. Generador de rutinas — flujo paso a paso

Las **7 etapas** del pipeline `routine-generator`, equivalentes en estructura al de comidas.

### Etapa 1 — Determinar objetivo del día (motor)

```
Input:  perfil + day_of_week + plan semanal vigente
Output: { focus, target_muscle_groups[], session_minutes, intensity_target_rpe }
Lógica:
   1. Leer workout_plans activo del usuario.
   2. Identificar workout_plan_items.day_of_week que matchee.
   3. Determinar focus (full_body, upper, lower, push, pull, legs).
   4. Calcular session_minutes según profile.available_minutes.
   5. Definir RPE objetivo según semana del bloque
      (1-3 RPE 6-7, 4 RPE 5 — descarga forzada cada 5 sem para principiantes).
```

> Archivo: `src/features/routine-generator/session-planner.ts`. Usa reglas de [`reglas-fitness.md`](reglas-fitness.md).

### Etapa 2 — Consultar wger y filtrar ejercicios

```
Input:  focus + target_muscle_groups + perfil
Output: Pool de ~20 ejercicios candidatos
Filtros (de reglas-fitness.md):
   1. Excluir cualquiera en profile.injured_zones.
   2. Excluir prohibidos para principiantes absolutos
      (peso muerto convencional, sentadilla trasera con barra, press banca con barra, etc.).
   3. Filtrar por equipment disponible (matchea al menos 1).
   4. Matchear difficulty con profile.fitness_level.
   5. Si la app tiene exercises_catalog local, preferir cache.
```

> Archivo: `src/features/routine-generator/exercise-pool.ts`.

### Etapa 3 — Seleccionar ejercicios y prescribir series/reps (motor)

```
Input:  pool de ejercicios + objetivo del día + plantilla por tiempo (15/30/45/60 min)
Output: Array<{ exercise_id, name, sets, reps, rest_sec, prescribed_rpe }>
Lógica (reglas de Carlos):
   1. Aplicar plantilla por tiempo disponible.
   2. Compuestos primero, accesorios después.
   3. Alternar grupos musculares en ejercicios consecutivos.
   4. Aplicar reglas de progresión semanal sobre la última carga registrada.
   5. Asignar tiempos de descanso por rango de reps.
   6. NO incluir más de UNA variable subida vs semana anterior.
   7. Insertar slot de calentamiento (5 min) y cool-down (5 min).
```

> Archivos: `exercise-selector.ts` + `set-rep-calculator.ts`. Funciones puras.

### Etapa 4 — Llamar a IA para organizar y agregar tips (Edge Function)

Solo desde `generate-workout-session`. Prompt en sección 6.

### Etapa 5 — Validar respuesta de IA

Reglas en sección 7.

### Etapa 6 — Reintentar o fallback

Mismo patrón que comidas: 1 reintento con prompt más estricto, luego fallback template.

### Etapa 7 — Devolver sesión al usuario

La sesión llega al cliente con todos los ejercicios prescritos por el motor (la IA solo aportó orden + tips). El cliente la persiste como `workout_logs` cuando el usuario la completa.

---

## 6. Prompt exacto para Groq — rutinas

### System message

```
Eres un asistente de coaching fitness que organiza sesiones de entrenamiento
usando EXCLUSIVAMENTE los ejercicios y prescripciones que se te proporcionan.

REGLAS INVIOLABLES:
- NUNCA agregas ejercicios nuevos.
- NUNCA quitas ejercicios de la lista.
- NUNCA modificas series, repeticiones, descansos o cargas.
- NUNCA calculas progresión.
- NUNCA das consejos médicos.
- NUNCA usas tono punitivo ni motivacional vacío ("¡vamos!", "¡tú puedes!").
- Devuelves SOLO JSON válido, sin texto adicional, sin markdown.

Tu única tarea es ORGANIZAR el orden de los ejercicios siguiendo
estas pautas y agregar UN tip motivacional contextual breve por ejercicio:

REGLAS DE ORDEN:
1. Calentamiento siempre primero.
2. Compuestos antes que accesorios.
3. Alternar grupos musculares en ejercicios consecutivos cuando sea posible.
4. Cool-down siempre al final.

REGLAS DE TIPS:
- Tono cálido, en español, máximo 120 caracteres.
- Enfocado en forma, foco mental, respiración o sensación.
- NUNCA consejo médico ni diagnóstico.
- NUNCA "te ayuda a tonificar" ni promesas estéticas.
```

### User message template

```
Organiza esta sesión de entrenamiento. Devuelve los MISMOS ejercicios
en el mejor orden, con calentamiento al inicio y cool-down al final,
y agrega un tip por ejercicio.

Ejercicios a organizar (NO modificar series/reps/descansos):

{exercises_json}

Tiempo total disponible: {session_minutes} minutos.
Foco de la sesión: {focus}.
Nivel del usuario: {fitness_level}.

Devuelve JSON con esta estructura EXACTA:

{
  "warmup": {
     "duration_min": número,
     "movements": ["movimiento 1", "movimiento 2", ...]
  },
  "blocks": [
     {
        "exercise_id": "id literal del input",
        "name": "nombre literal del input",
        "sets": número (literal del input),
        "reps": "literal del input",
        "rest_sec": número (literal del input),
        "tip": "tip motivacional breve, máximo 120 chars"
     },
     ...
  ],
  "cooldown": {
     "duration_min": número,
     "movements": ["estiramiento 1", "estiramiento 2", ...]
  },
  "estimated_total_min": número entero
}

El número de elementos en "blocks" debe ser EXACTAMENTE el mismo
que en el input. Los ids, nombres, sets, reps, rest_sec deben ser
LITERALMENTE los del input.
```

### Ejemplo de output válido (few-shot)

```json
{
  "warmup": {
     "duration_min": 5,
     "movements": [
        "Rotación de hombros 30 segundos",
        "Círculos de cadera 30 segundos",
        "Gato-vaca x 8 reps",
        "Marcha en el lugar 1 minuto"
     ]
  },
  "blocks": [
     {
        "exercise_id": "ex_001",
        "name": "Goblet squat",
        "sets": 3,
        "reps": "10",
        "rest_sec": 90,
        "tip": "Pecho arriba, peso en los talones, respira al subir."
     },
     {
        "exercise_id": "ex_017",
        "name": "Remo con mancuerna a una mano",
        "sets": 3,
        "reps": "10 por lado",
        "rest_sec": 90,
        "tip": "Codo cerca del cuerpo, escapula al final del rango."
     },
     {
        "exercise_id": "ex_022",
        "name": "Press de hombros sentado con mancuernas",
        "sets": 3,
        "reps": "10",
        "rest_sec": 90,
        "tip": "Apoya bien la espalda, sube en línea recta sin trabar."
     },
     {
        "exercise_id": "ex_044",
        "name": "Plancha",
        "sets": 3,
        "reps": "30 segundos",
        "rest_sec": 60,
        "tip": "Cuerpo en línea, glúteos firmes, respiración tranquila."
     }
  ],
  "cooldown": {
     "duration_min": 5,
     "movements": [
        "Estiramiento de cuádriceps 30s/lado",
        "Estiramiento de pectoral en marco 30s/lado",
        "Postura del niño 1 minuto",
        "Respiración diafragmática 1 minuto"
     ]
  },
  "estimated_total_min": 30
}
```

### Parámetros del modelo

```
model: llama-3.3-70b-versatile
temperature: 0.3    // baja: organización es menos creativa que recetas
max_tokens: 2000
response_format: { type: 'json_object' }
```

---

## 7. Validador de rutinas

Reglas que verifica `routine-validator.ts` sobre la respuesta de IA:

### Implementación esperada

```ts
// src/features/routine-generator/routine-validator.ts
export const validateRoutineResponse = (
   raw: string,
   prescribedExercises: ItfPrescribedExercise[]
): ItfValidation => {
   // 1. JSON parseable.
   // 2. Tiene warmup, blocks, cooldown, estimated_total_min.
   // 3. blocks.length === prescribedExercises.length.
   // 4. Cada block coincide LITERALMENTE con un prescribedExercise por id, name, sets, reps, rest_sec.
   // 5. Cada block tiene tip de 10-120 chars.
   // 6. warmup.duration_min entre 3 y 15.
   // 7. cooldown.duration_min entre 3 y 15.
   // 8. estimated_total_min coherente: ±20% del session_minutes solicitado.
   // 9. Tips no contienen palabras prohibidas (mismo set que comidas + extras de fitness):
   //    'tonificar', 'quemar grasa rápido', 'transformación', 'antes y después'.
   // 10. Tips no contienen consejos médicos: 'cura', 'previene', 'recupera lesión', 'reemplaza'.
}
```

### Acciones ante cada fallo

| Reason | Primer intento | Segundo intento |
|--------|----------------|-----------------|
| `invalid_json` | Reintentar | Fallback |
| `block_count_mismatch` | Reintentar con: `"ATENCIÓN: debes incluir EXACTAMENTE los N ejercicios del input"` | Fallback |
| `exercise_modified:<id>` | Reintentar con: `"ATENCIÓN: NO modificaste correctamente el ejercicio <id>"` | Fallback |
| `tip_too_long_*` | Reintentar | Fallback |
| `forbidden_words_in_tip_*` | **Fallback inmediato** + `pattern_insights` |
| `medical_advice_in_tip_*` | **Fallback inmediato** + `pattern_insights` |

---

## 8. Sistema de fallback

Cuando la IA falla 2 veces, se usa una plantilla determinística. La app **nunca** queda sin plan.

### Para comidas — `meal-generator/fallback-templates.ts`

```ts
export const buildMealFallback = (
   components: ItfMealComponents,
   mealType: ItfMealType
): ItfPlateOption[] => {
   const { protein, carb, fat, vegetable } = components

   const formats: Array<(c: ItfMealComponents) => ItfPlateOption> = [
      // Plantilla 1: Bowl genérico
      (c) => ({
         name: `Bowl de ${c.protein.name} con ${c.carb.name} y ${c.vegetable.name}`,
         description: `Plato simple, balanceado y rápido de preparar.`,
         prep_time_min: 20,
         difficulty: 'easy',
         steps: [
            `Cocina ${c.carb.name_grams} hasta su punto.`,
            `Cocina ${c.protein.name_grams} a la plancha con sal y pimienta.`,
            `Saltea ${c.vegetable.name_grams} con un poco de ${c.fat.name}.`,
            `Sirve todo junto en un bowl, decora con limón o hierbas.`
         ]
      }),
      // Plantilla 2: Plato dividido
      (c) => ({
         name: `${c.protein.name} con ${c.carb.name} y ${c.vegetable.name} al ajillo`,
         description: `Versión clásica, ideal cuando quieres algo familiar.`,
         prep_time_min: 25,
         difficulty: 'easy',
         steps: [...] // similar
      }),
      // Plantilla 3: Wok / salteado
      (c) => ({
         name: `Salteado de ${c.protein.name} con ${c.carb.name} y verduras`,
         description: `Estilo wok rápido, todo en una sartén.`,
         prep_time_min: 15,
         difficulty: 'easy',
         steps: [...]
      })
   ]

   return formats.map((fn) => fn(components))
}
```

**Características:**
- 3 plantillas distintas predefinidas.
- Pasos genéricos pero coherentes y compasivos.
- Sin promesas estéticas ni consejos médicos.
- Funciona con cualquier combinación de componentes (no falla nunca).

### Para rutinas — `routine-generator/fallback-templates.ts`

```ts
export const buildRoutineFallback = (
   prescribed: ItfPrescribedExercise[],
   sessionMinutes: number
): ItfOrganizedSession => {
   // Orden simple:
   //   1. Compuestos por orden alfabético
   //   2. Accesorios por orden alfabético
   //   3. Core al final
   //   4. Tips genéricos por patrón muscular (mapa hardcoded)

   return {
      warmup: defaultWarmup(),       // 5 min, movimientos generales
      blocks: orderByCategory(prescribed).map(addGenericTip),
      cooldown: defaultCooldown(),   // 5 min, estiramientos generales
      estimated_total_min: sessionMinutes
   }
}

const GENERIC_TIPS_BY_PATTERN: Record<string, string> = {
   squat: 'Pecho arriba, peso en los talones, respiración tranquila.',
   hinge: 'Bisagra desde la cadera, espalda neutra, escapulas firmes.',
   push_horizontal: 'Codos a 45°, baja con control, sube exhalando.',
   push_vertical: 'Mira al frente, sube en línea recta sin trabar codos.',
   pull: 'Codo cerca del cuerpo, escapula al final del rango.',
   core: 'Cuerpo firme, respiración tranquila, calidad sobre cantidad.',
   default: 'Forma sobre velocidad, respira y siente cada repetición.'
}
```

**Garantía:** la función NO depende de red ni de IA. Siempre devuelve algo válido.

### Logging del uso de fallback

Cada vez que se usa fallback, registrar evento en `pattern_insights`:

```sql
INSERT INTO pattern_insights (user_id, pattern_type, description, data)
VALUES (
   $1,
   'ai_fallback_used',
   'Generador cayó a fallback tras 2 intentos fallidos',
   jsonb_build_object(
      'generator', 'meal' | 'workout',
      'reason', '<reason del validador>',
      'meal_type' / 'session_focus', '...'
   )
)
```

Esto permite monitorear la tasa de fallbacks y ajustar el prompt si supera el 5%.

---

## 9. Caché y optimización de costos

Estrategias para mantenerse en el **free tier de Groq** (14,400 requests/día con Llama 3.3).

### 1. Caché de comidas en `meal_plan_items`

- Cuando el usuario **acepta** una comida, queda persistida.
- En la revisión semanal, **solo regenerar** comidas que el usuario rechazó explícitamente o que el motor decidió cambiar por adaptación de patrón.
- Las comidas aceptadas se rotan en el plan siguiente sin volver a llamar a la IA.

### 2. Pool compartido entre usuarios similares

```sql
-- Tabla auxiliar para Fase 5+
CREATE TABLE shared_meal_templates (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   profile_signature TEXT NOT NULL,
   -- ej: 'lat_male_25-35_intermediate_omnivore_medium_budget'
   meal_type TEXT NOT NULL,
   plate_option JSONB NOT NULL,
   times_served INT DEFAULT 0,
   avg_user_rating DECIMAL(3,1),
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_shared_meal_signature ON shared_meal_templates(profile_signature, meal_type);
```

**Cómo se usa:**
- Antes de llamar a la IA, calcular `profile_signature` (hash determinístico de campos relevantes).
- Si hay 5+ templates con esa signature y rating > 4/5, **70% de las veces** servir uno aleatorio del pool en vez de generar.
- Eso reduce drásticamente las llamadas a Groq cuando hay base instalada.

### 3. Rate limiting por usuario

```
Máximo 30 generaciones de comida / día / usuario
Máximo 10 generaciones de rutina / día / usuario
```

Implementado en la Edge Function:

```ts
const today = new Date().toISOString().slice(0, 10)
const { count } = await supabase
   .from('pattern_insights')
   .select('id', { count: 'exact', head: true })
   .eq('user_id', user.id)
   .eq('pattern_type', 'meal_generated')
   .gte('detected_at', `${today}T00:00:00Z`)

if ((count ?? 0) >= 30) {
   return jsonRes({
      msg: 'Hoy ya generaste muchas opciones, descansemos un poco 🌿. Mañana seguimos.',
      data: null
   }, 429)
}
```

### 4. Reutilización del primer prompt

Si el usuario pide "otra opción" sobre la misma comida, NO regenerar desde cero: pedir a la IA solo 1 alternativa más con seed distinta. Reduce tokens.

### 5. Cache HTTP a nivel de Edge Function

Si dos usuarios con misma signature piden el mismo `meal_type` en la misma hora, devolver respuesta cacheada (Deno KV con TTL 1 hora).

---

## 10. Edge Functions involucradas

### `supabase/functions/generate-meal-options/index.ts`

```
Input (POST body):
   {
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack_am' | 'snack_pm',
      day_of_week?: number,
      override_target?: { kcal, protein_g, carbs_g, fats_g }
   }

Flujo:
   1. Validar Authorization header → supabase.auth.getUser().
   2. Cargar profile.
   3. Verificar rate limit del día.
   4. Etapa 1 — calcular target nutricional.
   5. Etapa 2 — pool de ingredientes (Open Food Facts + foods_cache).
   6. Etapa 3 — selector determinístico → componentes.
   7. Etapa 4 — llamar a Groq con prompt restringido.
   8. Etapa 5 — validar.
   9. Si falla, reintentar 1 vez con prompt más estricto.
   10. Si vuelve a fallar, usar fallback.
   11. Loggear pattern_insight si se usó fallback.
   12. Devolver { msg: 'OK', data: { options: [...3], components, target } }.

Errores:
   401 — sin auth
   404 — profile no encontrado
   429 — rate limit
   500 — error genérico (con mensaje compasivo)
```

### `supabase/functions/generate-workout-session/index.ts`

```
Input:
   {
      day_of_week: number,
      override_focus?: 'full_body' | 'upper' | 'lower' | 'push' | 'pull' | 'legs'
   }

Flujo equivalente al de comidas, pero con:
   - exercise-pool en lugar de ingredient-pool.
   - exercise-selector + set-rep-calculator en lugar de component-selector.
   - ai-routine-organizer en lugar de ai-plate-composer.
   - routine-validator en lugar de plate-validator.

Devuelve:
   {
      msg: 'OK',
      data: {
         session: { warmup, blocks, cooldown, estimated_total_min },
         prescribed: [...] // ejercicios con sus series/reps tal como se enviaron a la IA
      }
   }
```

### Variables de entorno requeridas

```
GROQ_API_KEY=<key del free tier>
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_TEMPERATURE_MEAL=0.4
GROQ_TEMPERATURE_ROUTINE=0.3
GROQ_TIMEOUT_MS=8000
```

Configurar con `npx supabase secrets set` antes del deploy.

---

## 11. Tests obligatorios

Antes de cerrar Fase 5 y Fase 6 deben existir estos tests:

### `meal-generator`

- [ ] **Filtrado de ingredientes**: dado un perfil con `dietary_restrictions: ['vegan']`, el pool nunca incluye carne, lácteos, huevo.
- [ ] **Cálculo de target**: dado profile con target_kcal=2000 y meal_type=lunch, el target devuelto es 700 kcal con macros proporcionales.
- [ ] **Component-selector encaja ±5%**: dado un pool y un target, el selector devuelve cantidades con error <5% en cada macro.
- [ ] **Validador OK**: dado un JSON válido de IA, devuelve `valid: true`.
- [ ] **Validador detecta ingrediente no permitido**: si la IA mete `queso` y no estaba en el pool, devuelve `valid: false, reason: 'unknown_ingredient:queso'`.
- [ ] **Validador detecta palabras prohibidas**: si un step contiene "fallaste", devuelve `valid: false, reason: 'forbidden_words_*'`.
- [ ] **Fallback nunca falla**: dado cualquier set de componentes, `buildMealFallback` devuelve 3 opciones válidas.
- [ ] **Edge function reintenta 1 vez**: mock de Groq que falla la 1ª y acierta la 2ª → usuario recibe opciones de IA, NO fallback.
- [ ] **Edge function cae a fallback tras 2 fallos**: mock de Groq que falla 2 veces → usuario recibe fallback, se loggea `pattern_insight`.

### `routine-generator`

- [ ] **Exercise-pool excluye lesiones**: dado profile con `injured_zones: ['lumbar']`, no aparece peso muerto.
- [ ] **Exercise-pool excluye prohibidos para principiantes absolutos**.
- [ ] **Set-rep-calculator aplica progresión**: si la última semana fue RPE 6 con adherencia 100%, esta semana sube +1 rep o +5% peso (UNA sola variable).
- [ ] **Validador OK** con JSON correcto.
- [ ] **Validador detecta block count mismatch**: si la IA quita un ejercicio, devuelve `valid: false`.
- [ ] **Validador detecta ejercicio modificado**: si la IA cambia sets de 3 a 4, devuelve `valid: false`.
- [ ] **Validador detecta tips médicos**: si un tip dice "previene lesiones", devuelve `valid: false`.
- [ ] **Fallback orden alfabético** funciona con cualquier prescripción.

### Test E2E

- [ ] **Flujo completo onboarding → plan**: usuario completa los 7 pasos, dispara `generate-meal-options` 5 veces (5 comidas día 1) y `generate-workout-session` 1 vez. Las 7 respuestas validan. Tiempo total < 10 segundos.
- [ ] **Stress test de fallback**: con `GROQ_API_KEY` inválida, el flujo entrega plan completo igual (todo via fallback). UI no muestra error al usuario.

---

## 12. Métricas de monitoreo

Tracker estos KPIs en producción (PostHog + tabla `pattern_insights`):

| Métrica | Objetivo | Alerta si |
|---------|----------|-----------|
| % respuestas IA que pasan validación al primer intento | > 85% | < 75% durante 24h |
| % de fallbacks usados | < 5% | > 10% durante 24h |
| Tiempo promedio de generación de plan completo | < 8 segundos | > 12 s p95 |
| Costo Groq mensual | $0 (free tier) | Si nos pasamos del free tier |
| Tasa de aceptación de la primera opción mostrada | > 60% | < 40% (señal de prompt deficiente) |
| `ai_safety_violation` por mes | 0 | > 0 → revisar prompt urgente |

### Dashboards sugeridos

- **Generadores**: tasa de fallback, tasa de validación al primer intento, tiempos p50/p95.
- **Calidad de la IA**: distribución de razones de invalidación, top razones por semana.
- **Salud económica**: tokens consumidos / día, comparado contra el límite free tier.

---

## Resumen ejecutivo

| Aspecto | Decisión |
|---------|----------|
| **Quién decide qué comer/entrenar** | Motor determinístico (fórmulas Lucía + reglas Carlos) |
| **Quién narra creativamente** | IA generativa Groq + Llama 3.3 |
| **Quién protege al usuario** | Validador estricto + fallback templates |
| **Costo** | $0 (free tier Groq, suficiente para ~1000 usuarios activos) |
| **Latencia** | < 8 segundos por generación |
| **Riesgo de alucinación dañina** | Mitigado con validación + ingredientes/ejercicios pre-seleccionados |
| **¿Pueden firmar Lucía y Carlos?** | Sí: la IA no toca nada técnico, solo combina lo que ellos validaron |

🌱
