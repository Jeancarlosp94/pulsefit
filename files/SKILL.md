---
name: pulsefit-dev
description: Skill maestra del proyecto PulseFit (PWA fitness coach adaptativo). Úsala SIEMPRE que estés trabajando en este proyecto, en cualquier archivo del repo `client-pulsefit` o `supabase/`. Si no sabes cómo hacer algo, qué patrón seguir, qué nombre dar a un archivo, qué stack usar, qué tono usar en un mensaje, cómo manejar errores, cómo nombrar una función API, qué guard de ruta aplicar, o cómo se maneja auth — léela completa antes de proponer código. Si te sientes perdido, desorientado o no recuerdas las convenciones, RELÉELA. También úsala antes de empezar cualquier nueva fase del roadmap, antes de cerrar un cambio (checklist), y cuando el usuario pida cualquier feature nueva. Es la fuente única de verdad del proyecto.
---

# PulseFit — Skill maestra del proyecto

> **Si te sientes perdido en cualquier momento, vuelve a leer este archivo completo y luego `MEMORY.md`.** Son la fuente única de verdad del proyecto.

PulseFit es una **PWA gratuita** de fitness y nutrición con IA, adaptativa y compasiva. Reemplaza apps como Fitia pero es 100% gratuita y se diferencia por su **sistema de rescates en tiempo real** (alternativas cuando el usuario no puede cumplir el plan original).

---

## Cómo usar esta skill

Esta skill es tu manual de operaciones. Está organizada en **3 capas**:

1. **Este SKILL.md** (lo que estás leyendo) — convenciones, principios, flujo de trabajo, checklist. Léelo siempre antes de tocar código.
2. **`MEMORY.md`** — memoria viva del proyecto. Qué fase estamos, qué se construyó, qué decisiones se tomaron, qué falta. **Actualízalo después de CADA cambio significativo.**
3. **`references/`** — documentos de referencia que se cargan solo cuando los necesitas:
   - `references/guia-completa.md` — la guía de desarrollo completa con esquema SQL, tareas detalladas, criterios de aceptación.
   - `references/formulas-nutricion.md` — fórmulas de Lucía (TMB, GET, macros, validaciones de seguridad).
   - `references/reglas-fitness.md` — reglas de Carlos (progresión, RPE, descansos, ejercicios prohibidos).
   - `references/sistema-rescates.md` — lógica completa del sistema adaptativo.

**Flujo recomendado al empezar una sesión:**
1. Lee este SKILL.md completo.
2. Lee `MEMORY.md` para saber dónde quedaste.
3. Identifica qué fase/tarea sigue.
4. Si la tarea toca un dominio específico (nutrición, fitness, rescates), lee la referencia correspondiente.
5. Trabaja la tarea siguiendo las convenciones de abajo.
6. Al terminar, **actualiza `MEMORY.md`**.

---

## Stack obligatorio

**Frontend (`client-pulsefit`):**
- React 18 + TypeScript strict + Vite 5 (alias `@` → `src/`).
- PWA: `vite-plugin-pwa` (Workbox).
- UI: shadcn/ui + Tailwind CSS (paleta PulseFit, no defaults).
- Estado: Zustand con persist (auth, ui).
- Data: `@tanstack/react-query` v5 + `@supabase/supabase-js`.
- Routing: `react-router-dom` v6.
- Formularios: `react-hook-form` + `zod`.
- Offline: Dexie + dexie-react-hooks.
- Animaciones: `framer-motion` (sutil, máximo 200-300ms).
- Iconos: `lucide-react` exclusivamente.
- Toasts: `sonner`.
- Gráficas: Recharts.

**Backend (Supabase):**
- Postgres 15 + Auth + Edge Functions (Deno + TypeScript) + Storage.
- Row Level Security (RLS) **activo en todas las tablas con `user_id`. Sin excepciones.**
- Cron con `pg_cron` + `pg_net`.

**APIs externas:** Open Food Facts, wger, Groq (Llama 3.3 free tier).

**IA generativa:** Groq (Llama 3.3 free tier) — SOLO desde Edge Functions
específicas (`generate-meal-options`, `generate-workout-session`, `ai-message`).
NUNCA llamar a Groq desde el cliente. La API key vive en `Deno.env` del
backend, jamás expuesta al frontend. Cada llamada pasa por validador
estricto y tiene fallback determinístico (ver `references/generadores-hibridos.md`).

