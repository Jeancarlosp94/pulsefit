# 🧪 Informe de Simulación de Beta — 20 Testers Difíciles

> **Ejercicio:** simulación profunda con 20 perfiles diversos LATAM (más algunos casos extremos) que probaron intensivamente PulseFit en su estado actual (al cierre de Fase 11). Cada perfil fue elegido para maximizar fricción: usuarios mañosos, hipercríticos, edge cases, perfiles fuera del target original.
>
> **Fecha:** 2026-06-10
> **Versión probada:** HEAD = `92b7076` (Fase 11 cerrada)
> **Objetivo:** revelar bugs, fricciones, sesgos y huecos antes de la beta real.

---

## 📋 Roster de testers

| # | Nombre | Edad | País | Perfil resumido | Severidad de feedback |
|---|---|---|---|---|---|
| 01 | Mariana Yépez | 34 | 🇪🇨 Quito | Mamá, dos hijos, modo familia, recetas latinas | 🟡 Media |
| 02 | Joaquín Salas | 30 | 🇵🇪 Lima | Oficinista, le da pereza el gym y cocinar | 🟡 Media |
| 03 | Doña Carmen Loja | 67 | 🇪🇨 Cuenca | Adulta mayor, hipertensión, no tecnológica | 🔴 **CRÍTICA** |
| 04 | Bryan Tomalá | 22 | 🇪🇨 Guayaquil | Gym bro, busca volumen, RPE 9+ siempre | 🟠 Alta |
| 05 | Sofía Restrepo | 16 | 🇨🇴 Bogotá | Adolescente, presión escolar, podría tener TCA | 🔴 **CRÍTICA** |
| 06 | Renata Ferreyra | 28 | 🇦🇷 Buenos Aires | Vegana estricta, en recuperación de TCA | 🔴 **CRÍTICA** |
| 07 | Diego Hernández | 45 | 🇲🇽 CDMX | Diabético tipo 2, obesidad clase II | 🟠 Alta |
| 08 | Lucía Mosquera | 38 | 🇨🇴 Medellín | Periodista, mañosa con la comida, escéptica | 🟡 Media |
| 09 | Rodrigo Pizarro | 52 | 🇨🇱 Santiago | Ejecutivo, viaja 3 días/semana en hotel | 🟡 Media |
| 10 | Kimberly Rivera | 25 | 🇵🇷 San Juan | Boricua bilingüe, judge del español "neutro" | 🟡 Media |
| 11 | Andrés Mamani | 19 | 🇵🇪 Cusco | Universitario, $30/sem de presupuesto | 🟠 Alta |
| 12 | Valentina Suárez | 31 | 🇻🇪 → 🇦🇷 | Migrante venezolana, depresión, comida escasa | 🔴 **CRÍTICA** |
| 13 | Hugo Benítez | 41 | 🇵🇾 Asunción | Carnívoro paraguayo, odia los snacks | 🟡 Media |
| 14 | Patricia Urdaneta | 56 | 🇻🇪 Maracaibo | Menopausia, dolor articular, escéptica de apps | 🟠 Alta |
| 15 | Felipe Costa | 27 | 🇧🇷 Brasília | Brasileño, lee algo de español, prefiere portugués | 🟡 Media |
| 16 | Mateo Quishpe | 35 | 🇪🇨 Pueblo rural | Conexión 2G intermitente, smartphone básico | 🟠 Alta |
| 17 | Ximena Pacheco | 29 | 🇪🇨 Quito | Crossfitter, RPE 9 siempre, hiper-exigente | 🟡 Media |
| 18 | Tomás Berrutti | 33 | 🇺🇾 Montevideo | Voseo cerrado, le molesta el "tuteo neutro" | 🟢 Baja |
| 19 | Camila Vargas | 42 | 🇵🇪 Lima | Madre soltera, 3 hijos, tiempo cero | 🟠 Alta |
| 20 | Esteban Aguilar | 24 | 🇭🇳 San Pedro Sula | Soccer, anti-gym, no comprende "RPE" | 🟡 Media |

---

## 🔬 Reportes individuales

### 01 · Mariana Yépez (34, Quito) — 🟡 Media
**Persona:** mamá de dos, cocina para la familia, ya conocida del proyecto.

**Flujo:**
- Onboarding: ✅ Fluido, eligió "modo familia 4 personas" en Sprint 1.2.
- Plan de comidas: ✅ Reconoce ceviche, lomo saltado, frittata.
- Lista de compras: ✅ Le funciona el botón "Compartir" para mandar al esposo.
- Home: ✅ Las cards reactivas le gustan.

**Fricciones:**
- 🐛 "Modo familia = 4" suma porciones, **pero** los tooltips de macros siguen mostrando macros _individuales_. Le confunde.
- 🐛 Al tap'ear "Comí algo distinto" → "Otra cosa" no hay buscador, solo input libre. Tuvo que adivinar las kcal del "encebollado" que comió.

