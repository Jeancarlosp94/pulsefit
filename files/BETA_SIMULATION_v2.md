# 🔥 Simulación de Beta v2 — 20 Testers "Imposibles"

> **Reformulación del ejercicio anterior** con perfiles más realistas del target REAL:
> - Edades 18-45 años
> - Mentalidad cortoplacista ("resultados en 2 semanas")
> - Cero o nula educación nutricional
> - Mañosos con comida (limitan ingredientes, rechazan vegetales)
> - Vagos con ejercicio (lo evitan o lo hacen mal)
> - Vagos con cocinar (lo posponen o lo saltean)
> - Actitudes problemáticas: queja crónica, expectativa de milagro, rechazo al esfuerzo
>
> **Fecha:** 2026-06-29
> **Versión probada:** HEAD = `92b7076` (todas las 11 fases)
> **Hallazgos:** revela problemas de **retención + educación + anti-fricción** (distintos a los de seguridad clínica del v1).

---

## 📋 Roster de los 20 testers difíciles

| # | Nombre | Edad | País | Lo más jodido |
|---|---|---|---|---|
| 01 | **Karla** Espinoza | 24 | 🇪🇨 Quito | "Quiero abdomen marcado en 2 semanas" |
| 02 | **Bryan** Castillo | 28 | 🇵🇪 Lima | Bajar 15 kg en 1 mes, ya probó 4 apps |
| 03 | **Daniela** Rojas | 32 | 🇨🇴 Bogotá | Mamá, "verme como antes del embarazo" |
| 04 | **Javier** Cárdenas | 40 | 🇲🇽 CDMX | Netflix premium pero "no pago gym" |
| 05 | **Stephanie** Yagual | 22 | 🇪🇨 Guayaquil | "Cuerpo de TikTok en 3 semanas" |
| 06 | **Renzo** Quispe | 35 | 🇵🇪 Trujillo | "Yo solo como pollo con arroz" |
| 07 | **Antonella** Romero | 29 | 🇦🇷 Rosario | Vegetariana de moda, le da asco lo verde |
| 08 | **Brandon** Pérez | 19 | 🇻🇪 Maracay | Vive de pizza y Red Bull |
| 09 | **Mariangela** Solís | 37 | 🇨🇷 San José | 11 dietas en 2 años, última ayuno extremo |
| 10 | **Pablo** Astorga | 45 | 🇨🇱 Santiago | 4 cervezas/día, "el agua sabe a nada" |
| 11 | **Vanessa** Morales | 26 | 🇻🇪 → 🇪🇸 | Migrante, no encuentra ingredientes LATAM |
| 12 | **Cristhian** Maradiaga | 33 | 🇭🇳 Tegucigalpa | "Yo hago lagartijas, soy atleta" |
| 13 | **Yuliana** Restrepo | 24 | 🇨🇴 Cali | Quiere glúteo, odia las sentadillas |
| 14 | **Mathías** Cáceres | 21 | 🇵🇾 Asunción | Fuma, toma, "salud es mañana" |
| 15 | **Génesis** Alvarado | 30 | 🇸🇻 San Salvador | "Solo smoothies detox, lo demás engorda" |
| 16 | **Luis Miguel** Sánchez | 43 | 🇲🇽 Monterrey | Testosterona sin médico, "sé más que tú" |
| 17 | **Camila** Sepúlveda | 27 | 🇨🇴 Medellín | "Tonificada pero sin músculo" |
| 18 | **Mauricio** Tapia | 38 | 🇨🇱 Iquique | "Bajar 20 kg sin ejercicio porque engorda" |
| 19 | **Brigitte** Mejía | 31 | 🇩🇴 Punta Cana | "Bailo 4 horas, eso es entrenamiento" |
| 20 | **Diego** Hernández | 42 | 🇲🇽 Veracruz | 110 kg, 1.65, "no estoy gordo, soy ancho" |

---

## 🔬 Reportes individuales

### 01 · Karla Espinoza (24, Quito) — Reina de los milagros
**Persona:** trabaja en marketing, sigue 8 cuentas fitness en Instagram, hizo keto, lo dejó al día 3.

**Flujo:**
- Onboarding: 😒 "¿7 pasos? Las apps de Instagram tienen 2."
- Llenó datos: peso 58 kg, altura 1.62, goal=lose. **IMC = 22.1 (peso normal)**.
- Plan: ❓ Le dice 1500 kcal. "¿1500? Yo creía que tenía que comer 800".

**Fricciones:**
- 🐛 No hay pantalla **"¿Por qué no perderás 5 kg en 2 semanas?"** que eduque antes de generar plan.
- 🐛 Sin disclaimer **"perder peso saludable = 0.5-1% por semana"** visible.
- 🐛 La app NO le dice que con IMC 22 no debería estar en déficit fuerte.
- 🐛 Mood check se siente "psicología innecesaria".

