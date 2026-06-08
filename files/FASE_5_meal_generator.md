# 📋 Prompt Fase 5 — Motor de plan de comidas con generador híbrido

> Pega este prompt a Claude Code después de haber completado Fase 4 y haberla validado tú mismo.

---

## INSTRUCCIÓN PARA CLAUDE CODE

Antes de empezar, lee **OBLIGATORIAMENTE**:
1. `pulsefit-skill/SKILL.md`
2. `pulsefit-skill/MEMORY.md`
3. `pulsefit-skill/references/generadores-hibridos.md` ← **CRÍTICO**, fuente principal de esta fase
4. `pulsefit-skill/references/formulas-nutricion.md`
5. `PHASE_4_REPORT.md`

Verifica que Fase 4 esté completa y validada. Si algo está pendiente, **NO avances**.

---

## REGLAS DE OPERACIÓN (recordatorio)

1. La IA generativa SOLO se usa para combinar ingredientes ya seleccionados. Nunca decide ingredientes ni cantidades.
2. Validador estricto rechaza outputs de IA que modifiquen cualquier dato crítico.
3. Fallback con plantillas garantiza que la app NUNCA queda sin plan.
4. La `GROQ_API_KEY` solo vive en `Deno.env`, jamás en cliente.
5. Convenciones inviolables: 3 espacios, comillas simples, sin punto y coma, alias `@`, prefijos `fnt`/`Itf`.
6. Lenguaje compasivo en toda la UI relacionada (incluso nombres de platos generados deben pasar filtro).

---

## OBJETIVO DE LA FASE 5

Al terminar onboarding (o cuando el usuario lo solicite), la app **genera automáticamente** un plan de comidas personalizado de 7 días con 4-5 comidas diarias. Cada comida cumple los macros target del usuario, respeta sus restricciones, alergias y dislikes, y tiene nombre creativo + pasos de preparación. Si el usuario rechaza una comida, recibe 3 alternativas. Todo sin alucinaciones ni inseguridades nutricionales.

---

## TAREAS

### Tarea 1 — Estructura del motor `src/features/meal-generator/`

Crea la siguiente estructura siguiendo `references/generadores-hibridos.md` secciones 2-4, 8, 9:

```
src/features/meal-generator/
├── index.ts                    # API pública del motor
├── nutritional-target.ts       # calcula objetivo por comida
├── ingredient-pool.ts          # consulta Open Food Facts y filtra
├── component-selector.ts       # selecciona combinación que cuadra macros
├── ai-plate-composer.ts        # cliente Groq con prompt restringido
├── plate-validator.ts          # valida output de IA
├── fallback-templates.ts       # plantillas de emergencia
├── types.ts                    # interfaces Itf*
└── *.test.ts                   # tests por archivo
```

### Tarea 2 — `nutritional-target.ts`

Función `calculateMealTargets(profile: ItfProfile): ItfMealTargets`:

- Distribuye `target_kcal` y macros del día entre comidas según preferencia del usuario.
- Distribución default (ajustable):
  - Desayuno: 25% kcal
  - Almuerzo: 35% kcal
  - Cena: 30% kcal
  - Snacks (am+pm): 10% kcal
- Si usuario indicó "no desayuna" en futuras configs, redistribuye a 4 comidas.
- Cada comida obtiene su target de kcal, proteína, carbos, grasa.

### Tarea 3 — `ingredient-pool.ts`

Función `getIngredientPool(profile, mealType): Promise<ItfIngredient[]>`:

1. Consulta Supabase tabla `foods_cache` primero (caché local).
2. Si no hay suficientes resultados, consulta Open Food Facts API en español.
3. Filtra por:
   - `dietary_restrictions` (excluir según vegetariano/vegano/sin gluten/sin lactosa).
   - `allergies` (búsqueda fuzzy en nombre e ingredientes).
   - `disliked_foods` (excluir).
   - `region` (priorizar resultados con tag LATAM si existe).
   - `budget_level` (si bajo, priorizar alimentos baratos: huevo, atún, arroz, frijoles, lentejas, plátano, avena, pollo).