**Quote:**
> "Me encanta que reconozcan el menestrón. Pero cuando dice 'tu desayuno: 450 kcal' yo no sé si es la mía o la familiar."

**Acción:** clarificar en MacrosProgressCard si las kcal mostradas son individuales (siempre lo son) con un info tooltip cuando family_size > 1.

---

### 02 · Joaquín Salas (30, Lima) — 🟡 Media
**Persona:** oficinista, le da pereza el gym y cocinar.

**Flujo:**
- Onboarding: ✅ Eligió "no tengo gimnasio, no me gusta cocinar".
- Plan: ❓ El plan sigue trayendo recetas con 6+ pasos. "Pereza".
- Home: ✅ El FAB Quick Actions le encanta.

**Fricciones:**
- 🐛 No hay filtro "max prep_time_min" en el generador de comidas. Aunque tiene `cooks_at_home = false`, las recetas siguen siendo de 25 min.
- 🐛 El botón "Empezar entrenamiento" en RegistrarPage le genera una sesión de 8 ejercicios. Para él "es mucho".
- 🐛 No hay opción "modo flojo" para reducir volumen sin tener que regenerar.

**Quote:**
> "El día que tap'eo 'Hoy no puedo → sin tiempo → rutina exprés 15 min' es genial. Pero yo quiero que mi plan base ya sea exprés."

**Acción:**
1. Respetar `cooks_at_home = false` en el generador → max 15 min prep + recetas tipo bowl/sandwich.
2. Agregar slider "Intensidad del plan" en Perfil (light/standard/intense).

---

### 03 · Doña Carmen Loja (67, Cuenca) — 🔴 CRÍTICA
**Persona:** abuela cuencana, hipertensa, sin smartphone propio (usa el de su nieta).

**Flujo:**
- Onboarding: 🚨 **Bloqueo en Step 1** — la tipografía es muy pequeña, los botones con baja contraste. No entiende qué es "PWA".
- No completó.

**Fricciones críticas:**
- 🐛 **Sin "modo accesibilidad"**: no hay zoom de texto, no hay alto contraste extra.
- 🐛 **No hay filtro por hipertensión** en condiciones médicas del onboarding (solo "diabetes, hipotiroidismo, otras").
- 🐛 Las recetas no marcan contenido de sodio. Para hipertensos esto es **crítico de seguridad**.
- 🐛 Los tooltips se cierran al tap fuera, pero ella tap'ea sin querer y los pierde.

**Quote:**
> "Mija, ¿qué es 'macros'? No entiendo. ¿Por qué tengo que decir si quiero perder peso? Yo solo quiero comer bien."

**Acción:**
1. **Disclaimer 65+**: la app no está pensada para adultos mayores con condiciones crónicas. Sugerir consultar a un médico.
2. Agregar checkbox "hipertensión" en medical_conditions + filtrar ingredientes high-sodium en plate-validator.
3. Modo accesibilidad: zoom 150% + alto contraste WCAG AAA.
4. Onboarding modo "simple": preguntar SOLO objetivo + datos antropométricos básicos, saltar 5 pasos para mayores de 60.

---

### 04 · Bryan Tomalá (22, Guayaquil) — 🟠 Alta
**Persona:** gym bro, 4 años entrenando, busca volumen.

**Flujo:**
- Onboarding: ⚠️ Marca "fitness_level: advanced" pero el motor lo trata casi igual que intermediate.
- Plan: ❌ Le da 3 series × 8 reps de press banca, "eso no me hace nada".
- Sesión: registró RPE 9 en todos los ejercicios.

**Fricciones:**
- 🐛 `progression-suggester` con RPE > 8.5 marca "deload" pero Bryan lo quiere por encima. No respeta su contexto.
- 🐛 El motor **no soporta** rep ranges altos para hipertrofia (no genera 4×10-12 con descansos de 60s).
- 🐛 `MEAL_TARGETS` para `gain` con superávit de +12% le parecen muy bajos. "Necesito 3500 kcal, no 2700".
- 🐛 Mínimo absoluto seguro está bien, pero **el techo NO está validado**: si Bryan pone peso 90kg y goal=gain podría pedir 4500 kcal sin alerta.

**Quote:**
> "La app me trata como principiante. Y el sugeridor de carga es demasiado conservador. Necesito modo avanzado real."

**Acción:**
1. `set-rep-calculator` con modo hipertrofia explícito (8-12 reps, 60-90s descanso, RIR 1-2).
2. `progression-suggester` con un "advanced override" que respete RPE 8-9 sin marcar deload.
3. Techo de calorías para evitar sugerencias absurdas (max 4000 mujer / 4500 hombre con justificación clínica).

---

### 05 · Sofía Restrepo (16, Bogotá) — 🔴 CRÍTICA
**Persona:** adolescente, presión académica, body image fragile.