**Quote:**
> "¿Por qué tengo que comer? Yo solo quiero salir bien en las fotos del verano. Y eso es en 3 semanas. ¿Pueden hacer algo o no?"

**Acción:** Pantalla didáctica pre-plan que normaliza tiempos reales. Bloqueo soft si IMC normal + goal=lose agresivo: "tu peso ya es saludable, ¿quieres tonificarte en lugar de perder?".

---

### 02 · Bryan Castillo (28, Lima) — Empieza fuerte, abandona el día 5
**Persona:** ya probó 4 apps fitness (MyFitnessPal, Noom, FatSecret, Lifesum). Las dejó todas.

**Flujo:**
- Onboarding: ⚡ Marca todo agresivo: pierde 15 kg, sin equipo, 7 días/semana.
- Plan: ❌ Genera 1800 kcal (déficit razonable). "Yo quería 1200".
- Día 1: cumplió 80%. Día 2: 60%. Día 3: abrió, no registró. Día 4: no abrió. Día 5: no abrió.

**Fricciones:**
- 🐛 No hay **push notification compasiva** cuando deja de abrir.
- 🐛 La app no detecta abandono ni intenta recuperar al usuario.
- 🐛 Los logros tipo "3 días seguidos ✨" solo se desbloquean DESPUÉS de la racha. No hay incentivo PROGRESIVO ("1 día más para tu primer logro 🌱").

**Quote:**
> "Esto es como todas las demás. Empiezas con ganas, te aburres, lo cierras. ¿En qué se diferencia esta?"

**Acción:**
1. **Re-engagement**: si usuario no abre 3 días → email/notif compasiva "no vamos a renunciar a ti".
2. **Progress hacia logro**: mostrar "te falta 1 día para desbloquear ✨ Tres días seguidos".
3. **Onboarding diferenciador**: explicar EXPLÍCITAMENTE en qué se diferencia de MyFitnessPal/Noom desde el primer pantallazo.

---

### 03 · Daniela Rojas (32, Bogotá) — La eterna "no tengo tiempo"
**Persona:** mamá de 1, trabaja medio tiempo, casa, marido. Tiempo neto disponible: 15 min al día.

**Flujo:**
- Onboarding: ⚠️ El campo "available_minutes/día" lo puso en 30. "Mentí. Son 10".
- Plan de comidas: recetas de 25-30 min de preparación. Imposible.
- Entrenamiento: pidió rutina de 60 min. ❌ "No tengo 60 min en mi vida".

**Fricciones:**
- 🐛 No hay validador "available_minutes vs receta.prep_time".
- 🐛 No hay rutinas reales de 5-10 min.
- 🐛 No se respeta `cooks_at_home` cuando es false: igual sugiere recetas.
- 🐛 Las cards visualmente DETALLADAS (4 macros + tooltips + porciones) la abruman. "Demasiado".

**Quote:**
> "Necesito comer en 5 minutos. Si tengo que cortar verdura, perdí. ¿No tienen una opción tipo 'qué carajo como ahora'?"

**Acción:**
1. **Modo "express"**: filtrar todo recipes con prep_time > 10 min.
2. **Rutinas relámpago**: 5 min, 7 min, 10 min HIIT sin equipo.
3. **UI simplificada** modo "vista esencial": ocultar tooltips de macros, mostrar solo lo crítico.

---

### 04 · Javier Cárdenas (40, CDMX) — El sedentario crónico
**Persona:** ingeniero de software, trabaja 10h sentado, juega FIFA por las noches, paga Netflix pero "no paga gym".

**Flujo:**
- Onboarding: marca "no quiero ir al gym" y "no me gusta cocinar".
- Plan: ✅ Le sugiere recetas con horno. "No tengo horno".
- Rutina: ❌ Pide pesos rusos. "No tengo nada en casa".

**Fricciones:**
- 🐛 La pregunta "qué equipo tienes" en onboarding es **opcional y light**. Termina con plan asumiendo cosas.
- 🐛 No hay **modo cero equipo + cero cocina** que combine bodyweight + microondas + comprar listo.
- 🐛 Le sugiere "20 min cardio en bici". No tiene bici.

**Quote:**
> "Apps así me chocan. Asumen que tengo gym en casa, cocina equipada, y motivación. Yo solo tengo una microondas y un colchón."

**Acción:**
1. **Modo "vivienda mínima"**: bodyweight + microondas + supermercado (sin estufa, sin horno, sin pesas).
2. Pregunta dura en onboarding: "¿qué tienes en tu casa? Marca todo lo que aplica" (microondas / estufa / horno / mancuernas / nada).
3. Filtro estricto del plan según equipo declarado.

---

### 05 · Stephanie Yagual (22, Guayaquil) — Influencer wannabe
**Persona:** estudia comunicación, tiene 1.2k seguidores, se compara con Pamela Reif.

**Flujo:**
- Onboarding: pide "cuerpo de TikTok" en 3 semanas.
- Plan: la kcal le parece poco. Se queja en Instagram que la app "no funciona".
- Rutina: el motor le da rutina razonable. Ella la modifica para "ser más intensa".

