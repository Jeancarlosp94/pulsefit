# 📋 Prompt Fase 11 — Detección de patrones avanzada y preparación para beta

> Pega este prompt a Claude Code después de haber completado Fase 10 y validado.
>
> Esta es la **última fase automatizable**. La Fase 12 (beta cerrada con usuarios reales) requiere intervención humana.

---

## INSTRUCCIÓN PARA CLAUDE CODE

Antes de empezar, lee:
1. `pulsefit-skill/SKILL.md`
2. `pulsefit-skill/MEMORY.md`
3. `pulsefit-skill/references/sistema-rescates.md` (sección detección de patrones)
4. Todos los `PHASE_<N>_REPORT.md` previos
5. La estructura completa del proyecto

---

## REGLAS DE OPERACIÓN

1. Detección de patrones es **observación**, no diagnóstico.
2. Aplicar cambios solo con aprobación explícita del usuario.
3. Lenguaje compasivo en cada insight presentado.
4. Tests rigurosos: esta fase impacta directamente en la experiencia futura del usuario.
5. Convenciones inviolables.

---

## OBJETIVO DE LA FASE 11

Implementar el motor avanzado de detección de patrones que aprende del usuario en el tiempo. Identifica preferencias implícitas, comportamientos recurrentes y oportunidades de mejora que se proponen suavemente al usuario. Además, deja el proyecto **listo para beta cerrada** con usuarios reales.

---

## TAREAS

### Tarea 1 — Estructura del motor avanzado

`src/features/pattern-engine/`:

```
├── index.ts
├── meal-patterns.ts            # patrones en comportamiento alimentario
├── workout-patterns.ts         # patrones en entrenamiento
├── temporal-patterns.ts        # patrones temporales (días, horas)
├── wellbeing-patterns.ts       # correlaciones bienestar
├── recommendation-builder.ts   # construye sugerencias suaves
├── insight-prioritizer.ts      # ordena insights por relevancia
├── types.ts
└── *.test.ts
```

### Tarea 2 — Patrones de comida

`meal-patterns.ts`:

```ts
export const detectMealPatterns = async (userId: string): Promise<ItfMealPattern[]> => {
   const patterns: ItfMealPattern[] = []

   // 1. Comidas favoritas (registradas como completadas 5+ veces)
   const favorites = await detectFavoriteMeals(userId)
   patterns.push(...favorites.map(m => ({ type: 'favorite_meal', data: m })))

   // 2. Comidas rechazadas (sustituidas 3+ veces)
   const rejected = await detectRejectedMeals(userId)
   patterns.push(...rejected.map(m => ({ type: 'rejected_meal', data: m })))

   // 3. Tipos de comida saltados (ej: siempre saltea desayuno)
   const skipped = await detectSkippedMealTypes(userId)
   patterns.push(...skipped.map(s => ({ type: 'skipped_meal_type', data: s })))

   // 4. Patrón de "no quiero cocinar" (3+ veces/sem)
   const noCooking = await detectNoCookingPattern(userId)
   if (noCooking) patterns.push({ type: 'avoids_cooking', data: noCooking })

   // 5. Comer fuera frecuente (5+ veces/mes)
   const eatingOut = await detectEatingOutPattern(userId)
   if (eatingOut) patterns.push({ type: 'frequent_dining_out', data: eatingOut })

   // 6. Preferencias por hora (ej: registra cenas más tarde)
   const timing = await detectMealTiming(userId)
   patterns.push(...timing)

   return patterns
}
```

### Tarea 3 — Patrones de entrenamiento

`workout-patterns.ts`:

```ts
export const detectWorkoutPatterns = async (userId: string): Promise<ItfWorkoutPattern[]> => {
   // 1. Días con mayor adherencia vs días con menor
   // 2. Ejercicios que progresan rápido vs estancados
   // 3. Ejercicios que el usuario reemplaza recurrentemente
   // 4. Patrón de "no tengo energía" en días específicos
   // 5. Correlación duración vs adherencia (¿prefiere sesiones cortas?)
   // 6. Equipamiento más usado vs ignorado
}
```

### Tarea 4 — Patrones temporales

`temporal-patterns.ts`:

```ts
export const detectTemporalPatterns = async (userId: string): Promise<ItfTemporalPattern[]> => {
   // 1. Día de la semana con menor adherencia (sugerir mover entrenamiento)
   // 2. Hora del día más activa
   // 3. Periodos de inactividad (vacaciones detectadas?)
   // 4. Estacionalidad (si tienes meses de datos)
}
```

### Tarea 5 — Patrones de bienestar

`wellbeing-patterns.ts`:

```ts
export const detectWellbeingPatterns = async (userId: string): Promise<ItfWellbeingPattern[]> => {
   // 1. Correlación: ¿ánimo es mejor los días que entrena?
   // 2. Correlación: ¿energía mejor con N horas de sueño?
   // 3. Correlación: ¿hidratación con energía?
   // 4. Tendencia: ¿ánimo subiendo/bajando en últimas 4 semanas?
   // 5. Detección de patrón compensatorio (más ejercicio + menos comida sostenido)
}
```