**Flujo:**
- Onboarding: 🚨 **La app la deja entrar.** Solo pide consentimiento, no valida edad.
- Eligió goal: `lose`, peso 52 kg, altura 1.65. **IMC = 19.1 (borderline bajo peso)**.
- Plan generado: déficit 20% → 1400 kcal. **Cumple el mínimo seguro mujer (1200), pero el contexto es peligroso.**

**Fricciones críticas:**
- 🚨 La política dice "no para menores de 16" pero el onboarding **no verifica edad ni la bloquea**.
- 🚨 Para alguien con IMC < 19.5 y goal=lose, debería haber **señal de alerta médica obligatoria** y no permitir generar plan de déficit.
- 🐛 El mood check-in con mood < 2 por días seguidos solo dispara "considera hablar con profesional" en revisión semanal. No **escala** en tiempo real.
- 🐛 Los chips de "0 vasos de agua" → "tu peso bajó 2 kg en 7 días" no detiene la generación de planes nuevos.

**Quote:**
> "La app es bonita. Pero yo quería bajar 5 kg y me dejó. Mi mamá no sabe que la uso."

**Acción (BLOQUEANTE para beta):**
1. **Verificación de edad mínima 18** con DOB en signup. Bajo 18 → bloquear con mensaje compasivo.
2. **IMC guard**: si IMC < 18.5 y goal=lose → bloquear plan + sugerir profesional.
3. **Red flags detector** (Fase 9 Tarea 5 que quedó pendiente): pérdida > 1%/sem 2 semanas → escalada con disclaimer obligatorio.
4. **Persistent low mood + low IMC + restrictive eating pattern** → pantalla de recursos profesionales **no skippable**.

---

### 06 · Renata Ferreyra (28, Buenos Aires) — 🔴 CRÍTICA
**Persona:** vegana estricta, en recuperación de TCA (anorexia hace 4 años).

**Flujo:**
- Onboarding: ✅ Marca "vegan", marca "trastorno de conducta alimentaria" en otras condiciones.
- Plan: ⚠️ Sigue trayendo huevos en algunas opciones (bug en filtro vegano).
- Revisión semanal: 🚨 le sugirió "-100 kcal" porque su peso no bajó.

**Fricciones críticas:**
- 🚨 El motor de comidas **a veces incluye huevo** aunque diet_type=vegan (filtro falla en algunas combinaciones por fallback).
- 🚨 La app **no detecta** "TCA en historial" como bandera roja. Le sugiere déficit como a cualquier otra.
- 🚨 La revisión semanal le habla de calorías y métricas — eso es **trigger** para alguien en recuperación.
- 🐛 No hay opción "modo intuitivo": comer sin contar kcal, solo tracking compasivo.

**Quote:**
> "Cuando me dijo 'tu peso se estancó, bajá 100 kcal' me bloqueé. No volví a abrir la app 2 días."

**Acción (BLOQUEANTE para beta):**
1. Si `medical_conditions` incluye TCA/anorexia/bulimia → activar **modo intuitivo**:
   - Sin métricas calóricas visibles.
   - Sin sugerencias de déficit.
   - Tracking solo en términos de sensaciones (hambre/saciedad/ánimo).
   - Cero mención de peso en revisión semanal.
2. Fix bug: filtro vegan también en fallback-templates.
3. Disclaimer obligatorio: PulseFit **no sustituye** acompañamiento clínico para TCA.

---

### 07 · Diego Hernández (45, CDMX) — 🟠 Alta
**Persona:** diabético tipo 2, IMC 34.

**Flujo:**
- Onboarding: ✅ Marcó diabetes.
- Plan: ⚠️ Sigue trayendo arroz blanco / pasta sin distinguir índice glucémico.

**Fricciones:**
- 🐛 No hay distinción **carbo simple vs complejo** en el plate-validator.
- 🐛 Mínimo proteínico 1.2 g/kg es bajo para diabético en déficit (literatura sugiere 1.6).
- 🐛 No advierte sobre el **timing** de las comidas (importante en diabetes).
- 🐛 La cascada IA puede sugerir frutas dulces sin contexto.

**Quote:**
> "La app me sugirió fideos con salsa para almuerzo. Mi glucosa subió a 230. Tengan cuidado con diabéticos."

**Acción:**
1. Si diabetes en condiciones → priorizar carbos complejos + proteínas 1.6 g/kg + fibra.
2. Disclaimer obligatorio: consultar con endocrinólogo + nutricionista.
3. Lista "alimentos a evitar para diabéticos" en plate-validator.

---

### 08 · Lucía Mosquera (38, Medellín) — 🟡 Media
**Persona:** periodista, escéptica, prueba apps para escribir review.

**Flujo:**
- Onboarding: ⚠️ Le molesta que pregunten "género" pero no haya opción "no especificar" en el TMB.
- Plan: ✅ Reconoce bandeja paisa, frijoles, arepa. "Bueno".
- Probó "Hoy no puedo" 5 veces en diferentes triggers para ver respuestas.