**Fricciones:**
- 🐛 La app no ayuda a manejar expectativas de **transformación visual**.
- 🐛 Sin comparativas "lo que NO se puede hacer en 3 semanas" educativo.
- 🐛 Cuando registra RPE 10 en todo, la app le sugiere semana ligera. Se enoja: "yo NO quiero ligera".

**Quote:**
> "La app me dice que entrene MENOS. ¿Para qué descargué esto? Yo quería sufrir más."

**Acción:**
1. Educación pre-onboarding sobre fisiología y tiempos. "Tu cuerpo no es Photoshop".
2. Modo "exigente con criterio": el usuario puede saltarse el deload automático pero firma un disclaimer.
3. Mostrar fotos de progreso reales (no antes/después tipo Instagram) con timeline honesto.

---

### 06 · Renzo Quispe (35, Trujillo) — El monotonía total
**Persona:** comió pollo con arroz todos los días desde los 20. "Funciona, no toco".

**Flujo:**
- Onboarding: marca "alimentos que no me gustan": ❌ todo excepto pollo, arroz, plátano, huevo.
- Plan: la app intenta variar. Él rechaza recetas.
- Después de 5 sustituciones, todo el plan colapsa a las mismas 2 recetas en bucle.

**Fricciones:**
- 🐛 No hay **modo monotonía consciente**: la app insiste en variar cuando el usuario explícitamente NO quiere.
- 🐛 El motor podría aceptar "1 plato repetido 21 veces por semana" y solo calcular macros sobre eso.
- 🐛 Después de 5 substituted, el InsightsPage le dice "le cuesta seguir el plan". **Falso**. Sigue uno hecho a su medida.

**Quote:**
> "Yo no soy mañoso. Yo soy práctico. La app cree que no estoy comiendo bien por elegir lo mismo. Es al revés."

**Acción:**
1. **Modo monotonía**: el usuario marca "prefiero pocos platos repetidos" y la app no insiste en variar.
2. Cambiar la copy en pattern-engine: "frequently_substituted" no necesariamente es problema. Preguntar "¿quieres que reemplacemos?" como ya hace, pero SIN tono crítico.

---

### 07 · Antonella Romero (29, Rosario) — Vegetariana porque sí
**Persona:** dejó la carne hace 1 año "por moda". Sigue sin tolerar verduras.

**Flujo:**
- Onboarding: marca "vegetariana". Excluye casi todos los vegetales en el siguiente paso. ❌
- Plan: ❌ Imposible armar macros sin proteína animal Y sin vegetales.
- El sistema le da arroz + lentejas + tofu + pan integral. Le da arcadas con el tofu.

**Fricciones:**
- 🐛 No hay validación "tus restricciones + exclusiones dejan al motor sin opciones".
- 🐛 No hay sugerencia educativa: "para tu objetivo necesitas X, ¿podrías considerar tofu/legumbres?".
- 🐛 La app no le explica que "vegetariana sin verduras" es nutricionalmente difícil.

**Quote:**
> "La app me da legumbres. Yo odio las legumbres. ¿No hay nada vegetariano que no sean lentejas y tofu? Quiero pasta y queso."

**Acción:**
1. Validador de combinatorias imposibles: si restricciones reducen pool < N opciones → mostrar mensaje educativo.
2. Pool de recetas vegetarianas **sin tofu/legumbres** explícito (pasta + queso, pizza casera, omelette vegetariano).
3. Tooltip educativo sobre proteínas vegetales en onboarding.

---

### 08 · Brandon Pérez (19, Maracay) — Pizza y Red Bull
**Persona:** estudiante de ingeniería, jueves a domingo de fiesta, vive de delivery.

**Flujo:**
- Onboarding: rapidísimo, todo "auto".
- Plan: ✅ recibe plan saludable.
- Realidad: **cero adherencia**. La app capta 5% en 2 semanas.
- Mood: pone 5 todo el tiempo "estoy bien".

**Fricciones:**
- 🐛 Los patrones detectados son **falso negativo**: la app cree que está bien porque pone mood 5, pero su adherencia es 5%.
- 🐛 No hay **alerta de adherencia crítica** ("registraste 5% en 2 semanas, ¿quieres ajustar el plan a algo más realista?").
- 🐛 Bebe Red Bull. La app no advierte sobre cafeína extrema.

**Quote:**
> "La app está bonita pero yo no la uso, hermano. Me dice 'come avena' y yo como pizza. ¿Quién gana?"

**Acción:**
1. Detector de **adherencia crítica** (< 20% por 2 semanas) → modal "ajustemos al plan que tu vida real puede sostener".
2. Tracking de bebidas energizantes con disclaimer suave.
3. Modo "vida nocturna": ajuste de plan para quienes sobreviven 4 noches/semana.

---