### Tarea 6 — Constructor de recomendaciones

`recommendation-builder.ts`:

Convierte patrones detectados en sugerencias accionables y compasivas:

```ts
export const buildRecommendations = (patterns: ItfPattern[]): ItfRecommendation[] => {
   return patterns.map(pattern => {
      switch (pattern.type) {
         case 'rejected_meal':
            return {
               severity: 'low',
               message: `Notamos que ${pattern.data.mealName} no te ha convencido. ¿Quieres que la reemplacemos por algo distinto? 🌱`,
               action: { type: 'replace_meal', mealId: pattern.data.id }
            }
         case 'avoids_cooking':
            return {
               severity: 'medium',
               message: 'Vemos que cocinar no es lo tuyo esta temporada. ¿Probamos un plan con comidas rápidas (max 15 min)? 🌿',
               action: { type: 'simplify_cooking', maxPrepTime: 15 }
            }
         case 'low_adherence_day':
            return {
               severity: 'medium',
               message: `Los ${pattern.data.dayName} te cuestan más. ¿Movemos tu entrenamiento a otro día? 🤝`,
               action: { type: 'move_workout_day', from: pattern.data.dayName }
            }
         case 'compensatory_pattern_detected':
            return {
               severity: 'high',
               message: 'Notamos que estás aumentando el ejercicio mientras reduces comida. Vale la pena revisar esto con un profesional. ¿Te ayudamos a buscar uno? 🌿',
               action: { type: 'show_professional_resources' }
            }
         // ...
      }
   })
}
```

### Tarea 7 — Priorizador de insights

`insight-prioritizer.ts`:

```ts
export const prioritizeInsights = (recommendations: ItfRecommendation[]): ItfRecommendation[] => {
   // Orden:
   // 1. Severity high (banderas rojas, patrones compensatorios)
   // 2. Severity medium con impacto en adherencia
   // 3. Severity low (preferencias menores)
   // 
   // Limita a 3-5 insights por revisión semanal para no abrumar.
}
```

### Tarea 8 — Integración con revisión semanal

Modificar Edge Function `weekly-review/index.ts` (de Fase 10):

- Después de calcular ajustes, llamar al motor de patrones.
- Construir recomendaciones priorizadas.
- Incluirlas en el JSON de la review como sección "Lo que notamos sobre ti esta semana".
- Pasar a IA para que las narre con tono cálido (validación posterior).

### Tarea 9 — Pantalla "Lo que sabemos sobre ti"

`src/pages/profile/InsightsPage.tsx` (accesible desde perfil):

Muestra al usuario qué patrones la app ha detectado:

```
[Sección: Tus preferencias detectadas]
  - "Te gustan estas comidas: [lista de favoritas]"
  - "Estos días entrenas mejor: [lista]"
  - "Tu hora más activa: 7-8pm"

[Sección: Tu progreso emocional]
  - "Tu ánimo es 20% mejor los días que entrenas"
  - "Duermes mejor cuando registras antes de las 10pm"

[Sección: Sugerencias actuales]
  - Insights priorizados con botones de acción
```

**Importante:** transparencia total. El usuario ve qué se detectó y puede borrar / corregir / desactivar tracking.

### Tarea 10 — Configuración de privacidad

En `ProfilePage.tsx` agregar sección "Privacidad y datos":

- Toggle "Detección de patrones": activar/desactivar.
- Botón "Exportar mis datos" (descarga JSON con todo).
- Botón "Borrar mis insights detectados" (resetea pattern_insights).
- Botón "Eliminar mi cuenta" (con confirmación de doble factor).

### Tarea 11 — Documentación de privacidad

Crear `client-pulsefit/public/privacy-policy.md` y `terms-of-service.md`:

- Qué datos recolectamos.
- Cómo se usan.
- IA: qué se envía a Groq y qué no (datos anonimizados, sin nombre/email).
- Retención de datos.
- Derecho a borrar.
- Contacto.

Linkearlos en footer de auth pages y en perfil.

### Tarea 12 — Performance audit

Antes de cerrar el proyecto:

- Lighthouse audit en todas las pantallas principales: PWA 100, Performance > 90, Accessibility > 90, Best Practices > 90.
- Bundle size analysis: identificar imports innecesarios.
- Lazy loading de rutas pesadas (Recharts, Playwright tests).
- Service worker estrategias verificadas.
- Cobertura de tests global > 80%.

### Tarea 13 — Documentación final

Crear/actualizar:

- `README.md` completo con: descripción del producto, stack, setup local en 10 min, comandos disponibles, contribuir.
- `DEVELOPMENT.md` (este es el SKILL.md adaptado): convenciones, flujo, decisiones.
- `ARCHITECTURE.md`: diagramas de arquitectura, flujo de datos, decisiones clave.
- `BETA_GUIDE.md`: guía para correr beta cerrada con 30 usuarios (Fase 12, manual).

### Tarea 14 — Preparación para beta

Crear documento `BETA_GUIDE.md` con:

#### Pre-requisitos
- Lista de servicios externos a tener configurados en producción.
- Verificación de free tiers (Supabase, Vercel, Groq).
- Política de privacidad publicada.

#### Selección de testers
- Criterios sugeridos: 30 personas con diversidad de edad, género, experiencia previa con apps fitness.
- Mínimo 5 que hayan abandonado apps similares antes (para validar que PulseFit retiene mejor).

#### Onboarding de testers
- Email de bienvenida con link a la app.
- Disclaimer claro: "Esto es beta, espera bugs".
- Canal de feedback: Discord, Slack, formulario, o el que decidas.

#### Métricas a trackear durante beta
- Día 7: % activos.
- Día 14: % activos.
- Día 30: % activos (objetivo: > 50%).
- Uso de rescates: % de usuarios que usaron al menos 1 (objetivo: > 70%).
- Tasa de fallback de IA: < 5%.
- NPS general: pregunta semanal.
- Bugs reportados: categorizar por severidad.

#### Iteración
- Sprint semanal de fixes basado en feedback.
- Priorización: bugs críticos > UX dolores > features pedidas.

#### Cierre de beta
- Compilación de aprendizajes.
- Decisión: ¿lanzar público o seguir iterando?

### Tarea 15 — Checklist final del proyecto

Verifica antes de cerrar:

**Funcionalidad**
- [ ] Todas las fases (4-11) completas.
- [ ] Onboarding funcional.
- [ ] Generación de comidas funcional.
- [ ] Generación de rutinas funcional.
- [ ] Sistema de rescates funcional.
- [ ] Revisión semanal funcional.
- [ ] Detección de patrones funcional.
- [ ] Logros funcional.
- [ ] Modo offline funcional.

**Calidad técnica**
- [ ] TypeScript strict, cero `any` no justificado.
- [ ] Cobertura tests > 80% global.
- [ ] Lighthouse > 90 en todas las métricas.
- [ ] CI/CD funcional.
- [ ] Cero warnings en build.

**Producto**
- [ ] Lenguaje compasivo en TODA la app (auditoría completa).
- [ ] Mobile-first verificado.
- [ ] Modo oscuro impecable.
- [ ] Accesibilidad WCAG AA.
- [ ] PWA instalable iOS y Android.
- [ ] Política privacidad y términos publicados.

**Operacional**
- [ ] Variables de entorno producción documentadas.
- [ ] Supabase production project configurado.
- [ ] Vercel deploy automático.
- [ ] Groq API key en secretos.
- [ ] PostHog y Sentry configurados.
- [ ] Backups de Supabase configurados.

**Documentación**
- [ ] README.md completo.
- [ ] DEVELOPMENT.md actualizado.
- [ ] ARCHITECTURE.md.
- [ ] BETA_GUIDE.md.
- [ ] Privacy policy y terms.
- [ ] CHANGELOG con todas las fases.

---

## CHECKPOINT FINAL — PROYECTO COMPLETO

```
✅ PROYECTO PULSEFIT COMPLETADO — Listo para Fase 12 (Beta cerrada)

🎉 Has terminado las 11 fases automatizables del proyecto.

Resumen ejecutivo:
- [Líneas explicando qué se construyó en total]
- [Tecnologías usadas]
- [Métricas finales: cobertura tests, Lighthouse, etc.]
- [Costos operativos proyectados: $0 esperado en MVP]

📄 Reportes generados: PHASE_4 a PHASE_11 + FINAL_REPORT.md

📋 Documentación: README.md, DEVELOPMENT.md, ARCHITECTURE.md, BETA_GUIDE.md

🚀 Siguiente paso: Fase 12 — Beta cerrada con usuarios reales

Lee `BETA_GUIDE.md` para los siguientes pasos. Esta fase NO es
automatizable: requiere reclutar testers, recoger feedback,
iterar manualmente.

Lo que tu app puede hacer ahora:
✓ Onboarding con cálculos validados nutricionalmente.
✓ Genera planes de comidas únicos con IA + APIs validadas.
✓ Genera rutinas únicas con IA + reglas biomecánicas.
✓ Adapta en tiempo real cuando el usuario no puede cumplir.
✓ Aprende patrones del usuario silenciosamente.
✓ Revisa progreso semanalmente y ajusta plan.
✓ Celebra logros sin obsesionar con balanza.
✓ Detecta banderas rojas y deriva a profesionales.
✓ Funciona offline.
✓ Modo oscuro nativo, mobile-first, accesible.

Costos operativos actuales: $0/mes (todo en free tiers).
Capacidad estimada: hasta 1000 usuarios activos diarios sin pagar.

🌱 ¡Felicitaciones! El producto que diseñaste con Roberto, Lucía,
Carlos y Valentina está construido. Ahora toca probarlo con humanos
reales.

¿Quieres que ahora ayude con algo específico? Sugerencias:
- Generar copy de email de bienvenida para testers.
- Diseñar formulario de feedback semanal.
- Preparar deck de presentación para mostrar el producto.
- Plan de marketing post-beta.
```

---

**Este es el último prompt de fase. Trabaja con cuidado.**

**Empieza por la Tarea 1.**