**Fricciones:**
- 🐛 Los rescates emocionales solo ofrecen 2-3 opciones, no 3 fijos. Inconsistente.
- 🐛 El validator de revisión semanal no rechaza "necesitarías" (variante de "necesitas"). Edge case lingüístico.
- 🐛 Algunos íconos de logros usan emoji que se ven raros en Android antiguo (🌳 → cuadrado vacío).

**Quote:**
> "Es buena, pero algunos botones son ambiguos. ¿'Aplicar y empezar nueva semana' aplica los cambios o me resetea?"

**Acción:**
1. Sweep de palabras prohibidas en validator: agregar "necesitarías", "tendrías que", "te falta".
2. Confirm dialog explícito antes de aplicar cambios de calorías.
3. Fallback de emojis a íconos lucide si SO < cierta versión.

---

### 09 · Rodrigo Pizarro (52, Santiago) — 🟡 Media
**Persona:** ejecutivo, viaja 3 días/semana en hotel.

**Flujo:**
- Onboarding: ✅
- Plan: ⚠️ Las recetas asumen que tiene cocina completa.
- Cuando viaja: tap "Hoy no puedo → fuera de casa". Le da 3 opciones que le gustan.

**Fricciones:**
- 🐛 No hay perfil "viajero": no puede marcar "estoy en hotel los lunes-miércoles" para que el plan ya se ajuste sin tener que rescatar cada vez.
- 🐛 Sin integración de "ayer comí en restaurante de hotel" → tiene que loggear cada cena como "comí otra cosa".
- 🐛 El cronómetro de descanso se pausa cuando bloquea pantalla. Frustrante en hotel.

**Quote:**
> "El rescate funciona. Pero quisiera que la app aprenda que viajo y me arme el plan diferente lunes-miércoles vs jueves-domingo."

**Acción:**
1. Calendario semanal en perfil: días en casa / fuera / oficina con opciones por defecto.
2. Persistir cronómetro con Web Notifications API + Wake Lock.

---

### 10 · Kimberly Rivera (25, San Juan PR) — 🟡 Media
**Persona:** boricua bilingüe (inglés/español puertorriqueño).

**Flujo:**
- Onboarding: ⚠️ "Tú" le suena correcto pero "ñame", "yuca" no aparecen como ingredientes LATAM.
- Plan: ❌ No reconoce "arroz con habichuelas", "mofongo", "pastelillos".

**Fricciones:**
- 🐛 El seed-canonical-dishes tiene 0 platos puertorriqueños/caribeños.
- 🐛 No hay filtro de "cocina caribeña".
- 🐛 Algunos términos: "palta" (no se usa en PR, es "aguacate"). Pequeño detalle.

**Quote:**
> "Está bien la app. Pero asume que LATAM = Sudamérica. Caribe existe."

**Acción:**
1. Agregar 8-10 platos caribeños al seed-canonical-dishes (PR, Cuba, RD).
2. Agregar "Caribeña" como cocina favorita en el onboarding.
3. Sinonimia regional en seed-ingredients: palta/aguacate, choclo/elote/maíz, etc.

---

### 11 · Andrés Mamani (19, Cusco) — 🟠 Alta
**Persona:** universitario, $30/sem, vive con familia rural.

**Flujo:**
- Onboarding: ✅ Marca "low_budget".
- Plan: ⚠️ Sigue sugiriendo quinua, salmón, almendras.

**Fricciones:**
- 🐛 El filtro `budget_level` parece no afectar al pool. Le da ingredientes premium.
- 🐛 No hay lista regional "Andina" en el seed con énfasis en lo realmente económico (arroz, lentejas, huevos, plátano, papa).
- 🐛 "Hoy no puedo → bolsillo apretado" da 3 opciones buenas, pero el plan _base_ debería ser ya económico.

**Quote:**
> "$8 el kilo de quinua. Yo como arroz con huevo todo el mes. La app debería saberlo."

**Acción:**
1. Validar que `budget_level=low` filtre TODOS los ingredientes `tier=high` (incluso si están en favorites).
2. Pool "Andino económico" con quinua opcional pero no protagonista.
3. Mostrar costo estimado por receta (rough: cheap/medium/high) para transparencia.

---

### 12 · Valentina Suárez (31, Caracas → BA) — 🔴 CRÍTICA
**Persona:** migrante venezolana, depresión, comida escasa.

**Flujo:**
- Onboarding: ✅ pero el paso "ingredientes que tienes en casa" la pone triste.
- Mood: registró 1 por 5 días seguidos.
- Generó plan con $20/semana de presupuesto.

**Fricciones críticas:**
- 🚨 Mood 1×5 días → solo dispara sugerencia "considera profesional" después de revisión semanal. **No escalada inmediata**.
- 🐛 La app no detecta que está en **estado de inseguridad alimentaria** (cantidades mínimas extremas).
- 🐛 El motor de comidas con `family_size=1` + `budget=low` aún sugiere 600g de pollo/día. Irreal para ella.
- 🐛 No hay link a recursos de ayuda local en Argentina (líneas de salud mental, comedores).