**No agregues otras librerías sin justificación clara.** Si dudas, replica el patrón del módulo más cercano antes de inventar uno nuevo.

---

## Convenciones de código (no negociables)

1. **Indentación 3 espacios** (no 2, no 4, no tabs).
2. **Comillas simples** siempre (`'texto'`, no `"texto"`).
3. **Sin punto y coma** al final de statements.
4. **Alias `@`** para imports: `@/api/...`, `@/components`, `@/store/auth`.
5. **Componentes en PascalCase**, archivos `.tsx` para componentes, `.ts` para utilidades/tipos/motores.
6. **Funciones API** con prefijo `fnt`: `fntGetMealPlan`, `fntLogRescueEvent`. Viven en `src/api/fnt<Modulo>.ts`.
7. **Interfaces TypeScript** con prefijo `Itf` (mayúscula al inicio): `ItfRescueEvent`, `ItfMealPlan`. Viven en `src/interface/itf<Modulo>.ts`.
8. **Tipos auto-generados** de Supabase en `src/interface/database.ts` (regenerar con `pnpm types:db`).
9. **Estado servidor → react-query** (`useQuery`, `useMutation`). **Estado UI/auth → Zustand**. **Datos offline → Dexie**. No mezclar capas.
10. **Toasts con `sonner`** + emoji al final, **siempre tono compasivo**:
    - ✅ `toast.success('Plan actualizado 💪')`
    - ✅ `toast.success('Comida registrada 🥗')`
    - ✅ `toast.warning('Aún no terminas el onboarding 🌱')`
    - ❌ NUNCA `toast.error('Fallaste tu meta')`
11. **Errores de API:** envolver con `useErrorHandling().handleApiError(e)`. Maneja 401 (logout + redirect), 404, 400/422, otros automáticamente.
12. **Páginas exportadas** en barrel `src/pages/index.ts` y consumidas vía `src/routes/Routes.tsx`.
13. **Modo oscuro y claro siempre.** Componentes nunca hardcodean color hex; usan tokens (`bg-background`, `text-foreground`, `bg-primary`).
14. **Mobile-first absoluto.** Diseñar para 375px primero. Probar en DevTools mobile antes de cerrar el cambio.
15. **Cero `any` no justificado.** Si necesitas `any`, comentario explicando por qué.

---

## Principios de producto (filtro obligatorio)

Cada decisión de código, diseño y copy debe pasar este filtro: **¿Roberto (usuario promedio que ha abandonado 5 apps fitness) seguiría usando PulseFit después de esto?** Si la respuesta es no, replantea.

1. **Fricción mínima** — máximo 3 taps para registrar cualquier acción.
2. **Lenguaje compasivo** — nunca "fallaste", siempre "ajustemos". Sin colores rojos punitivos.
3. **Flexibilidad real** — días libres, comidas trampa, modo "hoy no puedo".
4. **Claridad inmediata** — al abrir la app, en 2 segundos el usuario sabe qué hacer hoy.
5. **Apoyo emocional, no juicio** — la app es coach, no jefe.
6. **Mobile-first absoluto.**
7. **Modo oscuro nativo** desde el día 1.
8. **Accesibilidad WCAG AA mínimo.**
9. **Offline-first** en lo crítico.
10. **Cero costos operativos en MVP** — todo en free tiers.

---

## Cuándo se usa IA generativa y cuándo NO

PulseFit usa IA generativa (Groq + Llama 3.3) en contextos MUY específicos
y siempre con validación estricta. Conoce esta tabla antes de proponer
usar IA en cualquier feature nueva.

✅ SE USA IA para:
- Combinar ingredientes pre-seleccionados en platos con nombre y pasos.
- Organizar ejercicios pre-seleccionados en rutinas con tips.
- Redactar resúmenes semanales con tono cálido (Fase 10).
- Generar mensajes motivacionales contextuales (Fase 10).
- Sugerir sustituciones creativas cuando usuario rechaza opciones.

❌ NUNCA SE USA IA para:
- Calcular calorías, macros, TMB, GET — fórmulas de Lucía.
- Decidir qué ingredientes o ejercicios usar — APIs + reglas.
- Prescribir series, reps, cargas, descansos — reglas de Carlos.
- Diagnosticar patrones problemáticos — umbrales determinísticos.
- Tomar decisiones médicas o nutricionales — fuera del scope.
- Generar contenido sin validación posterior.

