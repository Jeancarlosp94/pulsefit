# 📋 Prompt Fase 4 — Onboarding completo + cálculos nutricionales

> Pega este prompt a Claude Code después de haber completado las Fases 1, 2, 3 y la actualización de la skill con generadores híbridos.

---

## INSTRUCCIÓN PARA CLAUDE CODE

Antes de empezar, lee **OBLIGATORIAMENTE**:
1. `pulsefit-skill/SKILL.md`
2. `pulsefit-skill/MEMORY.md`
3. `pulsefit-skill/references/formulas-nutricion.md` ← crítico para esta fase
4. `pulsefit-skill/references/guia-completa.md` (sección 12, tareas de Fase 4)
5. `PHASE_3_REPORT.md`

Verifica que Fase 3 esté completa según sus criterios de aceptación. Si algo está pendiente, **NO avances**: completa Fase 3 primero y reporta.

Tu misión: **ejecutar la Fase 4 completa**. Trabajas las tareas de abajo en orden estricto. Al terminar, generas reporte y te detienes para que el usuario valide.

---

## REGLAS DE OPERACIÓN

1. Lee `SKILL.md` cada vez que dudes sobre convenciones.
2. Actualiza `MEMORY.md` después de cada tarea significativa, no solo al final.
3. Aplica el filtro de Roberto en cada decisión: ¿un usuario que abandonó 5 apps fitness seguiría usándola?
4. Aplica los límites de seguridad de Lucía sin excepción.
5. Lenguaje compasivo en TODA la UI. Cero "fallaste", cero rojo punitivo.
6. Mobile-first siempre: probar en 375px antes de cerrar cada pantalla.
7. Modo oscuro funcional en cada pantalla.
8. Accesibilidad WCAG AA: focus visible, contraste, navegación por teclado.
9. Convenciones: indentación 3 espacios, comillas simples, sin punto y coma, alias `@`, prefijos `fnt`/`Itf`.
10. Si encuentras una decisión ambigua que afecta varias fases, **detente y pregunta**.

---

## OBJETIVO DE LA FASE 4

Las 7 pantallas de onboarding funcionando con cálculos validados de Lucía. Al terminar, el usuario sale del onboarding con su perfil completo y `target_kcal`, `target_protein_g`, `target_carbs_g`, `target_fats_g`, `tmb`, `get_kcal` calculados y guardados en Supabase. La app le redirige a `/home` con `onboarding_completed = true`.

---

## TAREAS

### Tarea 1 — Motor `src/features/nutrition-engine/`

Implementa el motor completo siguiendo `references/formulas-nutricion.md`:

- **`calculations.ts`** con:
  - `calculateTMB(params: ItfTMBParams): number` (Mifflin-St Jeor).
  - `calculateGET(tmb: number, activityLevel: ItfActivityLevel): number`.
  - `calculateTargetKcal(get: number, goal: ItfGoal, deficitPct?: number): number`.

- **`macro-distribution.ts`** con:
  - `distributeMacros(params: ItfMacroParams): ItfMacroDistribution`.
  - Prioriza proteína según goal: lose=2.0g/kg, gain=1.8g/kg, maintain=1.6g/kg, feel_better=1.2g/kg.
  - Grasas: máx(0.8g/kg, 25% kcal). Carbos: el resto.

- **`safety-checks.ts`** con:
  - `validateNutritionPlan(params: ItfPlanInput): ItfValidationResult`.
  - Chequea: kcal mín (1200 mujer, 1500 hombre), pérdida máx 1%/sem, déficit máx 25%.
  - Devuelve `{ ok, reason, message, suggestedAdjustment }`.

- **`types.ts`** con todas las interfaces `Itf*` necesarias.

- **`index.ts`** que exporta API pública.

**Tests obligatorios** (`*.test.ts`) cobertura > 90%:
- Hombre/mujer/prefer_not_to_say con datos realistas.
- Todos los `goal` (lose, gain, maintain, feel_better).
- Todos los `activity_level`.
- Validaciones de seguridad: kcal por debajo del mínimo, pérdida demasiado rápida, déficit excesivo.
- Edge cases: edad 18, edad 80, peso 40kg, peso 150kg, altura 145cm, altura 200cm.

### Tarea 2 — Tipos y validaciones

- **`src/interface/itfOnboarding.ts`**: tipos para cada paso del onboarding y datos consolidados.
- **`src/validations/onboardingSchemas.ts`**: esquemas zod por paso. Mensajes en español compasivo. Ejemplos:
  - "Necesitamos tu edad para personalizar el plan 🌱" en vez de "Edad requerida".
  - "Ese peso parece fuera de rango, ¿puedes confirmarlo?" en vez de "Inválido".

