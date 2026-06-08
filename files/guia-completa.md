# 🛠️ Guía de Desarrollo — PulseFit (PWA Fitness Coach Adaptativo)

> Este documento describe **cómo se trabaja en este proyecto**: convenciones, flujo de un cambio end-to-end, estructura de carpetas, patrones de código, autenticación, manejo de errores y notas operativas. Está pensado como prompt maestro para Claude Code: léelo completo antes de empezar y replícalo al generar código nuevo.

> Repos involucrados:
> - **Frontend (PWA):** `client-pulsefit` — React 18 + TypeScript + Vite (puerto **5173**)
> - **Backend (BaaS):** Supabase — Postgres + Auth + Edge Functions + Storage
>
> *Nota:* a diferencia de un backend Express tradicional, aquí Supabase actúa como backend gestionado. La capa equivalente a "controllers" vive en Edge Functions (Deno + TypeScript) y la capa "models" son las queries SQL/migraciones + RLS policies.

---

## 📑 Tabla de contenido

1. [Stack y herramientas](#1-stack-y-herramientas)
2. [Arranque local](#2-arranque-local)
3. [Flujo de trabajo end-to-end (cómo agregar una feature)](#3-flujo-de-trabajo-end-to-end-cómo-agregar-una-feature)
4. [Backend (Supabase) — Convenciones](#4-backend-supabase--convenciones)
5. [Frontend — Convenciones](#5-frontend--convenciones)
6. [Autenticación y autorización](#6-autenticación-y-autorización)
7. [Manejo de errores](#7-manejo-de-errores)
8. [Estilo y commits](#8-estilo-y-commits)
9. [Principios de producto no negociables](#9-principios-de-producto-no-negociables)
10. [Roadmap por fases](#10-roadmap-por-fases)
11. [Checklist al terminar un cambio](#11-checklist-al-terminar-un-cambio)
12. [Tareas a ejecutar — Fases 1, 2 y 3](#12-tareas-a-ejecutar--fases-1-2-y-3)

---

## 1. Stack y herramientas

### Frontend (`client-pulsefit`)
- **React 18** + **TypeScript** (strict) + **Vite 5** (alias `@` → `src/`).
- **PWA:** `vite-plugin-pwa` (Workbox) para service worker, manifest e instalable en iOS/Android.
- **UI:** **shadcn/ui** como base (Radix + Tailwind), `tailwindcss` como sistema de estilos. Sin Antd ni MUI; el ecosistema Tailwind/shadcn ofrece mejor control para mobile-first y modo oscuro nativo.
- **Estado global:** [Zustand](https://github.com/pmndrs/zustand) con `persist` para auth y UI (theme, modo).
- **Data fetching:** `@tanstack/react-query` v5 + `@supabase/supabase-js` (instancia configurada en [src/api/supabaseConf.ts](src/api/supabaseConf.ts)).
- **Ruteo:** `react-router-dom` v6 (ver [src/App.tsx](src/App.tsx) y [src/routes/](src/routes/)).
- **Formularios:** `react-hook-form` + `zod` (validaciones tipadas en [src/validations/](src/validations/)).
- **Gráficas:** Recharts (gráficas de progreso, peso, adherencia).
- **Calendarios:** componentes Radix (`react-day-picker`) — sin FullCalendar para evitar peso innecesario.
- **PDF / Excel:** `pdfmake` + `xlsx` (solo para exportar progreso del usuario, fase 5+).
- **Animaciones:** `framer-motion` (sutil, máximo 200-300ms).
- **Iconos:** `lucide-react` exclusivamente.
- **Notificaciones in-app:** `sonner` (toaster montado en App, mismos toasts con emoji que el patrón establecido — "Plan actualizado 💪", "Comida registrada 🥗").
- **DB local (offline-first):** `dexie` (IndexedDB wrapper) + `dexie-react-hooks`.
- **Lint/format:** ESLint + Prettier + Husky + lint-staged (mismo setup probado).
- **Telemetría:** PostHog (free tier) y Sentry (free tier) para errores en producción.

### Backend (Supabase)
- **Postgres 15** gestionado por Supabase.
- **Auth:** Supabase Auth (email + password + Google OAuth + magic link). Tokens JWT firmados por Supabase.
- **Seguridad:** **Row Level Security (RLS)** activado en todas las tablas. Cada usuario solo accede a sus propios datos.
- **Edge Functions:** Deno + TypeScript en [supabase/functions/](supabase/functions/) — equivalente a "controllers". Aquí va la lógica que no puede o no debe ir en el cliente: revisión semanal automática, generación de planes, llamadas a IA externa.
- **Storage:** buckets `meal-photos`, `progress-photos`, `avatars` con políticas RLS por usuario.
- **Cron:** `pg_cron` extension de Postgres + `pg_net` para invocar Edge Functions programadas (revisión semanal cada domingo, recordatorios diarios).
- **APIs externas consumidas:** Open Food Facts, wger, Groq (Llama 3.3 free tier para mensajes IA).
- **Mail:** Supabase Auth maneja emails transaccionales (confirmación, reset password). Para mails de producto se usa Resend (free tier 100 mails/día) más adelante.
- **Logs:** Supabase Dashboard expone logs de Postgres y Edge Functions; Sentry captura errores client + server.

---

## 2. Arranque local

### Backend (Supabase)
```bash
cd pulsefit
npx supabase login                  # una vez
npx supabase init                   # ya hecho en el repo
npx supabase start                  # levanta Postgres + Auth + Studio local en Docker
npx supabase db push                # aplica migraciones
npx supabase functions serve        # corre Edge Functions localmente
```
Requiere `.env.local` en la raíz con: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo backend), `GROQ_API_KEY`, `OPENFOODFACTS_USER_AGENT`.

### Frontend
```bash
cd client-pulsefit
pnpm install
pnpm dev                            # vite --host → puerto 5173
```
Requiere `.env.local` con: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_POSTHOG_KEY`, `VITE_SENTRY_DSN`, `VITE_APP_ENV` (`development` | `production`).

> El frontend usa el SDK oficial de Supabase con `persistSession: true` y `autoRefreshToken: true`. La sesión vive en `localStorage` (estándar Supabase). Cada request al API REST de Supabase inyecta automáticamente el JWT del usuario. Las Edge Functions reciben el JWT en header `Authorization: Bearer <token>`.

---

## 3. Flujo de trabajo end-to-end (cómo agregar una feature)

El proyecto sigue un flujo **vertical**: para una feature nueva tocas las mismas capas. Ejemplo: "registrar un evento de rescate cuando el usuario marca 'hoy no puedo entrenar'".

### Paso 1 — Backend: migración de DB (capa modelo)
Si la feature requiere tabla/columna nueva, crear migración en [supabase/migrations/](supabase/migrations/):

```sql
-- supabase/migrations/20250115120000_add_rescue_events.sql
CREATE TABLE rescue_events (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   event_date DATE NOT NULL,
   trigger_type TEXT CHECK (trigger_type IN ('workout_skip', 'meal_change', 'low_mood')),
   reason TEXT,
   alternatives_offered JSONB,
   alternative_chosen JSONB,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE rescue_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_rescue_events" ON rescue_events
   FOR ALL USING (auth.uid() = user_id);
```
**Reglas inviolables:**
- **Toda tabla con datos de usuario debe tener RLS activo** y al menos una policy que filtre por `auth.uid()`.
- **Nunca usar la `service_role_key` en cliente** — solo en Edge Functions.

### Paso 2 — Backend: Edge Function (capa controller, opcional)
Si la lógica no se puede resolver con un simple insert/update RLS-protegido (ej: cálculos complejos, llamadas a IA, agregaciones), crear Edge Function en [supabase/functions/](supabase/functions/):

```ts
// supabase/functions/log-rescue-event/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
   try {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return jsonRes({ msg: 'No autorizado' }, 401)

      const supabase = createClient(
         Deno.env.get('SUPABASE_URL')!,
         Deno.env.get('SUPABASE_ANON_KEY')!,
         { global: { headers: { Authorization: authHeader } } }
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return jsonRes({ msg: 'Sesión inválida' }, 401)

      const { triggerType, reason } = await req.json()
      const alternatives = generateAlternatives(triggerType, user.id)

      const { data, error } = await supabase
         .from('rescue_events')
         .insert({ user_id: user.id, trigger_type: triggerType, reason, alternatives_offered: alternatives })
         .select()
         .single()

      if (error) throw error
      return jsonRes({ msg: 'OK', data })
   } catch (e) {
      console.error(e)
      return jsonRes({ msg: e.message || 'Algo no salió como esperábamos, intentemos de nuevo 🌱' }, 500)
   }
})

const jsonRes = (body: unknown, status = 200) =>
   new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
```

### Paso 3 — Frontend: capa API
En [src/api/](src/api/) crea/edita el archivo `fnt<Modulo>.ts` con la función que consume Supabase o la Edge Function:

```ts
// src/api/fntRescue.ts
import { supabase } from './supabaseConf'
import type { ItfRescueEvent, ItfTriggerType } from '@/interface/itfRescue'

export const fntLogRescueEvent = async (triggerType: ItfTriggerType, reason: string) => {
   const { data, error } = await supabase.functions.invoke('log-rescue-event', {
      body: { triggerType, reason }
   })
   if (error) throw error
   return data as { msg: string, data: ItfRescueEvent }
}

export const fntGetRescueHistory = async (userId: string) => {
   return await supabase
      .from('rescue_events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: false })
}
```
Importa siempre el cliente desde `./supabaseConf` (no instancies otro) para que el SDK reuse la sesión.

### Paso 4 — Frontend: tipos
Define la interfaz en [src/interface/](src/interface/) (`itfRescue.ts`, `itfPlan.ts`, etc.) siguiendo el prefijo `Itf`/`itf`:

```ts
// src/interface/itfRescue.ts
export type ItfTriggerType = 'workout_skip' | 'meal_change' | 'no_cooking' | 'eating_out' | 'low_mood' | 'no_energy' | 'injury' | 'craving'

export interface ItfRescueEvent {
   id: string
   user_id: string
   event_date: string
   trigger_type: ItfTriggerType
   reason: string | null
   alternatives_offered: ItfAlternative[]
   alternative_chosen: ItfAlternative | null
   user_completed: boolean | null
   created_at: string
}

export interface ItfAlternative {
   title: string
   description: string
   estimated_kcal_impact?: number
   estimated_duration_min?: number
}
```
Los tipos auto-generados desde el esquema de Supabase viven en [src/interface/database.ts](src/interface/database.ts) (regenerar con `pnpm types:db`).

### Paso 5 — Frontend: página/componente
Las páginas viven en [src/pages/<Modulo>/](src/pages/) — agrupadas por dominio (Onboarding, Home, Meals, Workouts, Progress, Rescue, Profile). Patrón típico:

```tsx
import { useQuery, useMutation } from '@tanstack/react-query'
import { fntGetRescueHistory, fntLogRescueEvent } from '@/api/fntRescue'
import { useErrorHandling } from '@/hooks'
import { TitleUI, LoaderUI } from '@/components'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'

const RescuePage = () => {
   const { user } = useAuthStore()
   const { handleApiError } = useErrorHandling()

   const { data, isLoading } = useQuery({
      queryKey: ['rescue-history', user?.id],
      queryFn: () => fntGetRescueHistory(user!.id),
      enabled: !!user,
      onError: (e) => handleApiError(e)
   })

   const mutation = useMutation({
      mutationFn: ({ trigger, reason }: { trigger: ItfTriggerType, reason: string }) =>
         fntLogRescueEvent(trigger, reason),
      onSuccess: () => toast.success('Listo, ajustamos tu día 🌱'),
      onError: (e) => handleApiError(e)
   })

   if (isLoading) return <LoaderUI />
   return (
      <>
         <TitleUI title="Tu día, tu ritmo" />
         {/* … */}
      </>
   )
}
export default RescuePage
```
Componentes reusables → [src/components/](src/components/) (export centralizado en [src/components/index.ts](src/components/index.ts)).

### Paso 6 — Frontend: ruta y guards
Registra la ruta en [src/App.tsx](src/App.tsx) dentro del `<AuthRoute>` apropiado:

```tsx
<Route path='/rescate' element={<AuthRoute><RescuePage /></AuthRoute>} />
```
Si la página es nueva, expórtala en [src/pages/index.ts](src/pages/index.ts) y añádela al barrel [src/routes/Routes.tsx](src/routes/Routes.tsx).

> A diferencia del proyecto Chernobyl, **PulseFit no tiene roles múltiples**. Solo hay 2 estados: autenticado o no. Y un sub-estado: `onboarding_completed` true/false que decide si va a `/onboarding` o a `/home`.

---

## 4. Backend (Supabase) — Convenciones

### Estructura
```
supabase/
├── config.toml                 # configuración del proyecto local
├── migrations/                 # un archivo por cambio (timestamp_descripcion.sql)
│   ├── 20250101000000_initial_schema.sql
│   ├── 20250105000000_add_rescue_events.sql
│   └── ...
├── functions/                  # Edge Functions (Deno)
│   ├── _shared/                # utils compartidos (cors, jsonRes, supabase client)
│   ├── weekly-review/          # cron — revisión semanal automática
│   ├── daily-cron/             # cron — recordatorios y limpieza
│   ├── log-rescue-event/       # invocada por cliente
│   ├── generate-meal-plan/     # invocada al terminar onboarding
│   ├── generate-workout-plan/  # invocada al terminar onboarding
│   └── ai-message/             # llamada a Groq para mensajes contextuales
├── seed/                       # datos iniciales (catálogos)
│   ├── exercises.sql
│   ├── achievements.sql
│   └── restaurant_guides.sql
└── tests/                      # tests pgTAP de policies RLS
```

### Reglas
1. **Migraciones inmutables.** Una vez aplicada en producción, no se edita; se crea otra migración correctiva.
2. **RLS siempre.** Toda tabla con `user_id` activa RLS y crea policy `auth.uid() = user_id`. Sin excepciones.
3. **Catálogos públicos** (`foods_cache`, `exercises_catalog`, `restaurant_guides`, `achievements`) tienen RLS con policy `FOR SELECT USING (true)`.
4. **Triggers de mantenimiento:** `updated_at` auto-actualizado por trigger `update_updated_at()`. Crear `profiles` automático al registrarse vía trigger `handle_new_user()`.
5. **Edge Functions devuelven SIEMPRE** `{ msg: string, data?: any }`. Status 200 OK, 4xx error de cliente, 5xx error de servidor. **Nunca exponer `error.stack`.**
6. **Variables sensibles** (Groq key, service_role) se leen vía `Deno.env.get(...)` en Edge Functions, nunca hardcodeadas ni en cliente.
7. **Cron jobs** se declaran en migraciones con `pg_cron`:
   ```sql
   SELECT cron.schedule('weekly-review', '0 8 * * 0', $$
      SELECT net.http_post(
         url := 'https://<project>.supabase.co/functions/v1/weekly-review',
         headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
      );
   $$);
   ```

### Patrón de Edge Function
```ts
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const jsonRes = (body: unknown, status = 200) =>
   new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
   })
```

```ts
// supabase/functions/<modulo>/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonRes } from '../_shared/cors.ts'

serve(async (req) => {
   if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

   try {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return jsonRes({ msg: 'No autorizado' }, 401)

      const supabase = createClient(
         Deno.env.get('SUPABASE_URL')!,
         Deno.env.get('SUPABASE_ANON_KEY')!,
         { global: { headers: { Authorization: authHeader } } }
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return jsonRes({ msg: 'Sesión inválida' }, 401)

      // … lógica
      return jsonRes({ msg: 'OK', data: result })
   } catch (e) {
      console.error(e)
      return jsonRes({ msg: e.message || 'Algo no salió como esperábamos 🌱' }, 500)
   }
})
```

---

## 5. Frontend — Convenciones

### Estructura
```
src/
├── main.tsx                    # bootstrap React 18
├── AppWithCustomization.tsx    # providers (Theme, ReactQuery, Sonner, ErrorBoundary)
├── App.tsx                     # BrowserRouter + Routes con AuthRoute/NotAuthRoute
├── api/                        # supabase client + funciones fnt* por módulo
├── pages/<Modulo>/             # páginas agrupadas por dominio
├── components/                 # reusables (TitleUI, LoaderUI, EmptyState, RescueDialog)
├── components/shared/          # form-fields y subcomponentes compartidos
├── components/ui/              # primitivos shadcn personalizados con paleta PulseFit
├── features/                   # motores de dominio (lógica pura, testeable)
│   ├── nutrition-engine/       # cálculos TMB, GET, macros, validaciones de seguridad
│   ├── workout-engine/         # generador de rutinas, reglas de progresión
│   ├── rescue-engine/          # lógica de alternativas y compensación
│   └── review-engine/          # análisis semanal, detector de patrones
├── hooks/                      # useErrorHandling, useAuth, useOnlineStatus, useTheme
├── store/                      # zustand (auth, ui, plan)
├── routes/                     # AuthRoute, NotAuthRoute, Routes (barrel)
├── interface/                  # tipos TS por dominio (Itf*, itf*) + database.ts
├── layout/                     # AppShell, BottomNav, TopBar
├── themes/                     # tokens Tailwind, paleta PulseFit, tipografía
├── utils/                      # date, format, encrypt, dexieHelpers
├── validations/                # esquemas zod por dominio
├── config/                     # constantes (kcal mínimas, RPE umbrales, etc.)
├── lib/                        # dexie-db, sync-manager, pwa, apis externas
└── styles/                     # globals.css, tokens
```

### Reglas
1. **Alias `@`** → `src/` (configurado en [vite.config.ts](vite.config.ts) y `tsconfig.json`). Usar `@/api/...`, `@/components`, `@/store/auth`, etc.
2. **Indentación 3 espacios**, comillas simples, sin punto y coma final.
3. **Funciones API se llaman `fnt<Acción>`** (ej. `fntGetMealPlan`, `fntLogRescueEvent`, `fntGenerateWorkoutPlan`). Viven en `src/api/fnt<Modulo>.ts` y siempre devuelven la respuesta del SDK de Supabase tal como viene (`{ data, error }`) o lanzan en error.
4. **Componentes en PascalCase**, archivos `.tsx` para componentes, `.ts` para utilidades/tipos/motores.
5. **Estado servidor → react-query** (`useQuery`, `useMutation`). **Estado UI/auth/preferencias → Zustand**. **Datos offline → Dexie + dexie-react-hooks**. No mezclar.
6. **Toasts con `sonner`** — `toast.success`, `toast.error`, `toast.warning` con emoji al final, **siempre en tono compasivo**:
   - ✅ `toast.success('Plan actualizado 💪')`
   - ✅ `toast.success('Comida registrada 🥗')`
   - ✅ `toast.warning('Aún no terminas el onboarding 🌱')`
   - ❌ NUNCA `toast.error('Fallaste tu meta')` — usar `toast('Ajustemos juntos mañana 🌿')`
7. **Errores de API:** envolver con `useErrorHandling().handleApiError(e)`. Maneja 401 (logout + redirect), 404 y otros automáticamente.
8. **Páginas exportadas** en barrel [src/pages/index.ts](src/pages/index.ts) y consumidas vía [src/routes/Routes.tsx](src/routes/Routes.tsx).
9. **Guards de ruta:**
   - `<NotAuthRoute>` → solo accesible sin sesión (login, register).
   - `<AuthRoute>` → requiere sesión activa.
   - Dentro de `AuthRoute` se valida `profile.onboarding_completed`. Si es `false` y la ruta no es `/onboarding`, redirige a onboarding.
10. **Motores en `features/` son funciones puras** — sin acceso a red ni a stores. Reciben input, devuelven output. Esto los hace 100% testeables con Vitest.
11. **Lenguaje obligatorio compasivo en UI.** Cero "fallaste", "error", "incorrecto". Siempre "ajustemos", "intentemos de nuevo", "no salió como esperábamos".
12. **Modo oscuro y claro siempre soportados.** Componentes nunca hardcodean color hex; usan tokens (`bg-background`, `text-foreground`, `bg-primary`).
13. **Mobile-first absoluto.** Diseñar para 375px primero. Probar con DevTools en modo móvil antes de cada PR.

### Patrón de página típico
```tsx
import { useQuery } from '@tanstack/react-query'
import { fntGetXxx } from '@/api/fntXxx'
import { useErrorHandling } from '@/hooks'
import { TitleUI, LoaderUI } from '@/components'

const MiPage = () => {
   const { handleApiError } = useErrorHandling()
   const { data, isLoading, refetch } = useQuery({
      queryKey: ['xxx', filters],
      queryFn: () => fntGetXxx(filters),
      onError: (e) => handleApiError(e)
   })

   if (isLoading) return <LoaderUI />
   return (
      <>
         <TitleUI title='Mi módulo' />
         {/* … */}
      </>
   )
}
export default MiPage
```

### Identidad visual (tokens Tailwind)
Definir en `tailwind.config.js` y `src/styles/globals.css` como CSS variables:

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

**Tipografía:** `Inter` (UI) + `DM Serif Display` (headers grandes), ambas Google Fonts con `<link rel='preconnect'>`.

**NUNCA usar rojo punitivo (`#FF0000`, `#DC2626`) para señalar errores del usuario.** Usar coral suave o naranja cálido.

---

## 6. Autenticación y autorización

### Flujo
1. **Login** → cliente llama `supabase.auth.signInWithPassword()` o `signInWithOAuth({ provider: 'google' })`. Supabase devuelve `session` con `access_token` JWT.
2. **Frontend** guarda la sesión en `localStorage` (manejo automático del SDK con `persistSession: true`) y refleja el usuario en `useAuthStore`.
3. **Cada request** del SDK inyecta automáticamente el JWT como `Authorization: Bearer <access_token>`. No hay interceptor manual.
4. **Refresh** automático con `autoRefreshToken: true`. La sesión se renueva sin intervención.
5. **RLS de Postgres** valida en cada query que `auth.uid()` coincida con `user_id`. No hay middleware adicional necesario.
6. **Edge Functions** validan `req.headers.get('Authorization')`, instancian un cliente con ese token y llaman `supabase.auth.getUser()` para confirmar identidad.
7. **Onboarding gate:** después del login, `useAuthStore` carga el `profile`. Si `profile.onboarding_completed === false`, el guard `AuthRoute` redirige a `/onboarding` excepto si ya está ahí.

### Estados de usuario
- **Anónimo** → solo accede a `/login`, `/register`, `/forgot-password`, `/`.
- **Autenticado sin onboarding** → solo `/onboarding/*` y `/perfil`.
- **Autenticado con onboarding completo** → toda la app.

> **Importante:** la decisión de qué pantalla mostrar nunca depende de roles, solo del estado del perfil. Esto simplifica enormemente vs un sistema con `permissionsAuth`.

### Datos sensibles
- Contraseñas **nunca** llegan al backend — Supabase Auth las hashea con bcrypt internamente.
- Información médica del perfil (`medical_conditions`) se guarda cifrada en reposo por Postgres (Supabase usa AES-256 a nivel de disco). RLS impide que ningún otro usuario la lea.
- Storage buckets son privados; los URLs de fotos requieren signed URLs con TTL corto.

---

## 7. Manejo de errores

### Backend (Edge Functions)
```ts
try {
   // …
   return jsonRes({ msg: 'OK', data })
} catch (e) {
   console.error(e)
   return jsonRes({ msg: e.message || 'Algo no salió como esperábamos 🌱' }, 500)
}
```
Errores de auth se mapean a 401 directamente. Nunca exponer `e.stack` ni queries SQL al cliente.

### Frontend
- **Hook obligatorio:** `useErrorHandling()` para cualquier llamada al backend.
- **401** → `signOut()` automático + toast `'Tu sesión expiró, vuelve a entrar 🌱'` + redirect a `/login`.
- **404** → toast `'No encontramos eso 🍃'`.
- **400/422** → muestra `error.message` del SDK directamente (ya viene en español si es de Supabase Auth).
- **Otros** → toast genérico compasivo `'Algo no salió como esperábamos, intentemos de nuevo 🌿'`.
- **Offline detectado** (`navigator.onLine === false`) → toast `'Sin conexión, guardamos local y sincronizamos después 📡'` y la mutación se encola en Dexie.

### Errores de validación de zod en formularios
Los errores se muestran inline en el campo correspondiente (componente `FormField` de shadcn). **Nunca toast** para errores de formulario — distrae y obliga al usuario a buscar el campo.

---

## 8. Estilo y commits

- **Indentación:** 3 espacios.
- **Comillas simples**, sin `;` final, JSX en PascalCase.
- **Husky + lint-staged** corren ESLint + Prettier al hacer commit.
- **Mensajes de commit en español**, breves, en pasado/imperativo:
   - `Agregada estructura base PWA con vite-plugin-pwa`
   - `Agregado login con Supabase Auth y Google OAuth`
   - `Agregado motor de cálculo nutricional TMB/GET/macros`
   - `Corregido tono de toasts en formulario de onboarding`

---

## 9. Principios de producto no negociables

Cada decisión de código, diseño y copy debe pasar este filtro: **¿Roberto (usuario promedio que ha abandonado 5 apps fitness) seguiría usando PulseFit después de esto?** Si la respuesta es no, replantea.

1. **Fricción mínima de registro** — máximo 3 taps para registrar cualquier acción.
2. **Lenguaje compasivo** — nunca "fallaste", siempre "ajustemos". Sin colores rojos punitivos.
3. **Flexibilidad real** — días libres, comidas trampa, modo "hoy no puedo".
4. **Claridad inmediata** — al abrir la app, en 2 segundos el usuario sabe qué hacer hoy.
5. **Apoyo emocional, no juicio** — la app es coach, no jefe.
6. **Mobile-first absoluto.**
7. **Modo oscuro nativo** desde el día 1.
8. **Accesibilidad WCAG AA mínimo.**
9. **Offline-first** en lo crítico (ver plan, registrar comida/entrenamiento).
10. **Cero costos operativos en MVP** — todo en free tiers.

---

## 10. Roadmap por fases

| Fase | Descripción | Estado |
|------|-------------|--------|
| **1** | Setup base (Vite + React + TS + Tailwind + PWA + estructura) | A construir |
| **2** | Diseño y componentes base (paleta, shadcn, AppShell, BottomNav) | A construir |
| **3** | Auth + Estructura + PWA operativa (Supabase, login, guards, offline) | A construir |
| 4 | Onboarding completo + cálculos nutricionales | Siguiente |
| 5 | Motor de plan de comidas con generador híbrido (Open Food Facts + Groq + validador + fallback) | Siguiente |
| 6 | Motor de plan de entrenamiento con generador híbrido (wger + Groq + validador + fallback) | Siguiente |
| 7 | Home dinámico + registro rápido (3 taps) | Siguiente |
| 8 | Sistema de rescates adaptativos | Siguiente |
| 9 | Progreso, gráficas, logros | Siguiente |
| 10 | Sistema de revisión semanal + IA Groq | Siguiente |
| 11 | Detección de patrones | Siguiente |
| 12 | Beta cerrada con 30 usuarios reales | Siguiente |

> Este prompt cubre **Fases 1, 2 y 3**. Al terminar la Fase 3, generar `PHASE_3_REPORT.md` con el estado y los pasos para iniciar la Fase 4.

---

## 11. Checklist al terminar un cambio

### Backend (Supabase)
- [ ] Migración SQL aplicada y probada localmente con `supabase db reset`.
- [ ] RLS habilitado en cualquier tabla nueva con datos de usuario.
- [ ] Policy `auth.uid() = user_id` creada (o equivalente).
- [ ] Catálogos públicos con policy `FOR SELECT USING (true)`.
- [ ] Edge Function (si aplica) valida `Authorization` header y `supabase.auth.getUser()`.
- [ ] Edge Function devuelve `{ msg, data? }` con status correcto.
- [ ] Variables sensibles leídas de `Deno.env`, no hardcodeadas.
- [ ] `console.error` en catch, mensaje compasivo en respuesta.

### Frontend
- [ ] Función `fnt*` en `src/api/...` usa el cliente Supabase configurado.
- [ ] Tipo TS en `src/interface/...` con prefijo `Itf`/`itf`.
- [ ] Página/componente envuelve calls con `useErrorHandling`.
- [ ] Toasts con tono compasivo y emoji al final.
- [ ] Ruta agregada en [App.tsx](src/App.tsx) bajo `AuthRoute`/`NotAuthRoute`.
- [ ] Página exportada en [pages/index.ts](src/pages/index.ts) y [routes/Routes.tsx](src/routes/Routes.tsx).
- [ ] `pnpm format` (eslint + prettier) corrido.
- [ ] Build verificado: `pnpm build`.
- [ ] Probado en DevTools mobile (375px) antes de cerrar el cambio.
- [ ] Modo oscuro probado.
- [ ] Accesible por teclado (focus visible, navegación con tab).

### Ambos
- [ ] Nombres de Edge Function coinciden exactamente entre frontend (`fntXxx`) y backend (carpeta `supabase/functions/xxx`).
- [ ] Si hay subida de archivos: bucket de Storage configurado con policy + cliente usa `supabase.storage.from(bucket).upload(...)`.
- [ ] Commit con mensaje en español.

---

## 12. Tareas a ejecutar — Fases 1, 2 y 3

> **Instrucciones para Claude Code:**
> 1. Lee este documento completo antes de generar código.
> 2. Trabaja las tareas **en orden estricto**. Marca cada una como completada antes de pasar a la siguiente.
> 3. Antes de cada commit lógico, corre lint, type-check y tests.
> 4. No inventes dependencias ni features fuera de lo especificado. Si algo no está definido, opta por: (a) la opción más simple, (b) la más accesible, (c) la más compasiva con el usuario.
> 5. Replica los patrones del módulo más cercano antes de inventar uno nuevo. La consistencia con el código vecino es la regla #1.
> 6. Cuando termines la Fase 3, genera `PHASE_3_REPORT.md` con: tareas completadas vs pendientes, capturas de Lighthouse, instrucciones para Fase 4, issues conocidos.
> 7. **No avances a Fase 4** hasta cumplir TODOS los criterios de aceptación abajo.

---

### 🟢 FASE 1 — Setup base

**Objetivo:** proyecto inicializado, deployable, con estructura de carpetas y herramientas listas.

1. Inicializar proyecto: `pnpm create vite@latest client-pulsefit -- --template react-ts`.
2. Inicializar Supabase: `npx supabase init` en la raíz del repo (junto a `client-pulsefit/`).
3. Instalar dependencias frontend (versiones estables al momento):
   ```
   @supabase/supabase-js @tanstack/react-query react-router-dom
   react-hook-form @hookform/resolvers zod zustand
   dexie dexie-react-hooks framer-motion lucide-react
   recharts date-fns clsx tailwind-merge class-variance-authority sonner
   ```
   Dev: `tailwindcss postcss autoprefixer vite-plugin-pwa vitest @playwright/test eslint prettier husky lint-staged @typescript-eslint/parser @typescript-eslint/eslint-plugin`
4. Configurar Tailwind CSS con `darkMode: 'class'` y la paleta PulseFit en CSS variables.
5. Configurar `vite-plugin-pwa` con manifest completo (nombre `PulseFit`, theme color `#6B8E5A`, background `#FAFAF7`, locale `es`, `display: standalone`).
6. Generar iconos placeholder en `public/icons/` (192, 512, maskable variants, apple-touch-icon).
7. Crear estructura de carpetas exacta según sección 5, con `index.ts` placeholder donde corresponda.
8. Configurar `tsconfig.json` strict + path alias `@/*` → `src/*`.
9. Configurar `vite.config.ts` con alias `@` y `vite-plugin-pwa`.
10. Configurar ESLint + Prettier con: indentación 3 espacios, comillas simples, sin punto y coma. Husky + lint-staged.
11. Configurar Vitest (`vitest.config.ts`) y Playwright (`playwright.config.ts`).
12. Crear `.env.example` y `.env.local` (gitignored).

### 🟢 FASE 2 — Diseño y componentes base

**Objetivo:** sistema de diseño funcional, layout principal, componentes reutilizables.

13. Importar fuentes Inter y DM Serif Display desde Google Fonts en `index.html` con `<link rel='preconnect'>`.
14. Crear `src/styles/globals.css` con todas las CSS variables (light + dark), reset, tipografía base.
15. Configurar shadcn/ui (`npx shadcn-ui@latest init`) con la paleta PulseFit y agregar primitivos: `button`, `input`, `label`, `card`, `dialog`, `tabs`, `toast`, `slider`, `select`, `checkbox`, `radio-group`, `progress`, `avatar`, `separator`, `form`, `switch`.
16. Personalizar componentes shadcn para usar tokens PulseFit (no defaults).
17. Crear `src/themes/` con tokens y configuración de `next-themes` o sistema propio de Zustand para modo oscuro/claro/sistema.
18. Crear `src/store/ui.ts` (Zustand) con `theme`, `setTheme`, persist.
19. Crear `src/hooks/useTheme.ts` que sincroniza store con `<html class='dark'>`.
20. Crear `src/layout/AppShell.tsx` que envuelve TopBar + contenido + BottomNav, con padding inferior para no chocar con la nav.
21. Crear `src/layout/BottomNav.tsx` con 5 secciones: Home, Plan, Registrar (botón central destacado, accent coral), Progreso, Perfil. Iconos Lucide.
22. Crear `src/layout/TopBar.tsx` con saludo dinámico (buenos días/tardes/noches según hora), avatar, botón de notificaciones placeholder.
23. Crear componentes en `src/components/`:
   - `TitleUI.tsx` — título de página con tipografía DM Serif Display.
   - `LoaderUI.tsx` — spinner compasivo con mensaje rotativo ("Preparando tu día…").
   - `EmptyState.tsx` — estado vacío con ilustración + mensaje cálido + CTA opcional.
   - `ErrorBoundary.tsx` — captura errores React, muestra mensaje compasivo, botón "Recargar".
24. Configurar `sonner` (Toaster montado en `AppWithCustomization.tsx`) con tema integrado al modo oscuro.
25. Exportar barrel en `src/components/index.ts`.

### 🟢 FASE 3 — Auth + Estructura + PWA operativa

**Objetivo:** usuarios pueden registrarse, iniciar sesión, instalar la PWA, y la app es 100% operativa offline en navegación básica.

26. Crear cliente Supabase en `src/api/supabaseConf.ts`:
   ```ts
   import { createClient } from '@supabase/supabase-js'
   import type { Database } from '@/interface/database'

   export const supabase = createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
   )
   ```
27. Crear migración inicial `supabase/migrations/20250101000000_initial_schema.sql` con TODO el esquema (profiles, meal_plans, meal_plan_items, workout_plans, workout_plan_items, daily_logs, meal_logs, workout_logs, rescue_events, pattern_insights, reviews, foods_cache, exercises_catalog, restaurant_guides, achievements, user_achievements, notifications) + RLS + triggers (`handle_new_user`, `update_updated_at`). Esquema completo está documentado al final de este archivo.
28. Aplicar migración local con `npx supabase db reset`.
29. Generar tipos TypeScript: `npx supabase gen types typescript --local > src/interface/database.ts`. Crear script `pnpm types:db` en package.json.
30. Configurar Supabase Auth: en dashboard local activar email/password y Google OAuth (en producción agregar credenciales reales).
31. Crear `src/store/auth.ts` (Zustand persist) con: `user`, `profile`, `session`, `loading`, `signIn`, `signUp`, `signOut`, `signInWithGoogle`, `loadProfile`, `updateProfile`. Suscribirse a `supabase.auth.onAuthStateChange` para mantener sincronizado.
32. Crear `src/hooks/useAuth.ts` que expone el store con sintaxis cómoda.
33. Crear `src/hooks/useErrorHandling.ts` con manejo de 401 (logout + redirect), 404 (toast), 400/422 (mensaje del error), genérico (toast compasivo).
34. Crear `src/validations/authSchemas.ts` con esquemas zod: `loginSchema`, `registerSchema`, `forgotPasswordSchema`. Mensajes en español compasivo.
35. Crear `src/api/fntAuth.ts` con: `fntSignIn`, `fntSignUp`, `fntSignOut`, `fntSignInWithGoogle`, `fntForgotPassword`, `fntGetProfile`, `fntUpdateProfile`.
36. Crear páginas de auth:
   - `src/pages/auth/LoginPage.tsx` — formulario email + password, botón Google, links a registro y recuperar.
   - `src/pages/auth/RegisterPage.tsx` — formulario con confirmación de password y aceptación de términos.
   - `src/pages/auth/ForgotPasswordPage.tsx` — flujo de recuperación por email.
37. Crear `src/routes/AuthRoute.tsx` y `src/routes/NotAuthRoute.tsx` con la lógica:
   - `NotAuthRoute`: si hay sesión → redirige a `/home` (o `/onboarding` si no completó).
   - `AuthRoute`: si no hay sesión → redirige a `/login`. Si hay sesión pero `onboarding_completed === false` y la ruta no es `/onboarding` → redirige a `/onboarding`.
38. Crear `src/routes/Routes.tsx` (barrel) y `src/App.tsx` con BrowserRouter y todas las rutas:
   - Públicas: `/`, `/login`, `/register`, `/forgot-password`.
   - Privadas: `/home`, `/onboarding/*`, `/perfil`, y placeholders de `/plan`, `/registrar`, `/progreso`, `/rescate`.
   - 404: `<NotFoundPage />` con mensaje compasivo.
39. Crear placeholder `src/pages/onboarding/OnboardingShell.tsx` con barra de progreso (7 pasos) y mensaje "Próximamente — Fase 4".
40. Crear placeholder `src/pages/home/HomePage.tsx` con saludo y mensaje "Tu plan llegará pronto, terminaremos esto en Fase 4".
41. Crear `src/pages/profile/ProfilePage.tsx` con:
   - Datos básicos del perfil (nombre, email).
   - Toggle de tema (claro/oscuro/sistema).
   - Botón de cerrar sesión (con confirmación dialog).
   - Links a política de privacidad y términos (placeholders).
   - Botón "Eliminar mi cuenta" (placeholder, sin lógica todavía).
42. Crear `src/AppWithCustomization.tsx` con providers: QueryClientProvider, ErrorBoundary global, Sonner Toaster, ThemeProvider.

### 🟢 FASE 3.5 — Offline y PWA polish

43. Crear `src/lib/dexie-db.ts` con esquema IndexedDB que mirrorea tablas críticas (profiles, daily_logs, meal_logs, workout_logs, rescue_events).
44. Crear `src/lib/sync-manager.ts` con cola de operaciones offline y flush automático al recuperar conexión.
45. Crear `src/hooks/useOnlineStatus.ts` que detecta `navigator.onLine` + eventos online/offline + dispara sync.
46. Configurar service worker con estrategias en `vite.config.ts`: app shell `CacheFirst`, API Supabase `NetworkFirst` con fallback, fonts `CacheFirst` con expiración 1 año.
47. Crear `src/lib/pwa.ts` con utilidad para detectar instalación, mostrar prompt `beforeinstallprompt`, manejar updates del SW.
48. Verificar PWA con Lighthouse — debe pasar **PWA 100, Performance 90+, Accessibility 90+, Best Practices 90+**. Documentar en README.

### 🟢 FASE 3.6 — Testing y CI/CD

49. Configurar Vitest y crear tests:
   - `src/api/supabaseConf.test.ts` (smoke).
   - `src/hooks/useAuth.test.ts` (mock supabase).
   - `src/store/auth.test.ts` (acciones Zustand).
   - `src/validations/authSchemas.test.ts` (esquemas zod casos válidos e inválidos).
   - `src/components/ErrorBoundary.test.tsx`.
50. Configurar Playwright con `playwright.config.ts`. Crear test E2E:
   - `tests/e2e/auth.spec.ts` — flujo completo: register → login → ver home placeholder → logout.
51. Crear workflow `.github/workflows/ci.yml` con jobs: lint, type-check, unit tests, build.
52. Configurar deploy a Vercel vinculado al repo, con env vars en dashboard. Configurar también Supabase production project.
53. Documentar en `README.md` y `DEVELOPMENT.md` (este archivo): setup local desde cero en menos de 10 minutos, comandos disponibles, decisiones arquitectónicas, próximos pasos.

---

## 🎯 Criterios de aceptación de la Fase 3

Al terminar, el proyecto debe cumplir TODOS estos puntos. Sin excepciones.

1. ✅ Repo deployable en Vercel con un push.
2. ✅ Supabase configurado, esquema completo aplicado, RLS activo en todas las tablas con `user_id`.
3. ✅ Usuario puede registrarse con email o Google, recibir confirmación, iniciar sesión, recuperar contraseña.
4. ✅ Al iniciar sesión por primera vez, redirige a `/onboarding` (placeholder Fase 4); si ya completó, va a `/home`.
5. ✅ La app es instalable como PWA en Android y iOS (modo standalone).
6. ✅ Funciona offline en navegación y lectura de datos cacheados.
7. ✅ Modo oscuro funcional, conmutable desde perfil.
8. ✅ Lighthouse: PWA 100, Performance 90+, Accessibility 90+, Best Practices 90+.
9. ✅ Tests unitarios pasan (mínimo 5).
10. ✅ Test E2E de flujo de auth completo pasa.
11. ✅ CI pasa en GitHub Actions con cada push.
12. ✅ README permite setup local desde cero en menos de 10 minutos.
13. ✅ TypeScript estricto, cero `any` no justificado.
14. ✅ Toda la UI en español, tono compasivo, cero mensajes punitivos.
15. ✅ Accesible por teclado, contraste verificado, focus visible.
16. ✅ Indentación 3 espacios, comillas simples, sin punto y coma en todo el código.
17. ✅ Funciones API con prefijo `fnt`, tipos con prefijo `Itf`/`itf`.

---

## 📚 Esquema SQL completo (referencia para tarea 27)

```sql
-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS 'uuid-ossp';

-- ============================================
-- USUARIOS Y PERFIL
-- ============================================
CREATE TABLE profiles (
   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
   email TEXT UNIQUE,
   name TEXT,
   age INT CHECK (age >= 13 AND age <= 120),
   sex TEXT CHECK (sex IN ('male', 'female', 'prefer_not_to_say')),
   height_cm DECIMAL(5,2),
   initial_weight_kg DECIMAL(5,2),
   current_weight_kg DECIMAL(5,2),
   target_weight_kg DECIMAL(5,2),
   target_date DATE,
   goal TEXT CHECK (goal IN ('lose', 'gain', 'maintain', 'feel_better')),
   activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
   fitness_level TEXT CHECK (fitness_level IN ('absolute_beginner', 'beginner', 'intermediate', 'advanced')),
   available_days INT[],
   available_minutes INT,
   equipment TEXT[],
   cooks_at_home TEXT CHECK (cooks_at_home IN ('yes', 'sometimes', 'rarely')),
   dietary_restrictions TEXT[],
   allergies TEXT,
   disliked_foods TEXT[],
   budget_level TEXT CHECK (budget_level IN ('low', 'medium', 'high')),
   medical_conditions TEXT[],
   tmb DECIMAL(7,2),
   get_kcal DECIMAL(7,2),
   target_kcal DECIMAL(7,2),
   target_protein_g DECIMAL(6,2),
   target_carbs_g DECIMAL(6,2),
   target_fats_g DECIMAL(6,2),
   onboarding_completed BOOLEAN DEFAULT FALSE,
   region TEXT DEFAULT 'LATAM',
   locale TEXT DEFAULT 'es',
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PLANES DE COMIDA
CREATE TABLE meal_plans (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   week_start_date DATE NOT NULL,
   is_active BOOLEAN DEFAULT TRUE,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_meal_plans_user_active ON meal_plans(user_id, is_active);

CREATE TABLE meal_plan_items (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
   day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
   meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack_am', 'snack_pm')),
   meal_name TEXT NOT NULL,
   ingredients JSONB,
   kcal DECIMAL(7,2),
   protein_g DECIMAL(6,2),
   carbs_g DECIMAL(6,2),
   fats_g DECIMAL(6,2),
   prep_time_min INT,
   difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
   recipe_steps TEXT[]
);

-- PLANES DE ENTRENAMIENTO
CREATE TABLE workout_plans (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   week_start_date DATE NOT NULL,
   is_active BOOLEAN DEFAULT TRUE,
   routine_type TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_workout_plans_user_active ON workout_plans(user_id, is_active);

CREATE TABLE workout_plan_items (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
   day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
   session_name TEXT,
   estimated_duration_min INT,
   exercises JSONB
);

-- REGISTROS DIARIOS
CREATE TABLE daily_logs (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   log_date DATE NOT NULL,
   weight_kg DECIMAL(5,2),
   energy_level INT CHECK (energy_level BETWEEN 1 AND 5),
   mood_level INT CHECK (mood_level BETWEEN 1 AND 5),
   sleep_hours DECIMAL(3,1),
   water_ml INT,
   steps INT,
   notes TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   UNIQUE(user_id, log_date)
);
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);

CREATE TABLE meal_logs (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   log_date DATE NOT NULL,
   meal_type TEXT,
   status TEXT CHECK (status IN ('planned_completed', 'substituted', 'skipped', 'extra')),
   planned_item_id UUID REFERENCES meal_plan_items(id),
   actual_meal_name TEXT,
   actual_kcal DECIMAL(7,2),
   actual_protein_g DECIMAL(6,2),
   actual_carbs_g DECIMAL(6,2),
   actual_fats_g DECIMAL(6,2),
   photo_url TEXT,
   notes TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, log_date DESC);

CREATE TABLE workout_logs (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   log_date DATE NOT NULL,
   planned_session_id UUID,
   status TEXT CHECK (status IN ('completed', 'partial', 'rescued', 'skipped')),
   duration_min INT,
   exercises_completed JSONB,
   rpe_average DECIMAL(3,1),
   pain_reported TEXT[],
   notes TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, log_date DESC);

-- RESCATES
CREATE TABLE rescue_events (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   event_date DATE NOT NULL,
   event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   trigger_type TEXT CHECK (trigger_type IN ('workout_skip', 'meal_change', 'no_cooking', 'eating_out', 'low_mood', 'no_energy', 'injury', 'craving')),
   reason TEXT,
   original_plan JSONB,
   alternatives_offered JSONB,
   alternative_chosen JSONB,
   user_completed BOOLEAN
);
CREATE INDEX idx_rescue_events_user ON rescue_events(user_id, event_date DESC);

CREATE TABLE pattern_insights (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   pattern_type TEXT,
   description TEXT,
   data JSONB,
   detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   applied BOOLEAN DEFAULT FALSE
);

-- REVISIONES
CREATE TABLE reviews (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   review_date DATE NOT NULL,
   period_start DATE,
   period_end DATE,
   metrics JSONB,
   observations TEXT[],
   proposed_changes JSONB,
   user_decision TEXT CHECK (user_decision IN ('accepted_all', 'partial', 'rejected', 'pending')),
   applied_changes JSONB,
   ai_message TEXT,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CATÁLOGOS
CREATE TABLE foods_cache (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   external_id TEXT,
   source TEXT CHECK (source IN ('openfoodfacts', 'usda', 'manual', 'local')),
   name TEXT NOT NULL,
   brand TEXT,
   serving_size_g DECIMAL(7,2),
   kcal_per_100g DECIMAL(7,2),
   protein_per_100g DECIMAL(6,2),
   carbs_per_100g DECIMAL(6,2),
   fats_per_100g DECIMAL(6,2),
   region TEXT,
   search_count INT DEFAULT 0,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_foods_search ON foods_cache USING gin(to_tsvector('spanish', name));

CREATE TABLE exercises_catalog (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   external_id TEXT,
   name TEXT NOT NULL,
   muscle_groups TEXT[],
   equipment_required TEXT[],
   difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
   video_url TEXT,
   gif_url TEXT,
   description TEXT,
   form_tips TEXT[],
   alternatives UUID[]
);

CREATE TABLE restaurant_guides (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   cuisine_type TEXT NOT NULL,
   recommended_orders JSONB,
   avoid_list TEXT[],
   tips TEXT
);

-- GAMIFICACIÓN
CREATE TABLE achievements (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   code TEXT UNIQUE NOT NULL,
   name TEXT NOT NULL,
   description TEXT,
   icon TEXT,
   criteria JSONB
);

CREATE TABLE user_achievements (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   achievement_id UUID REFERENCES achievements(id),
   unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   UNIQUE(user_id, achievement_id)
);

CREATE TABLE notifications (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
   type TEXT,
   title TEXT,
   body TEXT,
   scheduled_for TIMESTAMP WITH TIME ZONE,
   sent_at TIMESTAMP WITH TIME ZONE,
   read_at TIMESTAMP WITH TIME ZONE
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rescue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY 'users_own_profile' ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY 'users_own_meal_plans' ON meal_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY 'users_own_meal_plan_items' ON meal_plan_items FOR ALL USING (EXISTS (SELECT 1 FROM meal_plans WHERE meal_plans.id = meal_plan_items.plan_id AND meal_plans.user_id = auth.uid()));
CREATE POLICY 'users_own_workout_plans' ON workout_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY 'users_own_workout_plan_items' ON workout_plan_items FOR ALL USING (EXISTS (SELECT 1 FROM workout_plans WHERE workout_plans.id = workout_plan_items.plan_id AND workout_plans.user_id = auth.uid()));
CREATE POLICY 'users_own_daily_logs' ON daily_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY 'users_own_meal_logs' ON meal_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY 'users_own_workout_logs' ON workout_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY 'users_own_rescue_events' ON rescue_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY 'users_own_pattern_insights' ON pattern_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY 'users_own_reviews' ON reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY 'users_own_achievements' ON user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY 'users_own_notifications' ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY 'public_foods_read' ON foods_cache FOR SELECT USING (true);
CREATE POLICY 'public_exercises_read' ON exercises_catalog FOR SELECT USING (true);
CREATE POLICY 'public_restaurants_read' ON restaurant_guides FOR SELECT USING (true);
CREATE POLICY 'public_achievements_read' ON achievements FOR SELECT USING (true);

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
   INSERT INTO public.profiles (id, email, name)
   VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
   BEFORE UPDATE ON profiles
   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

## 13. Estructura de los motores generadores híbridos

Las Fases 5 y 6 implementan los motores que producen el contenido real del plan del usuario. Siguen estructura idéntica:

### `src/features/meal-generator/`
```
meal-generator/
├── index.ts                    # API pública del motor
├── nutritional-target.ts       # calcula macros target por comida (usa fórmulas de Lucía)
├── ingredient-pool.ts          # consulta Open Food Facts + foods_cache, filtra por perfil
├── component-selector.ts       # arma combinación de ingredientes con cantidades exactas
├── ai-plate-composer.ts        # cliente Groq con prompt restringido (solo Edge Function)
├── plate-validator.ts          # valida output de IA, rechaza si rompe restricciones
├── fallback-templates.ts       # 3 plantillas determinísticas si IA falla 2 veces
└── types.ts                    # ItfMealComponents, ItfPlateOption, ItfValidation, …
```

### `src/features/routine-generator/`
```
routine-generator/
├── index.ts                    # API pública del motor
├── session-planner.ts          # determina objetivo del día (focus, RPE, tiempo)
├── exercise-pool.ts            # consulta wger + exercises_catalog, filtra por nivel/lesiones
├── exercise-selector.ts        # elige por patrón siguiendo plantilla por tiempo
├── set-rep-calculator.ts       # aplica reglas de Carlos: progresión, descansos, descarga
├── ai-routine-organizer.ts     # cliente Groq con prompt restringido (solo Edge Function)
├── routine-validator.ts        # valida output de IA, rechaza si modifica prescripción
├── fallback-templates.ts       # plantilla genérica orden-alfabético + tips por patrón
└── types.ts                    # ItfPrescribedExercise, ItfOrganizedSession, …
```

### Edge Functions asociadas
- `supabase/functions/generate-meal-options/` — orquesta el flujo de comidas (etapas 1-7).
- `supabase/functions/generate-workout-session/` — orquesta el flujo de rutinas (etapas 1-7).

Ambas reciben input del cliente (perfil + objetivos del día), llaman al motor determinístico, llaman a Groq con prompt restringido, validan, devuelven opciones o caen a fallback.

### Características obligatorias

| Característica | Detalle |
|----------------|---------|
| Funciones puras en motores | Sin red, sin stores, sin acceso a Supabase. 100% testeable con Vitest. |
| Validación estricta de outputs IA | Reglas en `plate-validator.ts` y `routine-validator.ts`. Reintenta 1 vez con prompt más estricto, luego fallback. |
| Fallback siempre disponible | La app NUNCA queda sin plan, aunque Groq esté caído o sin cuota. |
| Tests unitarios > 90% cobertura en motores | Vitest. Lista mínima de tests en `generadores-hibridos.md` sección 11. |
| Logs de fallback en `pattern_insights` | Para análisis de calidad del prompt en producción. |
| Rate limit por usuario | 30 generaciones de comida + 10 de rutina por día (free tier Groq). |

### Variables de entorno requeridas

Configurar en Supabase (`npx supabase secrets set`):

```
GROQ_API_KEY=<key del free tier>
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_TEMPERATURE_MEAL=0.4
GROQ_TEMPERATURE_ROUTINE=0.3
GROQ_TIMEOUT_MS=8000
```

Nunca exponer la API key al cliente. El frontend solo invoca las Edge Functions vía SDK, jamás llama directamente a Groq.

### Tareas concretas que vendrá tocar al iniciar Fase 5 y Fase 6

- Construir motor `meal-generator` completo con sus 7 capas (incluidos tests).
- Construir motor `routine-generator` completo con sus 7 capas (incluidos tests).
- Construir Edge Functions `generate-meal-options/` y `generate-workout-session/` siguiendo el patrón de `_shared/cors.ts` + `jsonRes`.
- Implementar `plate-validator` y `routine-validator` con cobertura completa de los reasons documentados.
- Implementar `fallback-templates` con plantillas que nunca fallen.
- Configurar `GROQ_API_KEY` y demás secrets en Supabase (local + producción).
- Documentar en `MEMORY.md` el sistema de caché compartido (`shared_meal_templates`) y las reglas de rate limiting cuando se implementen.
- Agregar tests E2E que ejerzan el flujo completo onboarding → plan generado.

> Detalle exhaustivo (flujos, prompts exactos a Groq, ejemplos few-shot, reglas del validador, plantillas de fallback, métricas de monitoreo) en `references/generadores-hibridos.md`.

---

> **Convenio de oro del proyecto:** *replica el patrón del módulo más cercano antes de inventar uno nuevo*. Si vas a tocar Onboarding mira `pages/Onboarding/` + `features/nutrition-engine/`; si tocas Rescates mira `pages/Rescue/` + `features/rescue-engine/`. **La consistencia con el código vecino es la regla #1.**