**Quote:**
> "Llegué a Buenos Aires hace 4 meses. La app me sugiere comprar avena, almendras... yo no tengo eso. Y cuando puse triste 5 días seguidos solo me dijo 'gracias por contarnos'. ¿Es todo?"

**Acción (BLOQUEANTE para beta):**
1. **Detección de mood persistente bajo en tiempo real** (no esperar a revisión semanal). Si mood ≤ 2 por 3+ días seguidos → modal con recursos profesionales locales.
2. Directorio de líneas de ayuda 24/7 por país (`profile.region` o IP).
3. "Modo escasez": opción para reducir aún más cantidades y priorizar lo más barato.
4. **Disclaimer claro:** PulseFit no es atención clínica. Si tu vida está en riesgo, llamá a [número local].

---

### 13 · Hugo Benítez (41, Asunción) — 🟡 Media
**Persona:** paraguayo, carnívoro, odia los snacks.

**Flujo:**
- Onboarding: ⚠️ Eligió `meals_per_day=2`. Plan se generó OK.
- Plan: ⚠️ Las 2 comidas dan 1300 kcal cada una. Le parece "mucho". No detecta su preferencia por proteína alta.

**Fricciones:**
- 🐛 El plate-validator no tiene un modo "proteína primero" para usuarios que lo prefieren (sobrepasar el techo de 50g de proteína por meal).
- 🐛 Sin opciones de "asado paraguayo" en el seed.
- 🐛 La revisión semanal le dijo "tu energía bajó" pero él no registró mood. Falso positivo.

**Quote:**
> "Yo como bife dos veces al día. Para qué quiero snacks. La app me sugería 'sándwich de hummus' como cena."

**Acción:**
1. Toggle "modo carnívoro" o `protein_preference: high` que suba el techo de proteína a 200g/día con seguridad.
2. Defensive coding en validator de revisión: si no hay mood data, no afirmar nada sobre energía.
3. Agregar 3-5 platos rioplatenses/paraguayos.

---

### 14 · Patricia Urdaneta (56, Maracaibo) — 🟠 Alta
**Persona:** menopausia, dolor articular, escéptica.

**Flujo:**
- Onboarding: ✅ pero no hay opciones específicas de menopausia.
- Rutina: ❌ Le dolió rodilla en sentadilla con barra.

**Fricciones:**
- 🐛 No hay flag `menopause` ni `joint_pain` en condiciones médicas.
- 🐛 El motor de rutinas no excluye automáticamente compound risers de rodilla si dolor articular.
- 🐛 Los logros premian "streak 30 días" — pero a su edad y con dolor, eso no debería ser objetivo.

**Quote:**
> "Hice 1 día de rutina y me dolió la rodilla. ¿La app no sabe que tengo 56 años? Volví al masaje y olvidé la app."

**Acción:**
1. Condiciones médicas: agregar "menopausia", "dolor articular", "artrosis", "lesión previa rodilla/hombro/lumbar".
2. Si dolor articular → filtrar squat con barra, peso muerto convencional, salto. Sustituir con leg press, hip thrust, swiss ball.
3. Logros adaptados a 50+: en lugar de "streak 30" → "constancia 3 días/sem por 4 semanas".

---

### 15 · Felipe Costa (27, Brasília) — 🟡 Media
**Persona:** brasileño, lee algo de español, prefiere portugués.

**Flujo:**
- Onboarding: ⚠️ Entiende ~70%. Algunas palabras le confunden.
- Plan: ✅ Reconoce feijoada (está en el seed canónico).

**Fricciones:**
- 🐛 No hay opción de idioma. La app es solo español.
- 🐛 Algunas frases largas en revisión semanal son difíciles para no-nativo.
- 🐛 Su goal "ganar peso" muestra mensajes "no te preocupes por la balanza", que confunde porque sí le importa.

**Quote:**
> "Eu entendi quase tudo, mas algumas frases longas me perdiam. Português seria ótimo."

**Acción:**
1. **No incluir Brasil en target inicial** de beta. Documentar como Fase futura: i18n PT-BR.
2. Mientras tanto, frases cortas + glosario en tooltip.
3. Contextualizar el lenguaje según goal (si goal=gain, no usar "olvida la balanza").

---

### 16 · Mateo Quishpe (35, rural Ecuador) — 🟠 Alta
**Persona:** conexión 2G intermitente, smartphone Android 8 con 2GB RAM.

**Flujo:**
- Login: ⚠️ Tarda 8 segundos.
- Generar plan: ❌ Timeout en Edge Function (8s no alcanza con su conexión).
- Offline: ✅ Dexie + sync-manager funcionan, registra logs.

**Fricciones críticas:**
- 🐛 La Edge Function `generate-meal-plan` con timeout de 12s por receta × 15 recetas en paralelo es muy pesada para 2G.
- 🐛 El bundle de Recharts (Fase 9) lo hace lento en su navegador.
- 🐛 No hay UI feedback de "estamos en una conexión lenta, espera más".