### Tarea 3 — Capa API

- **`src/api/fntOnboarding.ts`** con:
  - `fntSaveOnboardingStep(step: number, data: Partial<ItfOnboardingData>)`.
  - `fntCompleteOnboarding(data: ItfOnboardingData)`: calcula TMB/GET/macros, guarda en `profiles`, marca `onboarding_completed = true`.
  - `fntGetOnboardingProgress()`: recupera datos parciales si el usuario abandonó a medio camino.

### Tarea 4 — Persistencia offline parcial

- En `src/lib/dexie-db.ts`, agregar tabla local `onboarding_drafts` para guardar datos parciales offline.
- En `src/lib/sync-manager.ts`, sincronizar drafts con Supabase al avanzar paso.
- Si el usuario cierra la app a la mitad, al regresar debe retomar donde quedó (leer drafts y saltar a paso correcto).

### Tarea 5 — Las 7 pantallas

Implementa en `src/pages/onboarding/`:

#### `Step1Welcome.tsx`
- Hero con ilustración (puede ser SVG o emoji por ahora).
- Título grande con DM Serif Display: "Tu coach personal, sin juicios".
- Subtítulo: "Vamos paso a paso. Sin presión."
- Botón único: "Empecemos" (estilo accent coral).

#### `Step2Goal.tsx`
- Pregunta: "¿Por qué estás aquí?"
- 3 cards grandes seleccionables (mín 100px alto, fácil tap):
  - 🎯 "Quiero bajar de peso" → `goal: 'lose'`
  - 💪 "Quiero ganar músculo" → `goal: 'gain'`
  - 🌱 "Quiero sentirme mejor" → `goal: 'feel_better'`
- Sin opción "mantener" en onboarding inicial (caso edge poco común).

#### `Step3BasicData.tsx`
- Inputs: edad (slider 18-80), sexo (3 chips: masculino/femenino/prefiero no decir), altura (slider en cm), peso actual (input numérico).
- Sección colapsable opcional: "¿Tienes alguna condición médica?" con chips (diabetes, hipertensión, problema articular, problema cardíaco, ninguna). Si selecciona alguna, mostrar disclaimer: "Te recomendamos consultar con tu médico antes de empezar 🌿".

#### `Step4Target.tsx`
- Peso meta (input numérico).
- Tiempo meta (slider de semanas, 4-52).
- Cálculo en vivo: muestra "Eso es ~X kg/semana" con ícono.
- **Validación de Lucía**: si pérdida > 1%/sem, mostrar card con tono compasivo:
  ```
  🌿 Esa meta es ambiciosa. Para que sea sostenible, te sugerimos
  [N semanas] que te llevarían a tu meta a un ritmo más amable
  con tu cuerpo.
  
  [Botón: "Ajustar a sugerido"] [Botón: "Mantener mi meta"]
  ```
- Si elige mantener, agregar disclaimer adicional pero **no bloquear** (excepto si después en cálculo final kcal < mínimo seguro, ahí sí bloquear con explicación).

#### `Step5Schedule.tsx`
- "¿Cuánto tiempo puedes dedicar al ejercicio?" — 4 chips: 15min, 30min, 45min, 60min+.
- "¿Qué días tienes disponibles?" — chips de días (L M M J V S D), múltiple selección.
- "¿Tienes equipamiento?" — chips visuales: solo cuerpo, mancuernas, banda elástica, gym completo. Múltiple selección.
- Validación: mínimo 2 días, mínimo 1 equipamiento (solo cuerpo cuenta).

#### `Step6Kitchen.tsx`
- "¿Cocinas tú?" — 3 opciones: sí / a veces / casi nunca.
- "¿Restricciones alimentarias?" — chips: vegetariano, vegano, sin gluten, sin lactosa, ninguna.
- "¿Alergias?" — input de texto libre.
- "Comidas que NO te gustan" — chips comunes (brócoli, pescado, hígado, etc.) + opción de agregar manual.
- "¿Presupuesto para comida?" — 3 opciones: bajo / medio / alto.

#### `Step7Summary.tsx`
- Card grande con resumen visual:
  - "Tu plan personalizado:"
  - Calorías diarias: `<target_kcal> kcal`.
  - Proteína: `<target_protein_g> g` (con tooltip explicando por qué priorizamos proteína).
  - Carbos: `<target_carbs_g> g`.
  - Grasas: `<target_fats_g> g`.
  - Frecuencia entrenamientos: "X días por semana, X minutos cada uno".
  - "Listo para empezar 🌱".
- Botón grande: "Ver mi plan".
- Al hacer click: llama `fntCompleteOnboarding`, redirige a `/home`.