### 09 · Mariangela Solís (37, San José) — La probadora serial de dietas
**Persona:** keto, paleo, dukan, ayuno 16/8, ayuno 20/4, smoothie cleanse, alkaline, anti-inflamatoria. En 2 años.

**Flujo:**
- Onboarding: experta autoproclamada. Cuestiona cada pregunta.
- Plan: lo critica todo. "Esto NO es keto puro". "Los carbos no deberían estar".
- Cambia de objetivo 3 veces en una semana.

**Fricciones:**
- 🐛 La app no maneja **cambios frecuentes de objetivo** (regenera todo cada vez perdiendo histórico de adherencia).
- 🐛 Sin advertencia "cambias mucho de objetivo, ¿quieres un plan que respete tu ritmo en lugar de cambiar tan rápido?".
- 🐛 No hay disclaimer sobre dietas extremas que ella podría intentar imponer al usar la app.

**Quote:**
> "Yo sé más que la mayoría de nutricionistas. La app no me ofrece keto cetogénico puro. Esto es básico."

**Acción:**
1. Lock soft de objetivo: cambiar más de 2 veces en 30 días → modal "¿estás segura? Cambios frecuentes te alejan del progreso".
2. Disclaimer si declara dietas extremas previas: "esta app no implementa keto puro ni ayunos extremos por seguridad clínica".

---

### 10 · Pablo Astorga (45, Santiago) — El de las cervezas
**Persona:** ejecutivo, almuerza con clientes (vino), cena con socios (cerveza). Le encanta el carrete.

**Flujo:**
- Onboarding: NO marca "alcohol frecuente" (no hay opción).
- Plan: ✅ recibido.
- Hidratación: tap'ea 0 vasos por día. "El agua sabe a nada".

**Fricciones:**
- 🐛 No hay campo **alcohol semanal** en onboarding.
- 🐛 Sin contexto, el motor le da kcal sin descontar las cervezas (~200 kcal cada una × 4 = 800 kcal/día solo en alcohol).
- 🐛 Promedio de 0 vasos/día. El validador no flaggea esto.

**Quote:**
> "Mi déficit es perfecto en la app. Bajo cero kg. ¿Por qué? Ah, sí. La cerveza."

**Acción:**
1. Pregunta "¿bebes alcohol? ¿Con qué frecuencia?" en onboarding.
2. Si alcohol > 3 días/sem → ajustar target_kcal automáticamente o mostrar advertencia.
3. Si water_avg_glasses < 2/día por 1 semana → flag en revisión semanal.

---

### 11 · Vanessa Morales (26, Caracas → Madrid) — La migrante en mercado raro
**Persona:** llegó a Madrid hace 6 meses. Extraña la comida venezolana.

**Flujo:**
- Onboarding: marca "Caribeña/Venezolana" como cocina favorita. Marca "yuca, plátano, casabe" como favoritos.
- Plan: ❌ La app le sugiere recetas con yuca. **No la encuentra en supermercados españoles.**

**Fricciones:**
- 🐛 La app no tiene **noción de disponibilidad por región actual** (vs región declarada).
- 🐛 La lista de compras incluye "plátano macho" → en Madrid lo encuentras pero como "plátano de freír", confunde.
- 🐛 Sin sustituciones automáticas regionales ("yuca → boniato/papa similar").

**Quote:**
> "Pongo Madrid como ubicación pero la app me sugiere encebollado. ¿De dónde saco el plátano verde? Yo extraño mi tierra, pero el supermercado de aquí no tiene."

**Acción:**
1. Campo "país actual" + "región de origen culinario" separados.
2. Reemplazos automáticos por disponibilidad ("yuca → boniato si país=España").
3. Pool internacional con sustituciones documentadas.

---

### 12 · Cristhian Maradiaga (33, Tegucigalpa) — Falso atleta
**Persona:** hace 20 lagartijas y 30 abdominales 3 veces por semana. Se considera "atleta".

**Flujo:**
- Onboarding: marca "advanced".
- Plan: ❌ La app le da rutina seria con compound lifts. Se asusta.

**Fricciones:**
- 🐛 El motor le toma la palabra "advanced" sin validar con tests de fuerza objetivos.
- 🐛 No hay **test de auto-evaluación** rápida (¿cuántas lagartijas haces sin parar? ¿cuánto pesas en banca?).
- 🐛 Le sugiere RPE 7-8 en peso muerto. **Riesgo de lesión** sin técnica.

**Quote:**
> "Yo dije advanced y me dio una rutina como de gym. Yo no piso un gym. Pero soy avanzado en mis cosas."

**Acción:**
1. Test corto de fitness real en onboarding: 3-4 preguntas objetivas (cuántas lagartijas seguidas, plancha aguanta, cuántos burpees en 1 min).
2. Recalibrar "advanced" basado en respuestas, no en autodeclaración.
3. Videos de técnica obligatorios antes de logear ejercicios riesgosos por primera vez.

---

### 13 · Yuliana Restrepo (24, Cali) — Glúteo sin esfuerzo
**Persona:** quiere "bunda como Anitta", odia las sentadillas.