4. Categoriza en: `protein_sources`, `carb_sources`, `fat_sources`, `vegetables`, `seasonings`.
5. Devuelve pool de 30-50 ingredientes válidos para esa comida.
6. Cachea resultados nuevos en `foods_cache`.

### Tarea 4 — `component-selector.ts`

Función `selectComponents(targets, pool, mealType): ItfComponentSelection`:

1. Selecciona 1 fuente de proteína que aporte 30-40% de la proteína target.
2. Selecciona 1 fuente de carbohidratos que llene resto de calorías.
3. Selecciona 1-2 vegetales/frutas según tipo de comida.
4. Selecciona 1 fuente de grasa si aún falta para llegar a target.
5. Calcula cantidades exactas en gramos para cuadrar macros ±10%.
6. Si no logra cuadrar, intercambia componentes y reintenta (máx 3 veces).
7. Devuelve lista de ingredientes con cantidades exactas + sazonadores libres.

**Crítico:** las cantidades calculadas aquí son inmutables. La IA NO las puede cambiar.

### Tarea 5 — `ai-plate-composer.ts`

Cliente que llama a Groq con el prompt exacto definido en `generadores-hibridos.md` sección 3:

```ts
export const composeMealPlates = async (
   selection: ItfComponentSelection,
   mealType: ItfMealType,
   culturalContext: string
): Promise<ItfAIRawResponse> => {
   const prompt = buildPrompt(selection, mealType, culturalContext)
   const response = await callGroq({
      model: 'llama-3.3-70b-versatile',
      messages: [
         { role: 'system', content: SYSTEM_PROMPT },
         { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
      timeout: 10000
   })
   return parseGroqResponse(response)
}
```

**Importante:** este archivo NO se usa directamente desde el cliente. Solo desde Edge Functions. La función debe poder importarse en Deno.

### Tarea 6 — `plate-validator.ts`

Función `validatePlates(rawResponse, allowedIngredients, expectedQuantities): ItfValidationResult`:

Implementa todas las validaciones de `generadores-hibridos.md` sección 4:

1. ✓ Parsing JSON correcto.
2. ✓ Tiene exactamente 3 opciones.
3. ✓ Cada opción tiene `name`, `description`, `prep_time_min`, `difficulty`, `steps`.
4. ✓ Solo menciona ingredientes de `allowedIngredients` (matching fuzzy case-insensitive).
5. ✓ No introduce ingredientes nuevos no autorizados.
6. ✓ `prep_time_min` entre 5 y 60.
7. ✓ `steps` tiene entre 2 y 10 elementos.
8. ✓ Cada step entre 10 y 200 caracteres.
9. ✓ `name` no contiene palabras prohibidas (filtro de seguridad).
10. ✓ `name` no es ofensivo culturalmente (filtro simple).
11. ✓ `description` no contiene afirmaciones nutricionales o médicas.

Devuelve `{ valid: boolean, errors: string[], plates: ItfPlate[] | null }`.

### Tarea 7 — `fallback-templates.ts`

Plantillas determinísticas que se usan si Groq falla 2 veces:

```ts
export const generateFallbackPlates = (
   selection: ItfComponentSelection,
   mealType: ItfMealType
): ItfPlate[] => {
   // 3 plantillas genéricas por meal type
   // Ejemplo: "Bowl de [proteína] con [carbo] y [verdura]"
   //          "Salteado de [proteína] al [sazonador]"
   //          "Plato simple: [proteína] + [carbo] + [verdura] al vapor"
}
```

Cada plantilla tiene pasos genéricos pero coherentes (ej: "Cocina la proteína a fuego medio 8-10 min", "Hierve el carbohidrato según indicaciones del paquete", "Saltea la verdura con un poco de aceite").

### Tarea 8 — `index.ts` (API pública del motor)