### Tarea 6 — `OnboardingShell.tsx`

Debe gestionar:

- Barra de progreso visible siempre (paso actual / 7).
- Navegación: botón "Atrás" (excepto en paso 1) + botón "Continuar" (deshabilitado si validación falla).
- Persistencia automática al avanzar paso (Dexie + Supabase).
- Validación zod por paso antes de permitir avance.
- Animación suave entre pasos (framer-motion, 200ms).
- Si usuario sale y vuelve: retoma en último paso completado.
- Botón discreto "Salir" con dialog de confirmación: "Tu progreso se guarda. Vuelves cuando quieras 🌿".

### Tarea 7 — Tests

- **Tests unitarios** del motor `nutrition-engine` (cobertura > 90%).
- **Tests unitarios** de validaciones zod (casos válidos e inválidos).
- **Test E2E** en `tests/e2e/onboarding.spec.ts`:
  ```
  Escenario: usuario nuevo completa onboarding
  1. Registrarse con email/password.
  2. Llegar automáticamente a /onboarding.
  3. Completar los 7 pasos con datos válidos.
  4. Verificar redirección a /home.
  5. Verificar que profile.onboarding_completed === true en Supabase.
  6. Verificar que target_kcal está calculado y dentro del rango esperado.
  ```
- **Test E2E adicional**: usuario abandona en paso 4, vuelve a entrar, retoma en paso 4.

### Tarea 8 — Manejo de casos especiales

Documenta en `MEMORY.md` decisiones tomadas para:
- Usuario menor de edad: actualmente bloqueado por validación zod (mín 18). Mostrar mensaje compasivo.
- Usuario con condición médica grave (cardíaca, diabetes): mostrar disclaimer + botón "Hablar con un profesional primero".
- Embarazo: agregar campo opcional en step 3 (solo si sex === 'female'), si marca embarazada → bloquear con mensaje recomendando supervisión médica especializada.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Motor `nutrition-engine` funciona con tests > 90% cobertura.
- [ ] Las 7 pantallas funcionan en 375px (probadas en DevTools mobile).
- [ ] Las 7 pantallas funcionan en modo oscuro.
- [ ] Cálculos de TMB/GET/macros correctos según `formulas-nutricion.md`.
- [ ] Validaciones de seguridad disparan mensajes compasivos.
- [ ] Pérdida > 1%/sem muestra alerta sin bloquear.
- [ ] Kcal por debajo del mínimo bloquea con explicación.
- [ ] Datos persisten entre pasos (recargar página no pierde progreso).
- [ ] Al terminar, `profile.onboarding_completed = true` en Supabase.
- [ ] Redirección a `/home` funciona.
- [ ] Tests unit + E2E pasan.
- [ ] Lighthouse de la pantalla de onboarding mantiene 90+ en todas las métricas.
- [ ] Lenguaje compasivo verificado en cada pantalla (cero "Error", cero "Inválido", cero rojo punitivo).
- [ ] `MEMORY.md` actualizado con bitácora completa de Fase 4.

---

## CHECKPOINT FINAL

Al cumplir todos los criterios de aceptación:

1. Genera `PHASE_4_REPORT.md` con:
   - Tareas completadas vs pendientes.
   - Resultados de tests (cobertura, fallos).
   - Decisiones tomadas (especialmente sobre casos especiales).
   - Archivos creados/modificados.
   - Capturas o descripciones de UX clave.
   - Issues conocidos o deuda técnica.
   - Recomendaciones de validación humana antes de Fase 5.

2. **Detente y reporta al usuario** con este formato:

```
✅ FASE 4 COMPLETADA — Onboarding y cálculos nutricionales

[Resumen de 5-8 líneas: qué se construyó, cómo se siente la app ahora,
métricas clave del trabajo realizado]

📄 Reporte detallado: PHASE_4_REPORT.md

🔍 Antes de avanzar a Fase 5 te recomiendo verificar:
- Completar el onboarding con tus datos reales y revisar que las
  calorías/macros calculadas tengan sentido.
- Probar el flujo en mobile (375px) y modo oscuro.
- Probar abandonar en paso 4 y volver: ¿retoma correctamente?
- Probar el caso de meta agresiva (>1%/sem): ¿el mensaje es compasivo?

¿Apruebas avanzar a Fase 5? Responde "sí, continúa con Fase 5" o
indica qué ajustes necesitas antes.
```

3. **Espera respuesta explícita** del usuario. No avances sin "sí, continúa con Fase 5" o equivalente claro.

---

**Empieza por la Tarea 1. Trabaja en orden estricto. Al terminar, ejecuta el protocolo de checkpoint.**