**Quote:**
> "La app se ve bonita pero cuando intento generar el plan se queda pegada. Mejor abro el WhatsApp."

**Acción:**
1. Lazy load de Recharts (solo cargar en ProgresoPage).
2. Edge Function con modo "low bandwidth": menos opciones (3 días en lugar de 7).
3. Banner "tu conexión es lenta, paciencia" cuando latencia > 5s.
4. Splitting de chunks por ruta agresivo.

---

### 17 · Ximena Pacheco (29, Quito) — 🟡 Media
**Persona:** crossfitter, RPE 9 siempre, hiper-exigente.

**Flujo:**
- Onboarding: ✅ pero no hay opción "soy atleta avanzada".
- Plan: ❌ El motor le da rutina genérica de "intermediate".
- Marca RPE 9.5 en todos los logs → la app le sugiere semana ligera al 80%.

**Fricciones:**
- 🐛 La app **no soporta atletas avanzados**.
- 🐛 La sugerencia automática de deload por RPE alto la frustra. Ella _quiere_ ese RPE.
- 🐛 No hay tracking de WOD o circuitos. Solo sets/reps/peso.

**Quote:**
> "Soy crossfitter desde hace 6 años. La app me trata como si fuera mi primera vez. Me siento subestimada."

**Acción:**
1. Aceptar que **no somos para atletas avanzados** en MVP. Disclaimer en onboarding.
2. Opción "modo atleta avanzado" (Fase 12+): respeta RPE 8-9 sin marcar deload.
3. Tracking de WOD (time, rounds, score) como tipo de workout adicional.

---

### 18 · Tomás Berrutti (33, Montevideo) — 🟢 Baja
**Persona:** uruguayo, voseo cerrado, le molesta el "tuteo neutro".

**Flujo:**
- Onboarding: 😒 "Esto es tuteo de mexicano".
- Probó todo el flujo.

**Fricciones:**
- 🐛 El voseo está EXPLÍCITAMENTE prohibido en el skill (Sprint 4). Para él se siente "ajeno".
- 🐛 Sin opción de idioma "es-AR" vs "es-MX" vs "es-neutro".

**Quote:**
> "Está bien, está limpia. Pero si me dice 'tú puedes' una vez más, me bajo. Soy uruguayo, no de Universal Studios."

**Acción:**
1. **Decisión de producto:** mantenemos tuteo neutro como default (regla validada).
2. Considerar para Fase 12: opción de localización es-AR (voseo + chau + "che") como dialecto opcional.

---

### 19 · Camila Vargas (42, Lima) — 🟠 Alta
**Persona:** madre soltera, 3 hijos, tiempo cero.

**Flujo:**
- Onboarding: ❌ **Abandonó en Step 5**: "muy largo".
- Reintentó al día siguiente.

**Fricciones:**
- 🐛 Onboarding de 7 pasos es **mucho** para alguien sin tiempo. No hay "skip" ni "guardar borrador".
- 🐛 La generación de plan toma 8-15 segundos. "No tengo paciencia".
- 🐛 Family_size se aplica a las porciones pero no a la complejidad: las recetas siguen siendo "4 pasos".

**Quote:**
> "Tres hijos, trabajo, casa... me piden 7 pasos para empezar. ¿En serio?"

**Acción:**
1. Onboarding mínimo: 3 pasos críticos (consentimiento + datos básicos + objetivo). El resto se infiere o pregunta después.
2. Wizard "configuración rápida" vs "configuración completa".
3. Pre-cache de planes mientras el usuario navega para no esperar al final.

---

### 20 · Esteban Aguilar (24, San Pedro Sula) — 🟡 Media
**Persona:** soccer, anti-gym, no comprende "RPE".

**Flujo:**
- Onboarding: ✅ Marca "no me gusta el gym, prefiero fútbol".
- Plan de entrenamiento: ❌ Le dan press banca, sentadillas. "No me gusta nada de esto".
- RPE: ❓ ¿Qué es?

**Fricciones:**
- 🐛 El motor de rutinas no acepta "fútbol/deporte" como modalidad principal.
- 🐛 El glosario en InfoTooltip explica RPE pero solo si tap'eas. Y mucha gente no tap'ea.
- 🐛 No hay tracking de "jugué fútbol 90 min" como sesión válida.

**Quote:**
> "Yo juego fútbol los sábados con mi clica. ¿Eso no cuenta como entrenamiento? La app quiere meterme al gym."

**Acción:**
1. Nuevo tipo de workout: "deporte" con campos (deporte + duración + intensidad). Cuenta como ejercicio en logros y revisión semanal.
2. Glosario inline en primer encuentro con RPE (modal didáctico).
3. Pool de rutinas: "complemento para deportistas" (movilidad + core + fuerza específica).

---

## 🔭 Hallazgos cross-tester