```ts
export const generateMealOptions = async (params: ItfGenerateMealParams): Promise<ItfMealOption[]> => {
   const targets = calculateMealTargets(params.profile)
   const pool = await getIngredientPool(params.profile, params.mealType)
   const selection = selectComponents(targets[params.mealType], pool, params.mealType)
   
   try {
      const aiResponse = await composeMealPlates(selection, params.mealType, params.culturalContext)
      const validation = validatePlates(aiResponse, selection.allowedIngredients, selection.quantities)
      
      if (validation.valid) return validation.plates
      
      // Reintento con prompt más estricto
      const retryResponse = await composeMealPlates(selection, params.mealType, params.culturalContext, { stricter: true })
      const retryValidation = validatePlates(retryResponse, selection.allowedIngredients, selection.quantities)
      
      if (retryValidation.valid) return retryValidation.plates
      
      // Fallback
      logFallbackUsed(params.userId, 'meal', validation.errors)
      return generateFallbackPlates(selection, params.mealType)
   } catch (e) {
      logFallbackUsed(params.userId, 'meal', [e.message])
      return generateFallbackPlates(selection, params.mealType)
   }
}

export const generateWeeklyMealPlan = async (profile: ItfProfile): Promise<ItfMealPlan> => {
   // Genera 7 días × 4-5 comidas
   // Persiste en meal_plans y meal_plan_items
}
```

### Tarea 9 — Edge Functions

Crea **dos Edge Functions** en `supabase/functions/`:

#### `generate-meal-options/index.ts`
- Recibe: `{ mealType, culturalContext }` (perfil se obtiene del JWT).
- Llama a `generateMealOptions`.
- Devuelve: `{ msg, data: { options: ItfMealOption[] } }`.
- Timeout: 15 segundos máx.
- Manejo de errores con logging.

#### `generate-meal-plan/index.ts`
- Recibe: nada extra (perfil se obtiene del JWT).
- Llama a `generateWeeklyMealPlan`.
- Persiste en Supabase.
- Devuelve: `{ msg, data: { planId, days } }`.
- Timeout: 60 segundos (genera 21+ comidas).
- Idempotente: si ya hay plan activo de la semana, devuelve el existente a menos que `?regenerate=true`.

### Tarea 10 — Configuración de secretos

En el reporte final, incluye instrucciones claras para que el usuario configure `GROQ_API_KEY`:

```
Para que la generación funcione, necesitas:
1. Crear cuenta gratuita en https://console.groq.com
2. Generar una API key.
3. En Supabase Dashboard → Project Settings → Edge Functions → Secrets,
   agregar: GROQ_API_KEY=<tu-key-aquí>
4. Re-deployar Edge Functions: npx supabase functions deploy
```

### Tarea 11 — Frontend

- **`src/api/fntMeals.ts`** con:
  - `fntGenerateMealPlan()` — llama Edge Function `generate-meal-plan`.
  - `fntRegenerateMealOptions(mealType, dayOfWeek)` — llama `generate-meal-options`.
  - `fntGetCurrentMealPlan()` — query directa a Supabase.
  - `fntReplaceMealInPlan(planItemId, newOption)` — actualiza item específico.

- **`src/interface/itfMeals.ts`** con tipos.

- **Trigger automático**: en `Step7Summary.tsx` (o al confirmar onboarding), después de marcar `onboarding_completed = true`, lanza `fntGenerateMealPlan` en background. Mostrar al usuario un loading compasivo: "Estamos preparando tu plan personalizado 🌱 (~30 segundos)".

### Tarea 12 — Caché y rate limiting

- En `meal_plan_items`, no regenerar comidas que ya existen y el usuario aceptó.
- Rate limiting: máx 30 generaciones de comidas individuales por usuario por día (suficiente para uso normal). Implementar en Edge Function consultando `rescue_events` y `meal_logs` recientes.
- Si un usuario excede el límite: respuesta compasiva: "Has explorado muchas opciones hoy 🌿. Vuelve mañana o avísanos si algo no te convence."

### Tarea 13 — Tests

**Tests unitarios** (cobertura > 85%):
- `nutritional-target.test.ts`: distribuciones correctas para diferentes perfiles.
- `ingredient-pool.test.ts`: filtros aplicados (vegetariano excluye carne, alérgico a gluten excluye trigo, etc.).
- `component-selector.test.ts`: cantidades cuadran macros con ±10%.
- `plate-validator.test.ts`:
  - Outputs válidos pasan.
  - Outputs con ingredientes nuevos fallan.
  - Outputs con cantidades modificadas fallan.
  - Outputs con steps demasiado largos fallan.
  - Outputs con nombres ofensivos fallan.
