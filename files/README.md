# 📚 PulseFit — Guía de uso de los prompts por fase

Este folder contiene **prompts independientes por fase** para ir construyendo PulseFit con Claude Code paso a paso. Pegas uno, esperas a que termine y valides, y luego pegas el siguiente.

---

## 📋 Orden de ejecución

```
1. PROMPT_CLAUDE_CODE_FITAPP.md           ← Fases 1, 2 y 3 (setup + auth + PWA)
   (en /outputs raíz, no en este folder)
        ↓
2. PROMPT_ACTUALIZAR_SKILL_GENERADORES_HIBRIDOS.md
   (en /outputs raíz, actualiza la skill antes de continuar)
        ↓
3. FASE_4_onboarding.md                   ← Onboarding + cálculos nutricionales
        ↓
4. FASE_5_meal_generator.md               ← Generador de comidas con IA
        ↓
5. FASE_6_workout_generator.md            ← Generador de rutinas con IA
        ↓
6. FASE_7_home_y_registro.md              ← Home dinámico + registro 3 taps
        ↓
7. FASE_8_rescates.md                     ← Sistema de rescates adaptativos
        ↓
8. FASE_9_progreso_logros.md              ← Progreso, gráficas, logros
        ↓
9. FASE_10_revision_semanal_ia.md         ← Revisión semanal + IA generativa
        ↓
10. FASE_11_patrones_y_beta.md            ← Detección de patrones + cierre

→ FASE 12 (beta con usuarios reales) requiere intervención humana,
  guiada por el archivo BETA_GUIDE.md que se genera al final de Fase 11.
```

---

## 🔄 Flujo recomendado por fase

Para cada fase, sigue este flujo:

1. **Pega el prompt** correspondiente a Claude Code.
2. **Deja que trabaje** sin interrupciones (puede tomar tiempo).
3. **Cuando avise que terminó** y muestre el checkpoint:
   - Lee el `PHASE_<N>_REPORT.md` que generó.
   - Sigue las recomendaciones de validación (probar la app, verificar puntos específicos).
   - Si todo está bien: responde "sí, continúa con Fase X+1" y pasas al siguiente prompt.
   - Si algo no está bien: pídele ajustes específicos antes de continuar.
4. **Antes del siguiente prompt**: verifica que `MEMORY.md` se haya actualizado correctamente.

---

## ⚠️ Reglas importantes

### NO pases al siguiente prompt sin validar
Cada fase construye sobre la anterior. Si la Fase 4 quedó con bugs, la Fase 5 los hereda. Tómate 15-30 min validando cada checkpoint antes de avanzar.

### NO modifiques los prompts antes de pegarlos
Están diseñados para trabajar con la skill `pulsefit-skill/`. Cambiarlos rompe la coherencia. Si necesitas algo distinto, pídelo a Claude Code después de pegar el prompt.

### SÍ revisa MEMORY.md después de cada fase
Es la memoria viva del proyecto. Si Claude Code olvida actualizarla, pídeselo: "Actualiza MEMORY.md con lo que hicimos en esta fase".

### SÍ pide ajustes si algo no te convence
Cada checkpoint te invita a pedir cambios. Aprovecha. Es más barato corregir en Fase 4 que en Fase 11.

---

## ⏱️ Tiempo estimado por fase

Aproximaciones (varían según complejidad y velocidad de Claude Code):

| Fase | Tiempo aprox. de Claude Code | Tiempo tu validación |
|------|------------------------------|----------------------|
| 4    | 2-3 horas                    | 30 min               |
| 5    | 3-4 horas                    | 45 min               |
| 6    | 3-4 horas                    | 45 min               |
| 7    | 3-4 horas                    | 30 min               |
| 8    | 3-4 horas                    | 1 hora (validación profunda) |
| 9    | 2-3 horas                    | 30 min               |
| 10   | 3-4 horas                    | 45 min               |
| 11   | 2-3 horas                    | 30 min               |

**Total estimado:** 25-35 horas de trabajo de Claude Code + 5-6 horas de validación tuya, distribuido en varias sesiones según tu disponibilidad.

---

## 💡 Tips para sesiones largas

### Si una fase no cabe en una sesión
Claude Code puede agotar contexto en fases grandes. Si pasa:
1. Pídele que actualice `MEMORY.md` con todo el progreso.
2. Cierra la sesión.
3. En sesión nueva: "Lee SKILL.md, MEMORY.md, y continúa la fase actual donde quedaste".

### Si Claude Code se contradice o se confunde
Pídele explícitamente: "Vuelve a leer SKILL.md y MEMORY.md, luego continúa".

### Si quieres saltarte algo
No lo recomiendo, pero si quieres saltar (ej: omitir gamificación de Fase 9):
1. Antes de pegar el prompt, edítalo: "Salta la Tarea X" en el campo correspondiente.
2. Documéntalo en MEMORY.md como decisión tomada.

---

## 🗂️ Archivos que tendrás al final

```
tu-proyecto/
├── client-pulsefit/             ← Frontend completo
├── supabase/                    ← Backend (migraciones + Edge Functions)
├── pulsefit-skill/              ← Skill (manual viviente)
│   ├── SKILL.md
│   ├── MEMORY.md
│   └── references/
├── PHASE_3_REPORT.md            ← reporte de cada fase
├── PHASE_4_REPORT.md
├── PHASE_5_REPORT.md
├── ...
├── PHASE_11_REPORT.md
├── FINAL_REPORT.md              ← consolidado final
├── README.md                    ← cómo correr el proyecto
├── DEVELOPMENT.md               ← guía de desarrollo
├── ARCHITECTURE.md              ← arquitectura técnica
└── BETA_GUIDE.md                ← cómo correr beta cerrada
```

---

## 🆘 Problemas comunes

### "Claude Code dice que ya terminó la Fase X pero no lo hizo bien"
Pídele: "Revisa los criterios de aceptación de la Fase X en el prompt original. ¿Cumple todos? Lista los que no y arréglalos."

### "MEMORY.md no se actualiza"
Pídele explícitamente al final de cada sesión: "Antes de cerrar, actualiza MEMORY.md con lo que hicimos hoy".

### "Las pantallas se ven mal en mobile"
Asegúrate de que esté probando en DevTools mobile (375px). Pídele: "Audita esta pantalla en 375px y corrige problemas de responsive".

### "Los tests fallan"
Pídele: "Corre los tests, identifica fallas y arréglalas antes de continuar".

### "Quiero cambiar algo de un prompt"
Hazlo antes de pegarlo. O después, dile: "En la Fase X cambia esto: [tu cambio]". Documéntalo en MEMORY.md.

---

## 📞 Preguntas que puedes hacerle a Claude Code en cualquier momento

- "¿En qué fase estamos?"
- "Resume MEMORY.md."
- "¿Qué decisiones de arquitectura se han tomado hasta ahora?"
- "¿Qué deuda técnica tenemos pendiente?"
- "¿La cobertura de tests está sobre 80%?"
- "Lighthouse de la pantalla X."

---

## 🎯 Después de Fase 11 (proyecto completo)

Cuando termines las 11 fases, tienes el producto **listo para validar con humanos reales**. La Fase 12 es:

1. Reclutar 30 testers según `BETA_GUIDE.md`.
2. Recoger feedback semanal.
3. Iterar con sprints de fixes.
4. Después de 4-6 semanas de beta: decidir lanzamiento público.

Esto requiere tu juicio humano, no se automatiza con Claude Code.

---

**¡Éxitos con PulseFit! 🌱**