**Flujo:**
- Onboarding: goal=gain (músculo), focus=glúteos.
- Rutina: ❌ Le da sentadillas, peso muerto. "No, eso duele".

**Fricciones:**
- 🐛 No hay **focus de zona corporal** en el generador de rutinas.
- 🐛 No hay alternativas anti-dolor: hip thrust, glute bridge, kickback, abducción.
- 🐛 La app no le explica que **el glúteo crece con sentadilla y peso muerto**, no hay atajo.

**Quote:**
> "Quiero bunda pero sin que me duela el cuádriceps. Sin sentadillas. Y en 1 mes."

**Acción:**
1. Focus muscular específico en routine-generator (glute / chest / arm focus).
2. Pool con **ejercicios isolation** para principiantes que rechazan compound (hip thrust, glute bridge, machine).
3. Pantalla educativa: "el glúteo crece así (foto de hip thrust y squat). No hay atajo. ¿Empezamos suave?".

---

### 14 · Mathías Cáceres (21, Asunción) — "Salud es mañana"
**Persona:** universitario, fuma media cajetilla, toma viernes y sábado, vive con amigos.

**Flujo:**
- Onboarding: agresivo. Marca "no me importa".
- Plan: ⚠️ recibido pero sin contexto de su estilo de vida.
- Cuando registra mood: pone 4-5 incluso después de noches de fiesta. Crónicamente cansado.

**Fricciones:**
- 🐛 No hay pregunta sobre **tabaco/alcohol regular** (no como adicción, como rutina social).
- 🐛 La app no detecta el **patrón estudiantil**: bajos los lunes, altos los viernes.
- 🐛 Sin "modo gentil" que respete que su prioridad es vida social, no fitness.

**Quote:**
> "Tengo 21. Vivo de noche. No voy a dejar de fumar ni de salir. Si la app no entiende eso, la borro."

**Acción:**
1. Pregunta de **estilo de vida** en onboarding: estudiante / oficinista / freelance / mamá-papá / jubilado / atleta.
2. Por perfil "estudiante con vida social": kcal más flexibles los fines de semana + recovery focus los lunes.
3. Nunca lecturas morales sobre tabaco/alcohol. Tracking opcional, sin juicio.

---

### 15 · Génesis Alvarado (30, San Salvador) — Reina del detox
**Persona:** convencida que los smoothies verdes "limpian". Toma 3 al día, no come sólido hasta las 8pm.

**Flujo:**
- Onboarding: marca múltiples restricciones falsas ("sin gluten", "sin lactosa", aunque no es alérgica).
- Plan: ⚠️ recibido pero ella reemplaza todo por smoothies.
- Después de 2 semanas: mood baja, energía baja.

**Fricciones:**
- 🐛 No hay disclaimer sobre **dietas restrictivas sin razón médica**.
- 🐛 La revisión semanal no detecta el patrón "energy_average bajando + mood bajando = posible undereating".
- 🐛 Sin mensaje "una dieta líquida sostenida no es saludable, ¿quieres ayuda?".

**Quote:**
> "Los smoothies verdes limpian mi cuerpo. Lo dijo mi influencer favorita."

**Acción:**
1. Disclaimer en onboarding sobre dietas restrictivas: "marcar restricciones falsas afecta tu plan. ¿Es alergia médica?".
2. Detector en review-engine: si energía + mood bajan 2 semanas seguidas y kcal son bajas → flag "¿estás comiendo suficiente?".
3. Mensaje educativo (no clínico): "el cuerpo se 'limpia' solo con hígado y riñones, no hay 'detox' nutricional".

---

### 16 · Luis Miguel Sánchez (43, Monterrey) — El "yo sé más que tú"
**Persona:** broker, se inyectó testosterona sin médico. Lee blogs en inglés y se cree experto.

**Flujo:**
- Onboarding: lo llena rápido y cuestiona.
- Plan: critica todo. "Mi nutricionista de Instagram dice que carb timing es lo importante".
- Cambia su target_kcal manualmente en perfil de 2200 a 4000.

**Fricciones:**
- 🐛 La app **permite ediciones manuales** de target_kcal sin validación.
- 🐛 Sin advertencia "tu target editado está fuera del rango seguro para tu perfil".
- 🐛 No hay info sobre cómo PulseFit difiere de "consejos de Internet".

**Quote:**
> "Yo subí mi kcal a 4000 porque estoy haciendo bulk con T. La app debería ajustarse a mí, no yo a ella."

**Acción:**
1. Lock soft de target_kcal manual: si > +500 vs calculado → confirm dialog con disclaimer.
2. Modo "experto autodeclarado": el usuario firma que asume riesgo de modificar parámetros.
3. Pantalla "Por qué los números de PulseFit son seguros vs influencers" con bibliografía.

---

### 17 · Camila Sepúlveda (27, Medellín) — Confusión clásica
**Persona:** quiere "tonificada pero sin músculo" — confusión típica.

