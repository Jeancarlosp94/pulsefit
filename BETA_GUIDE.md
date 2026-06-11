# 🚀 Guía de Beta Cerrada — PulseFit

> Guía para correr la beta cerrada de PulseFit con 30 usuarios reales después de cerrar la Fase 11 del roadmap.

---

## 📋 Pre-requisitos

Antes de invitar a un solo tester, verificar:

### Servicios externos
- [ ] Supabase (Production project) con free tier suficiente para 30 usuarios.
- [ ] Vercel deploy automático desde `main` funcionando.
- [ ] Groq API key activa y monitoreada (free tier: 30 req/min para Llama 3.3 70B).
- [ ] Gemini API key activa como fallback (free tier: 15 req/min).
- [ ] DNS apuntando al dominio definitivo (si aplica).

### Migraciones SQL aplicadas
- [ ] Todas las migraciones de `supabase/migrations/` corridas en producción.
- [ ] Verificar con `SELECT * FROM supabase_migrations.schema_migrations`.

### Edge Functions desplegadas
- [ ] `generate-meal-plan`
- [ ] `generate-meal-options`
- [ ] `generate-workout-session`
- [ ] `weekly-review`

### Políticas legales
- [ ] `privacy-policy.md` publicada en `/privacy-policy.md`.
- [ ] `terms-of-service.md` publicada en `/terms-of-service.md`.
- [ ] Botones visibles en Perfil → Privacidad y datos.

### Calidad técnica
- [ ] `pnpm test` → 100% verde.
- [ ] `pnpm lint` → 0 errores.
- [ ] `pnpm build` → sin warnings críticos.
- [ ] Auditoría Lighthouse manual: PWA ≥ 90, Performance ≥ 80 mobile, A11y ≥ 90.

---

## 👥 Selección de testers

**Objetivo: 30 personas con diversidad demográfica.**

Criterios sugeridos:
- 15-20 mujeres, 10-15 hombres
- Rango etario: 20-50 años
- Países LATAM: Ecuador, Perú, Colombia, México, Chile, Argentina
- **5+ deben haber abandonado apps fitness antes** (para validar que PulseFit retiene mejor)
- 3-5 testers con perfil "no quiero ir al gym ni cocinar" (perfil Joaquín del proceso de diseño)
- 3-5 mamás con poco tiempo (perfil Mariana)

Evita en esta beta:
- Atletas profesionales (no es el público objetivo).
- Menores de 18 años.
- Personas con trastornos de conducta alimentaria activos (la app no tiene supervisión clínica).
- Embarazadas / lactantes (no contemplado en el alcance MVP).

---

## 📨 Onboarding de testers

### Email de bienvenida (plantilla)

```
Asunto: 🌱 Tu acceso a PulseFit beta

Hola [Nombre],

Gracias por aceptar probar PulseFit.

🔗 La app vive en: https://pulsefit.app
📧 Tu acceso: usa tu email de siempre + crea una contraseña.

PulseFit es una PWA: ábrela en tu celular y dale "Agregar a inicio" desde el menú del navegador para que se vea como una app nativa.

⚠️ Importante: esto es beta. Espera bugs y cosas que aún no funcionan. Tu feedback es lo más valioso.

🌿 La filosofía es simple:
- Sin juicio. Cero "fallaste".
- Sin presión. La consistencia importa más que la perfección.
- Tú eliges qué registrar y cuándo.

📝 Para feedback usa el canal: [Discord / Slack / Form]

¿Dudas? Respondé este email cuando quieras.

Gracias por confiar 🌱
El equipo de PulseFit
```

### Canal de feedback

Elige UNA opción:
- **Discord server** (recomendado: feedback público + privado por DMs)
- **Slack** workspace
- **Google Forms** (para feedback asíncrono estructurado)

NO uses email para feedback general — se vuelve inmanejable con 30 personas.

---

## 📊 Métricas a trackear durante beta

### Métricas de retención

| Métrica | Objetivo | Cuándo medir |
|---|---|---|
| % activos día 7 | > 80% | Día 8 |
| % activos día 14 | > 65% | Día 15 |
| % activos día 30 | > 50% | Día 31 |
| % que completó onboarding | > 90% | Diario |

### Métricas de uso de features

| Feature | Métrica | Objetivo |
|---|---|---|
| Rescates | % usuarios que usaron al menos 1 | > 70% |
| Revisión semanal | % usuarios que abrieron al menos 1 | > 60% |
| Logros desbloqueados | promedio por usuario en 30 días | > 5 |
| Tasa de fallback de IA | % requests que caen a fallback | < 5% |
| Bug crashes | total reportados | < 10 críticos |

### NPS (Net Promoter Score)

Pregunta semanal por mensaje en el canal:

> "Del 0 al 10, ¿qué tan probable es que recomendarías PulseFit a alguien?"

Objetivo: NPS final > 40.

---

## 🐛 Iteración durante beta

Sprint semanal de fixes basado en feedback. Priorización:

1. **Bugs críticos** (crash, datos perdidos, auth roto)
2. **UX dolores** que afectan a múltiples usuarios
3. **Features pedidas** que se alinean con la visión

Lo que NO entra en sprint de iteración:
- Features fuera del alcance MVP (modo premium, integración wearables, etc.)
- Cambios de identidad/marca
- Refactors arquitectónicos no relacionados a bugs

---

## 🏁 Cierre de beta

Al terminar el periodo (sugerido: 30-60 días):

### Compilación de aprendizajes
- ¿Qué features se usaron más?
- ¿Qué features se ignoraron?
- ¿Qué confundió a los usuarios?
- ¿Qué les hizo volver al día siguiente?

### Decisión
- ✅ **Lanzar público**: si retención día 30 > 50% y NPS > 40.
- 🔄 **Seguir iterando**: si retención < 30% o bugs críticos sin resolver.
- ⏸️ **Pausar**: si los aprendizajes muestran que el producto necesita rediseño.

### Documentación
- Reporte final con métricas, hallazgos clave y decisión.
- Actualizar este BETA_GUIDE con lo aprendido para futuras betas.

---

## 📞 Soporte durante beta

Persona de contacto principal: [Jeancarlo Ponce]
Email: hello@pulsefit.app
Tiempo de respuesta esperado: < 24h en días hábiles.

---

🌿 Buena suerte. La beta es donde el producto deja de ser teoría y empieza a vivir.