- `fallback-templates.test.ts`: genera platos coherentes.

**Tests de integración:**
- Mock de Groq que devuelve respuesta válida → motor devuelve plates.
- Mock de Groq que devuelve respuesta inválida → motor reintenta y luego fallback.
- Mock de Groq que falla con timeout → motor cae a fallback.
- Edge Function `generate-meal-options` recibe request, devuelve 3 opciones.

**Test E2E** (`tests/e2e/meal-plan.spec.ts`):
- Usuario con onboarding completo abre `/home`.
- Plan de la semana ya está generado.
- Verifica que muestra 7 días con comidas.
- Cada comida tiene nombre, kcal y macros visibles.
- Click en una comida abre detalle con pasos de preparación.

### Tarea 14 — UX en `/home` (preview parcial)

Como Fase 5 produce el plan pero la pantalla home completa es Fase 7, agrega un placeholder funcional en `HomePage.tsx`:

- Si hay plan de comidas activo: muestra resumen del día (4-5 cards de comidas con nombre y kcal).
- Cada card es tappable y abre dialog/sheet con detalle (pasos, macros completos).
- Botón "Cambiar esta comida" → llama `fntRegenerateMealOptions`, muestra 3 alternativas en bottom sheet.
- Si el usuario elige alternativa, llama `fntReplaceMealInPlan`.
- Mensajes con tono compasivo: "Aquí tienes 3 opciones nuevas 🌱. ¿Cuál te apetece?".

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Motor `meal-generator` con tests > 85% cobertura.
- [ ] Edge Function `generate-meal-options` devuelve 3 opciones válidas en < 15s.
- [ ] Edge Function `generate-meal-plan` genera plan semanal en < 60s.
- [ ] Validador rechaza correctamente outputs con ingredientes/cantidades alteradas.
- [ ] Fallback funciona cuando Groq falla (probado con mock).
- [ ] `GROQ_API_KEY` configurada como secreto en Supabase.
- [ ] Plan se persiste correctamente en `meal_plans` y `meal_plan_items`.
- [ ] Usuario puede regenerar comida individual desde `/home`.
- [ ] Caché evita regeneración innecesaria.
- [ ] Rate limiting funciona.
- [ ] Restricciones dietéticas se respetan (probado con perfil vegetariano).
- [ ] Alergias se respetan (probado con perfil alérgico al gluten).
- [ ] Presupuesto bajo prioriza alimentos económicos.
- [ ] Tests unit + integración + e2e pasan.
- [ ] `MEMORY.md` actualizado.

---

## CHECKPOINT FINAL

Al cumplir todos los criterios:

1. Genera `PHASE_5_REPORT.md` con:
   - Tareas completadas.
   - Métricas de Groq: tasa de éxito de validación primer intento, tasa de fallbacks usados, tiempo promedio de generación.
   - Decisiones tomadas durante implementación.
   - Archivos creados/modificados.
   - Issues conocidos.
   - **Instrucciones explícitas para configurar `GROQ_API_KEY`** si aún no está hecho.

2. Detente y reporta al usuario:

```
✅ FASE 5 COMPLETADA — Generador de comidas con IA validada

[Resumen de 5-8 líneas: qué se construyó, cómo funciona el flujo,
métricas clave]

📄 Reporte detallado: PHASE_5_REPORT.md

⚠️ ANTES DE CONTINUAR, verifica que configuraste GROQ_API_KEY
   en Supabase secrets (instrucciones en el reporte).

🔍 Antes de avanzar a Fase 6 te recomiendo verificar:
- Generar tu plan personal y leer 3-4 comidas: ¿tienen sentido?
- Probar regenerar una comida que no te guste: ¿las alternativas son distintas y razonables?
- Probar con perfil vegetariano: ¿no aparece carne?
- Revisar PHASE_5_REPORT.md métricas de Groq.

¿Apruebas avanzar a Fase 6 (motor de entrenamiento)?
Responde "sí, continúa con Fase 6" o indica qué ajustes necesitas.
```

3. **Espera respuesta explícita.**

---

**Empieza por la Tarea 1. Trabaja en orden estricto.**