**Flujo:**
- Onboarding: goal=lose pero también dice "no quiero perder mi figura".
- Plan: déficit normal.
- Rutina: pesos. Se asusta cuando le ofrecen 8 kg en mancuernas. "Eso me pone musculoso".

**Fricciones:**
- 🐛 No hay pantalla educativa sobre el mito "pesos = volumen".
- 🐛 Sin diferenciación "fuerza vs hipertrofia" comprensible para no-iniciada.
- 🐛 Los logros de "primer PR" la asustan en lugar de motivar.

**Quote:**
> "Yo quería tonificación. La app me hace levantar pesas. Voy a parecer fisicoculturista."

**Acción:**
1. Pantalla de mitos comunes en onboarding: "¿Las pesas me ponen musculoso?" → "No para mujeres sin esteroides".
2. Renombrar "Subir carga" → "Te volviste más fuerte" para mujeres que reportan miedo a volumen.
3. Mostrar fotos reales de mujeres entrenando con pesas (no fisicoculturistas).

---

### 18 · Mauricio Tapia (38, Iquique) — El que cree que ejercicio engorda
**Persona:** lee artículos pseudocientíficos. Está convencido que "el ejercicio te da hambre y engordas".

**Flujo:**
- Onboarding: marca goal=lose. Marca "no quiero hacer ejercicio".
- Plan: ⚠️ La app respeta su preferencia y arma plan solo nutricional. Pero falta contexto educativo.

**Fricciones:**
- 🐛 La app **no le explica** que el ejercicio aporta más allá de kcal (composición corporal, salud cardiovascular, ánimo).
- 🐛 Sin opción "movimiento ligero, no estructurado" (caminar 10 min, subir escaleras).
- 🐛 Después de 4 semanas sin ejercicio + déficit, va a perder músculo. La app no advierte.

**Quote:**
> "Yo bajo solo con dieta. El ejercicio me da hambre y como más. Lo leí."

**Acción:**
1. Sección educativa en onboarding sobre rol del ejercicio (no solo kcal).
2. Modo "movimiento sin ejercicio": logear caminata + subir escaleras + bailar como NEAT.
3. Disclaimer si dieta sin ejercicio > 4 semanas: "perder peso sin entreno suele perder músculo, ¿quieres revisar?".

---

### 19 · Brigitte Mejía (31, Punta Cana) — La bailarina
**Persona:** baila bachata 4 horas, 4 veces/semana. Considera que es "su entrenamiento".

**Flujo:**
- Onboarding: marca "5+ veces/semana ejercicio".
- Plan: ✅ recibido con muchas kcal.
- Rutina: ❌ ni la abre. "Yo bailo".

**Fricciones:**
- 🐛 No hay tipo de workout **"baile / danza"** como categoría.
- 🐛 Sin estimación de kcal para baile (variable según intensidad).
- 🐛 Cuando logea "0 entrenamientos" la app le dice "vamos a entrenar más". **Falso negativo**: ella SÍ se mueve.

**Quote:**
> "Yo bailo bachata cuatro horas. Es mi cardio, mis abdominales y mi alma. La app me dice que no entrené."

**Acción:**
1. Tipo de actividad **"deporte/baile/movimiento estructurado"** con duración + intensidad (1-5).
2. Estimación de kcal gastadas en categorías de actividad.
3. Si declara actividad regular fuera del plan: contarlo como adherencia a workout.

---

### 20 · Diego Hernández (42, Veracruz) — El que no se ve gordo
**Persona:** 110 kg, mide 1.65. **IMC 40.4 (obesidad clase III)**. Dice "no estoy gordo, soy ancho de huesos".

**Flujo:**
- Onboarding: marca peso 110, altura 1.65. Goal: **maintain** ("estoy bien así").
- Plan: app calcula para mantener. Le da 3200 kcal.
- Mood: marca 5 siempre. "Estoy bien".

**Fricciones:**
- 🐛 Con IMC 40+ y goal=maintain, **la app no sugiere nada**. No hay disclaimer sobre obesidad clase III.
- 🐛 El motor respeta su goal pero **a la salud le importa**.
- 🐛 No hay invitación honesta y respetuosa: "tu peso actual tiene riesgo cardiovascular, ¿te interesaría apuntar a bajar 10 kg en 6 meses?".

**Quote:**
> "Mi familia toda es ancha. Genético. La app está bien, me deja en paz."

**Acción:**
1. Si IMC > 35 + goal=maintain → mensaje educativo respetuoso (NO patologizante): "¿sabías que reducir 5-10% del peso reduce riesgo cardio significativamente? Sin presión, solo info".
2. Logros adaptados: "bajar 1 kg" en lugar de "perder 5%".
3. Validación médica recomendada antes de plan para IMC > 35.

---

## 🔭 Hallazgos cross-tester v2

### A. PROBLEMA #1: Expectativas vs realidad