### A. Bugs críticos / bloqueantes para beta

| # | Bug | Reportado por | Severidad |
|---|---|---|---|
| B-01 | **Sin verificación de edad mínima 18** | Sofía (05) | 🔴 BLOQUEANTE |
| B-02 | **Sin IMC guard para goal=lose con bajo peso** | Sofía (05) | 🔴 BLOQUEANTE |
| B-03 | **Sin modo intuitivo para TCA en historial** | Renata (06) | 🔴 BLOQUEANTE |
| B-04 | **Mood persistente bajo NO escala en tiempo real** | Valentina (12), Sofía (05) | 🔴 BLOQUEANTE |
| B-05 | **Filtro vegan tiene leak en fallback templates** | Renata (06) | 🔴 BLOQUEANTE |
| B-06 | **Sin disclaimer ni filtros para hipertensión/diabetes** | Carmen (03), Diego (07) | 🔴 BLOQUEANTE |
| B-07 | **Sin recursos profesionales locales por país** | Valentina (12), Sofía (05) | 🔴 BLOQUEANTE |

### B. UX dolores transversales

| # | Dolor | Reportado por | Severidad |
|---|---|---|---|
| U-01 | Onboarding de 7 pasos es muy largo | Camila (19), Carmen (03) | 🟠 Alta |
| U-02 | Sin modo accesibilidad para 60+ | Carmen (03), Patricia (14) | 🟠 Alta |
| U-03 | El motor no respeta budget_level estrictamente | Andrés (11), Valentina (12) | 🟠 Alta |
| U-04 | No hay filtro de prep_time corto | Joaquín (02), Camila (19) | 🟡 Media |
| U-05 | Sin pool de cocina caribeña ni rioplatense/paraguaya | Kimberly (10), Hugo (13) | 🟡 Media |
| U-06 | Cronómetro se pausa con pantalla bloqueada | Rodrigo (09) | 🟡 Media |
| U-07 | Sin opción de idioma (PT-BR) | Felipe (15) | 🟢 Baja |

### C. Features faltantes

| # | Feature | Solicitado por |
|---|---|---|
| F-01 | Modo escasez (cantidades mínimas extremas) | Valentina (12) |
| F-02 | Modo viajero (días fuera de casa) | Rodrigo (09) |
| F-03 | Tracking de deporte/WOD | Esteban (20), Ximena (17) |
| F-04 | Toggle modo carnívoro / proteína alta | Hugo (13), Bryan (04) |
| F-05 | Modo intuitivo (sin métricas) | Renata (06) |
| F-06 | Modo atleta avanzado | Ximena (17), Bryan (04) |
| F-07 | Wake Lock para sesión de entrenamiento | Rodrigo (09) |

### D. Edge cases lingüísticos

| # | Issue | Impact |
|---|---|---|
| L-01 | Validator no rechaza "necesitarías", "tendrías que" | Lucía (08) |
| L-02 | "Palta" no se reconoce en Caribe (es "aguacate") | Kimberly (10) |
| L-03 | "Olvida la balanza" para goal=gain es contradictorio | Felipe (15) |
| L-04 | Voseo uruguayo/argentino: fricción cultural | Tomás (18) |

---

## 📊 Métricas de la simulación

| Métrica | Valor |
|---|---|
| Testers que completaron onboarding | 17 / 20 (85%) |
| Testers que generaron plan exitosamente | 15 / 20 (75%) |
| Testers que completaron ≥1 entrenamiento | 11 / 20 (55%) |
| Testers que llegaron a la revisión semanal | 8 / 20 (40%) |
| Testers que **abandonaron** | 5 (Carmen 03, Sofía 05*, Renata 06*, Mateo 16, Camila 19**) |
| Testers con **bug crítico de seguridad** | 4 (Sofía, Renata, Diego, Valentina) |
| Testers con **fricción cultural/lingüística** | 5 (Kimberly, Hugo, Felipe, Tomás, Patricia) |

\* Abandonó por bug crítico de seguridad (deberíamos haberlas bloqueado).
\** Reintentó al día siguiente.

**Net Promoter Score simulado: -10**
Promotores (9-10): 0
Pasivos (7-8): 7 (Mariana, Joaquín, Bryan, Diego, Lucía, Hugo, Felipe, Esteban)
Detractores (0-6): 12

---

## 🎯 Plan de mejoras priorizado

### 🚨 BLOQUEANTES — Sprint inmediato pre-beta (5-7 días)

**Sprint 11.5 — Seguridad clínica y vulnerabilidad:**

1. **Verificación de edad** (B-01): DOB obligatorio en signup. Si edad < 18 → mensaje compasivo + redirigir a "no podemos atenderte aún".
2. **IMC guard** (B-02): si IMC < 18.5 y goal=lose → bloquear y sugerir profesional. Si IMC > 35 + goal=gain → bloquear.
3. **Modo intuitivo para TCA** (B-03): nuevo flag `eating_disorder_history` en onboarding. Si está marcado:
   - Sin métricas calóricas visibles en planes.
   - Sin sugerencias de déficit en revisión semanal.
   - Tracking en términos de hambre/saciedad/ánimo.
   - Disclaimer obligatorio: "PulseFit no sustituye acompañamiento clínico".