REGLA DE ORO: si la IA puede causar daño al usuario equivocándose,
no se usa IA. Se usan reglas validadas por especialistas humanos.

Detalle completo del enfoque híbrido (flujos, prompts exactos,
validadores, fallbacks, métricas) en `references/generadores-hibridos.md`.

---

## Identidad visual (tokens fijos)

Usa estos tokens en `tailwind.config.js` y `src/styles/globals.css` como CSS variables. **No los cambies sin discusión explícita con el usuario.**

```
Light mode:
  --background: #FAFAF7
  --foreground: #1A1F1C
  --primary: #6B8E5A          (verde salvia)
  --primary-foreground: #FFFFFF
  --secondary: #D4A84B        (mostaza suave)
  --accent: #E87B5A           (coral cálido para CTAs)
  --muted: #E8E6E0
  --card: #FFFFFF
  --border: #DDDAD0

Dark mode:
  --background: #14181A
  --foreground: #E8E6E0
  --primary: #8FAE7E
  --primary-foreground: #14181A
  --secondary: #D4A84B
  --accent: #F09575
  --muted: #2A2E30
  --card: #1F2426
  --border: #2F3437
```

**Tipografía:** `Inter` (UI) + `DM Serif Display` (headers grandes), Google Fonts.

**Iconos:** `lucide-react` exclusivamente.

**NUNCA uses rojo punitivo (`#FF0000`, `#DC2626`).** Para alertas usa coral suave o naranja cálido.

---

## Flujo end-to-end de una feature

Replica este flujo cada vez. Es **vertical**: tocas las mismas capas siempre.

**Paso 1 — Migración SQL** (si la feature necesita tabla/columna nueva):
- Crear `supabase/migrations/<timestamp>_<descripcion>.sql`.
- **Activar RLS** y crear policy `auth.uid() = user_id`.
- Aplicar localmente con `npx supabase db reset`.

**Paso 2 — Edge Function** (si hay lógica que no puede ir en cliente):
- Crear `supabase/functions/<nombre>/index.ts`.
- Validar `Authorization` header y `supabase.auth.getUser()`.
- Devolver SIEMPRE `{ msg: string, data?: any }`.
- Variables sensibles vía `Deno.env.get(...)`.
- Catch con `console.error(e)` + mensaje compasivo.

**Paso 3 — Capa API frontend:**
- Crear `src/api/fnt<Modulo>.ts` con funciones `fntXxx`.
- Importar cliente desde `@/api/supabaseConf`.

**Paso 4 — Tipos:**
- Crear `src/interface/itf<Modulo>.ts` con interfaces `Itf*`.
- Si hubo migración, regenerar `database.ts` con `pnpm types:db`.

**Paso 5 — Lógica pura (motores):**
- Si la feature tiene lógica no trivial (cálculos, decisiones), va en `src/features/<engine>/`.
- Funciones puras, sin acceso a red ni stores. Testeables con Vitest.

**Paso 6 — Página/componente:**
- Página en `src/pages/<Modulo>/<Nombre>Page.tsx`.
- Patrón típico:
  ```tsx
  const { handleApiError } = useErrorHandling()
  const { data, isLoading } = useQuery({
     queryKey: ['xxx', filters],
     queryFn: () => fntGetXxx(filters),
     onError: (e) => handleApiError(e)
  })
  if (isLoading) return <LoaderUI />
  return <><TitleUI title='Mi módulo' />{/* … */}</>
  ```
- Componentes reusables → `src/components/`.

**Paso 7 — Ruta y guards:**
- Registrar en `src/App.tsx` dentro de `<AuthRoute>` o `<NotAuthRoute>`.
- Exportar página en `src/pages/index.ts` y `src/routes/Routes.tsx`.

**Paso 8 — Tests:**
- Unit test del motor en `src/features/<engine>/<archivo>.test.ts`.
- Si la feature es crítica, agregar test E2E en `tests/e2e/`.

**Paso 9 — Actualizar `MEMORY.md`:**
- Agregar entrada con fecha, qué se construyó, decisiones tomadas, archivos tocados.

---

## Autenticación (resumen)

- Supabase Auth maneja todo (email/password + Google OAuth).
- Tokens JWT manejados automáticamente por el SDK con `persistSession: true`, `autoRefreshToken: true`.
- RLS de Postgres valida en cada query que `auth.uid()` coincida con `user_id`.
- **No hay roles múltiples.** Solo 2 estados:
  - Anónimo → `/login`, `/register`, `/forgot-password`, `/`.
  - Autenticado sin onboarding → solo `/onboarding/*` y `/perfil`.
  - Autenticado con onboarding completo → toda la app.