**Pasó 8 veces:** Karla, Stephanie, Yuliana, Camila, Mauricio, Génesis, Mariangela, Luis Miguel quieren milagros o tienen creencias falsas.

**Acción:** Pantalla educativa pre-plan que normaliza:
- Tiempos reales (0.5-1% peso por semana, no 10 kg/mes).
- Composición corporal vs balanza.
- Pesas no = músculo monstruoso (para mujeres).
- "Detox", "carb timing", "metabolismo lento" no existen como las describe Instagram.

### B. PROBLEMA #2: Vagos pero quieren resultados

**Pasó 10 veces:** Karla, Daniela, Javier, Stephanie, Brandon, Antonella (con su comida), Yuliana, Mathías, Camila, Mauricio.

**Acción:** Modo **"mínimo viable"** del plan:
- 2 comidas vs 4
- Recetas de 5-10 min máximo (microondas + supermercado)
- Rutina de 5 min anti-excusas
- 0 vasos de agua → flag suave, no juicio

### C. PROBLEMA #3: Mañoseo extremo en comida

**Pasó 7 veces:** Renzo (solo pollo+arroz), Antonella (sin verde), Brandon (pizza), Génesis (smoothies), Hugo del v1 anterior, Camila, Pablo (alcohol no-comida).

**Acción:**
- Modo monotonía consciente (1 plato repetido sin queja del sistema).
- Pool vegetariano sin tofu/legumbres.
- Reconocer alcohol como ingesta calórica.
- Diferenciar "preferencia personal" vs "patrón problemático".

### D. PROBLEMA #4: Vagos en entrenamiento (rechazo activo)

**Pasó 9 veces:** Karla, Daniela, Javier, Yuliana, Mathías, Camila, Mauricio, Brigitte, Diego.

**Acción:**
- Tipo de actividad **deporte/baile/movimiento estructurado**.
- Rutinas relámpago (5 / 7 / 10 min).
- Focus muscular específico (glúteo, brazo, core) sin compound obligatorio.
- "Modo movimiento" para los anti-gym puros.

### E. PROBLEMA #5: Falta educación inline

**Pasó en todos:** ninguno entendió "RPE", varios cuestionaron por qué su kcal era X, Camila tuvo miedo a "tonificarse con pesas", Mauricio creyó que ejercicio engorda.

**Acción:**
- Tooltip educativo inline (no solo `InfoTooltip` que requiere tap).
- Pantalla didáctica entre onboarding y plan: "Aquí están tus números. Esto significa...".
- Mitos comunes desarmados con humor compasivo.

### F. PROBLEMA #6: Retención / abandono silencioso

**Pasó 5 veces:** Bryan (abandonó día 5), Brandon (5% adherencia), Karla (3 semanas), Mathías (vida social gana), Mariangela (cambió 3 veces de objetivo).

**Acción:**
- **Detector de abandono**: > 3 días sin abrir → email/notif compasiva.
- **Detector de adherencia crítica**: < 20% en 2 semanas → "¿quieres ajustar a algo más realista?".
- **Progress hacia logros**: mostrar "te falta 1 día" para incentivar.
- Lock soft de cambios de objetivo (> 2 en 30 días).

### G. PROBLEMA #7: Estilos de vida no contemplados

**Pasó 6 veces:** Pablo (alcohol social), Mathías (fiesta universitaria), Brandon (delivery), Daniela (mamá 15 min), Javier (cero equipo), Vanessa (migrante mercado raro).

**Acción:** Pregunta de **estilo de vida** en onboarding:
- Estudiante con vida social
- Oficinista sedentario
- Mamá/papá con tiempo cero
- Freelance flexible
- Migrante (país actual ≠ origen)

Cada perfil pre-configura defaults sensatos.

---

## 📊 Métricas v2 de la simulación

| Métrica | v1 (foco seguridad) | **v2 (foco retención)** |
|---|---|---|
| Testers completaron onboarding | 85% | **70%** |
| Testers generaron plan | 75% | **80%** |
| Testers completaron ≥1 entrenamiento | 55% | **35%** ⚠️ |
| Testers llegaron a revisión semanal | 40% | **20%** ⚠️ |
| Testers **abandonaron en 7 días** | 25% | **45%** ⚠️ |
| Adherencia promedio a 14 días | N/A | **22%** ⚠️ |
| Testers que pidieron "modo más fácil" | N/A | **14/20** |
| Testers que querían **milagros (transformación en < 1 mes)** | N/A | **9/20** |
| NPS simulado | -10 | **-22** ⚠️ |

**El problema de v2 NO es seguridad — es retención y educación.** Los testers están vivos y seguros, pero la mayoría no llega a la semana 3.

---

## 🎯 Plan de mejoras priorizado v2

### 🚨 Sprint 11.5 — Educación + Anti-Fricción (5-7 días)

**Objetivo:** que un Bryan tipo no abandone en día 5.

1. **Pantalla didáctica pre-plan** (P1, P5): explicar tiempos reales y limits físicos antes del primer plan generado. 3 slides con educación + disclaimers compasivos.