4. **Detector de mood persistente en tiempo real** (B-04): si mood ≤ 2 por 3+ días → modal **no skippable** con recursos profesionales.
5. **Fix filtro vegan en fallback-templates** (B-05): test que valide que ningún path genere productos animales con `diet=vegan`.
6. **Disclaimers + filtros para condiciones médicas** (B-06):
   - Hipertensión: filtrar high-sodium.
   - Diabetes: carbos complejos primero + 1.6g/kg proteína.
   - Cada condición con disclaimer "consulta a tu médico".
7. **Directorio de recursos por país** (B-07): JSON estático con líneas 24/7 de salud mental por país LATAM. Disponible desde modal de escalación.

### 🟠 Alta prioridad — Sprint 11.6 (1-2 semanas)

**Onboarding y accesibilidad:**

8. **Onboarding rápido** (U-01): 3 pasos críticos como flow default. "Configuración completa" opcional.
9. **Modo accesibilidad** (U-02): toggle "Texto grande" + "Alto contraste" en settings. WCAG AAA.
10. **Budget_level estricto** (U-03): filtro hardcodeado contra tier=high incluso si favoritos. Mostrar costo aproximado por receta.

**Inclusión cultural:**

11. **Pool caribeño** (U-05): 8-10 platos PR/Cuba/RD agregados al seed-canonical-dishes. Cocina "Caribeña" en favoritas.
12. **Pool rioplatense + paraguayo** (U-05): asado, milanesa, mbeju, sopa paraguaya.

**Performance:**

13. **Lazy load de Recharts** y otros bundles pesados.
14. **Edge Function low-bandwidth mode**: 3 días en lugar de 7 si latencia detectada > 5s.

### 🟡 Media prioridad — Sprint 11.7 (2-3 semanas)

15. **Filtro prep_time max** (U-04): respetar `cooks_at_home=false` con max 15 min.
16. **Wake Lock + Notifications** para cronómetro (U-06).
17. **Tracking de deporte** (F-03): nuevo tipo de workout "deporte" con duración + intensidad.
18. **Modo viajero** (F-02): calendario semanal con días-tipo.
19. **Toggle proteína alta** (F-04): modo carnívoro / proteína primero.

### 🟢 Baja prioridad — Backlog

20. i18n PT-BR para Brasil (F-15).
21. Localización es-AR (voseo) para Uruguay/Argentina (L-04).
22. Modo atleta avanzado (F-06): respeta RPE 8-9, sin deload automático.
23. Sweep validator de palabras prohibidas extendido (L-01).

---

## 🎓 Conclusiones

### Lo que está bien
- ✅ El **núcleo del producto funciona**: 75% de testers generaron plan.
- ✅ La **filosofía compasiva resuena** — incluso testers críticos lo reconocieron.
- ✅ Los **rescates** salvan situaciones reales (Joaquín, Rodrigo, Mariana los usaron sin fricción).
- ✅ El **stack técnico es robusto**: 402 tests, 0 lint errors, build OK.
- ✅ La **transparencia** del InsightsPage (Fase 11) sorprendió positivamente a varios.

### Lo que es crítico arreglar antes de beta
- 🚨 **Seguridad clínica**: 4 testers descubrieron huecos serios (TCA, menores, mood bajo persistente, restricciones médicas). Si un usuario real se daña usando PulseFit, el proyecto colapsa.
- 🚨 **Vulnerabilidad emocional**: la app captura mood pero **no actúa con suficiente urgencia** cuando hay señales graves.
- 🚨 **Cobertura LATAM real**: el seed canónico está sesgado a Andino/sudamericano. Caribe y zona rioplatense son ciegos.

### Lo que es decisión estratégica
- **Foco del MVP**: el producto no es para atletas avanzados, ni para adultos mayores frágiles, ni para clínicos. Debemos **decirlo explícitamente** en el onboarding en lugar de pretender servir a todos.
- **i18n**: dejar fuera Brasil y posiblemente PR (caribeño) del MVP es legítimo si lo comunicamos al sumar testers.

### Recomendación
**NO LANZAR la beta con 30 usuarios hasta resolver los 7 BLOQUEANTES (B-01 a B-07).**

Hacer un Sprint 11.5 de 5-7 días con foco quirúrgico en seguridad clínica. Después correr **una mini-beta de 5 testers internos** que validen las correcciones. Luego sí, beta de 30.

El producto está al 85% de calidad. El 15% restante es lo que separa "linda PWA" de "PWA segura". Y ese 15% es no-negociable cuando hablamos de salud.

---

🌿 *"La consistencia importa más que la perfección"* — pero la seguridad importa más que ambas.