- El guard `<AuthRoute>` valida `profile.onboarding_completed` y redirige si es `false`.

---

## Manejo de errores

**Backend (Edge Functions):**
```ts
try {
   // …
   return jsonRes({ msg: 'OK', data })
} catch (e) {
   console.error(e)
   return jsonRes({ msg: e.message || 'Algo no salió como esperábamos 🌱' }, 500)
}
```
Nunca exponer `e.stack` ni queries SQL al cliente.

**Frontend:**
- Hook `useErrorHandling()` obligatorio.
- 401 → `signOut()` + toast `'Tu sesión expiró, vuelve a entrar 🌱'` + redirect.
- 404 → toast `'No encontramos eso 🍃'`.
- 400/422 → mostrar `error.message` directo.
- Otros → toast `'Algo no salió como esperábamos, intentemos de nuevo 🌿'`.
- Offline → toast `'Sin conexión, guardamos local y sincronizamos después 📡'` + encolar en Dexie.

**Errores de validación zod:** inline en el campo, **nunca toast**.

---

## Checklist antes de cerrar un cambio

### Backend
- [ ] Migración SQL aplicada y probada con `supabase db reset`.
- [ ] RLS activo en cualquier tabla nueva con `user_id`.
- [ ] Policy `auth.uid() = user_id` creada.
- [ ] Edge Function valida `Authorization` y `supabase.auth.getUser()`.
- [ ] Edge Function devuelve `{ msg, data? }` con status correcto.
- [ ] Variables sensibles en `Deno.env`, no hardcodeadas.
- [ ] `console.error` en catch, mensaje compasivo en respuesta.

### Frontend
- [ ] Función `fnt*` en `src/api/...`.
- [ ] Tipo `Itf*` en `src/interface/...`.
- [ ] Página envuelve calls con `useErrorHandling`.
- [ ] Toasts en tono compasivo + emoji.
- [ ] Ruta agregada en `App.tsx` bajo `AuthRoute`/`NotAuthRoute`.
- [ ] Página exportada en `pages/index.ts` y `routes/Routes.tsx`.
- [ ] `pnpm format` corrido.
- [ ] `pnpm build` verificado.
- [ ] Probado en DevTools mobile (375px).
- [ ] Modo oscuro probado.
- [ ] Accesible por teclado.

### Ambos
- [ ] Nombres de Edge Function coinciden entre frontend (`fntXxx`) y backend (`functions/xxx`).
- [ ] Commit con mensaje en español pasado/imperativo.
- [ ] **`MEMORY.md` actualizado.**

---

## Cuándo leer cada archivo de referencia

- **Vas a tocar onboarding, cálculos calóricos, distribución de macros, validaciones nutricionales:** lee `references/formulas-nutricion.md`.
- **Vas a tocar planes de entrenamiento, RPE, progresión, selección de ejercicios:** lee `references/reglas-fitness.md`.
- **Vas a tocar el sistema adaptativo (Hoy no puedo, alternativas, compensación):** lee `references/sistema-rescates.md`.
- **Vas a tocar generación de comidas o rutinas (motores meal-generator o routine-generator):** lee `references/generadores-hibridos.md`. Es CRÍTICO leerlo antes de escribir cualquier código de generación.
- **Necesitas el esquema SQL completo o detalles de cualquier fase del roadmap:** lee `references/guia-completa.md`.
- **Vas a tocar IA generativa (mensajes contextuales, revisión semanal):** lee `references/sistema-rescates.md` (sección IA al final), `references/generadores-hibridos.md` (flujo, prompts, validador) y `references/guia-completa.md` (sección Edge Functions).

---

## Convenio de oro

> **Replica el patrón del módulo más cercano antes de inventar uno nuevo.** Si vas a tocar Onboarding mira `pages/Onboarding/` + `features/nutrition-engine/`. Si tocas Rescates mira `pages/Rescue/` + `features/rescue-engine/`. La consistencia con el código vecino es la regla #1.

---

## Recordatorio final

**Después de cada cambio significativo, actualiza `MEMORY.md`.** Esa es la única forma de que la próxima sesión (o el próximo desarrollador) sepa dónde quedaste sin tener que leer todo el repo.

Si te pierdes, **vuelve a este archivo y a `MEMORY.md`.** Son tu mapa.