2. **Modo Mínimo Viable** (P2): toggle "configuración rápida" en onboarding:
   - Solo 3 preguntas: objetivo + tiempo disponible + restricciones críticas
   - Default a "modo express": 2 comidas + recetas 10 min + rutina 5 min
   - Skip todo lo demás

3. **Pregunta de estilo de vida** (P7): nuevo paso en onboarding con 5-6 opciones preconfigured (estudiante / oficinista / mamá-papá / freelance / migrante / atleta amateur).

4. **Tipo de actividad expandido** (P4): no solo gym/casa. Agregar "deporte/baile/movimiento" como categoría con duración + intensidad.

5. **Detector de abandono + adherencia crítica** (P6):
   - 3 días sin abrir → notif compasiva
   - < 20% adherencia 2 semanas → modal "ajustemos plan"
   - Progress hacia logro visible

### 🟠 Sprint 11.6 — Combatir milagros y mañoseo (1-2 semanas)

6. **Educación de mitos** (P5): cards desarmando mitos comunes ("pesas ponen musculoso", "ejercicio engorda", "smoothies limpian", "carb timing crítico"). Tono compasivo, no condescendiente.

7. **Modo monotonía consciente** (P3): respeta usuarios que prefieren pocos platos repetidos sin marcarlos como "problema".

8. **Pool vegetariano sin tofu/legumbres** (P3): pasta + queso, pizza casera, omelette, sandwich integral.

9. **Pregunta alcohol y tabaco** (P3, P7): no como adicción, como rutina social. Sin juicio.

10. **Focus muscular específico** (P4): glúteo / brazo / core sin compound obligatorio (con disclaimer educativo "compound es más eficiente, pero estos también funcionan").

### 🟡 Sprint 11.7 — Refinamientos (2-3 semanas)

11. **Wake Lock + Notifications** para cronómetro de sesión.

12. **Test de fitness objetivo** en onboarding para no confiar 100% en autodeclaración (12 lagartijas / plancha 30s / 100 m corriendo).

13. **Disclaimers de IMC alto + goal=maintain** (caso Diego): mensaje educativo respetuoso, no patologizante.

14. **Sustitución regional** para migrantes (yuca ↔ boniato, plátano verde ↔ ...).

15. **Validación de target_kcal manual**: si edita > +500 vs calculado → disclaimer.

---

## 🎓 Conclusiones de la simulación v2

### El insight más doloroso
**El producto está pensado para alguien paciente con base mínima. El usuario real es impaciente sin base.**

Las 11 fases construyen un sistema robusto, ético y bien arquitecturado, pero asumen un usuario que:
- Lee tooltips
- Pacientemente espera 12 semanas de progreso
- Entiende RPE, macros, déficit calórico
- Tiene equipo mínimo y disposición a cocinar
- Tiene contexto cultural (LATAM general)

**El usuario real (target de mercado):**
- No lee tooltips
- Espera resultados en 2-3 semanas
- No sabe qué es RPE
- Quiere comer pizza y bajar peso
- Su "ejercicio" es bailar bachata
- Es migrante, estudiante, mamá sin tiempo, ejecutivo bebedor

### Recomendación

**Sprint 11.5 NO es opcional para arrancar beta.**

Sin él, los 30 testers reales del BETA_GUIDE.md van a:
- 45% abandonar antes del día 7
- 80% antes del día 14
- NPS proyectado: -20 a -30

**Con Sprint 11.5 (educación + anti-fricción), proyección razonable:**
- Día 7: 70% activos
- Día 14: 50% activos
- Día 30: 35% activos
- NPS: +10 a +20

### El cambio mental necesario

La app ya es compasiva en lenguaje. Pero la compasión también es:
- **No exigir que el usuario lea** para entender.
- **No asumir** que sabe nutrición básica.
- **No castigarlo** por preferir pollo y arroz.
- **No abandonarlo** si no abre la app 3 días.
- **Respetar** que su vida real es la prioridad, no su plan fitness.

Cambiar de "compasivo en palabras" → **"compasivo en arquitectura"**.

---

## 💬 Las 3 quotes más demoledoras

**Bryan** (28, Lima):
> "Esto es como todas las demás. Empiezas con ganas, te aburres, lo cierras. **¿En qué se diferencia esta?**"

**Brandon** (19, Maracay):
> "La app está bonita pero yo no la uso, hermano. Me dice 'come avena' y yo como pizza. **¿Quién gana?**"

**Daniela** (32, Bogotá):
> "Necesito comer en 5 minutos. Si tengo que cortar verdura, perdí. **¿No tienen una opción tipo 'qué carajo como ahora'?**"

Esas 3 preguntas — *"¿en qué se diferencia?"*, *"¿quién gana?"*, *"¿qué carajo como ahora?"* — definen el Sprint 11.5.

---

🌿 *Compasión en palabras ya tenemos. Falta compasión en arquitectura.*
