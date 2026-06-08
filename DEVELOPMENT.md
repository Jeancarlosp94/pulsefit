# 🛠️ DEVELOPMENT.md — Guía de desarrollo PulseFit

Esta guía complementa el [`README.md`](README.md) con detalles operativos. La fuente única de verdad de convenciones, principios y tono está en [`files/SKILL.md`](files/SKILL.md). El estado actual del proyecto vive en [`files/MEMORY.md`](files/MEMORY.md).

---

## 1. Stack y por qué

| Capa | Elección | Por qué |
|------|----------|---------|
| Framework | React 18 + Vite 5 | Mobile-first sin overhead. Vite 5 + React 18 son la combinación estable más madura para PWAs en 2026. |
| TS | TypeScript 5.6 strict | Cero `any` no justificado. |
| UI | shadcn/ui + Tailwind 3.4 | Control total sobre la paleta PulseFit, sin Antd ni MUI. |
| Estado servidor | @tanstack/react-query v5 | Cache + retries + offline-mode. |
| Estado UI/auth | Zustand con persist | Más simple que Redux, persistencia transparente. |
| Offline | Dexie + dexie-react-hooks | IndexedDB con API agradable. |
| BaaS | Supabase (Postgres + Auth + Edge Functions) | Free tier suficiente para MVP, RLS evita escribir middleware. |
| Toasts | sonner | Tono cálido, integración nativa con tema. |
| Tests | Vitest + Playwright | Vitest comparte config con Vite, Playwright para E2E mobile-first. |

---

## 2. Flujo end-to-end de una feature

Replicar SIEMPRE este patrón vertical:

1. **Migración SQL** en `supabase/migrations/<timestamp>_<descripcion>.sql` (con RLS).
2. **Edge Function** (opcional) en `supabase/functions/<nombre>/index.ts` cuando la lógica no puede ir en el cliente.
3. **API frontend** en `src/api/fnt<Modulo>.ts` (prefijo `fnt`).
4. **Tipos** en `src/interface/itf<Modulo>.ts` (prefijo `Itf`/`itf`).
5. **Lógica pura** (motores) en `src/features/<engine>/`. Funciones puras, testeables con Vitest.
6. **Página/componente** en `src/pages/<Modulo>/<Nombre>Page.tsx` con `useQuery` + `useErrorHandling`.
7. **Ruta y guards** en `src/App.tsx` bajo `<AuthRoute>` o `<NotAuthRoute>`.
8. **Tests** (al menos motor y/o E2E).
9. **Actualizar `files/MEMORY.md`** con la entrada de bitácora.

Ver ejemplo completo en [`files/guia-completa.md`](files/guia-completa.md) sección 3.

---

## 3. Convenciones de código (no negociables)

```
- Indentación 3 espacios (no 2, no 4, no tabs)
- Comillas simples 'texto'
- Sin punto y coma final
- Alias @ → src/
- Componentes PascalCase, .tsx
- Utilidades/tipos/motores .ts
- Funciones API: fntCamelCase
- Interfaces: ItfPascalCase
- Estado servidor → react-query
- Estado UI/auth → Zustand
- Offline → Dexie
```

ESLint + Prettier hacen cumplir 1-3 automáticamente. Husky + lint-staged corren en cada commit.

---

## 4. Tono y lenguaje

**Filtro obligatorio:** ¿Roberto (usuario que ha abandonado 5 apps fitness) seguiría usando PulseFit después de esto?

- Cero "fallaste", "incorrecto", "error". Usar "ajustemos", "intentemos de nuevo", "no salió como esperábamos".
- Toasts compasivos con emoji al final: 🌱 🌿 🍃 💪 🥗 📡.
- **Nunca** rojo punitivo (`#FF0000`, `#DC2626`). La "destructive" usa coral suave.

---

## 5. Manejo de errores

### Backend (Edge Functions)
```ts
try {
   return jsonRes({ msg: 'OK', data })
} catch (e) {
   console.error(e)
   return jsonRes({ msg: e.message || 'Algo no salió como esperábamos 🌱' }, 500)
}
```

### Frontend
- Hook `useErrorHandling()` obligatorio.
- 401 → `signOut()` + toast `'Tu sesión expiró, vuelve a entrar 🌱'` + redirect.
- 404 → toast `'No encontramos eso 🍃'`.
- 400/422 → mostrar `error.message` directo.
- Otros → toast genérico cálido.
- **Validaciones zod en formularios:** SIEMPRE inline en el campo, nunca toast.

---

## 6. Offline-first

El sync se basa en una cola IndexedDB (`pending_ops`). Para encolar:

```ts
import { enqueueOp } from '@/lib'

await enqueueOp({
   table: 'meal_logs',
   operation: 'insert',
   payload: { user_id, log_date, meal_type, status: 'planned_completed' }
})
```

`startSyncManager()` (montado una vez en `AppWithCustomization`) escucha el evento `online` y drena la cola con backoff de hasta 5 intentos.

---

## 7. Auth

- Supabase Auth (email/password + Google OAuth).
- JWT en `localStorage` con clave `pulsefit-auth` (manejado por el SDK).
- RLS valida en cada query. Sin middleware extra.
- **No hay roles múltiples.** Estados:
  - Anónimo → `/`, `/login`, `/register`, `/forgot-password`.
  - Autenticado sin onboarding → solo `/onboarding/*` y `/perfil`.
  - Autenticado con onboarding → toda la app.

Guards:
- `<NotAuthRoute>` en rutas públicas.
- `<AuthRoute>` en rutas privadas (valida `profile.onboarding_completed`).

---

## 8. Testing

### Unit (Vitest + React Testing Library)
```bash
pnpm test                # run once
pnpm test:watch          # watch mode
pnpm test -- --coverage  # cobertura con v8
```

Los tests viven al lado del código (`*.test.ts(x)`) en `src/`.

### E2E (Playwright)
```bash
pnpm test:e2e
pnpm test:e2e -- --ui    # modo UI
pnpm test:e2e -- --project=mobile-chrome  # solo mobile
```

Tests viven en `tests/e2e/*.spec.ts`. La config tiene 3 proyectos: `mobile-chrome`, `mobile-safari`, `desktop-chrome`. Mobile-first absoluto.

---

## 9. PWA y Lighthouse

Objetivos para Fase 3:
- PWA: 100
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+

Para auditar:
```bash
pnpm build && pnpm preview
# En otra terminal:
npx unlighthouse --site http://localhost:4173 --debug
# o usar Lighthouse en DevTools de Chrome
```

El service worker se genera con Workbox (estrategias: `CacheFirst` para fonts/assets, `NetworkFirst` para Supabase API).

---

## 10. Comandos frecuentes

```bash
# Frontend
pnpm dev
pnpm build
pnpm test
pnpm lint
pnpm format

# Supabase
npx supabase start
npx supabase db reset
npx supabase functions serve
npx supabase functions deploy <nombre>
npx supabase gen types typescript --local > client-pulsefit/src/interface/database.ts

# Git
git commit -m "Agregado motor de cálculo nutricional"  # mensajes en español
```

---

## 11. Antes de cerrar un cambio

Checklist mínimo (más detalle en [`files/SKILL.md`](files/SKILL.md)):

### Frontend
- [ ] Función `fnt*` en `src/api/...`.
- [ ] Tipo `Itf*` en `src/interface/...`.
- [ ] Página envuelve calls con `useErrorHandling`.
- [ ] Toasts en tono compasivo + emoji.
- [ ] Ruta agregada en `App.tsx`.
- [ ] `pnpm format` corrido.
- [ ] `pnpm build` verificado.
- [ ] Probado mobile (375px) y modo oscuro.
- [ ] Accesible por teclado.

### Backend
- [ ] Migración aplicada con `supabase db reset`.
- [ ] RLS activo + policy `auth.uid() = user_id`.
- [ ] Edge Function valida Authorization header.
- [ ] Mensaje compasivo en catch.

### Ambos
- [ ] Nombres de Edge Function coinciden frontend/backend.
- [ ] Commit en español.
- [ ] **`files/MEMORY.md` actualizado**.

---

## 12. Recursos

- [`files/SKILL.md`](files/SKILL.md) — convenciones, principios, flujo, checklist.
- [`files/MEMORY.md`](files/MEMORY.md) — estado vivo del proyecto.
- [`files/guia-completa.md`](files/guia-completa.md) — guía completa con esquema SQL y roadmap detallado.
- [`files/formulas-nutricion.md`](files/formulas-nutricion.md) — TMB, GET, macros, validaciones de seguridad.
- [`files/reglas-fitness.md`](files/reglas-fitness.md) — RPE, progresión, ejercicios prohibidos para principiantes.
- [`files/sistema-rescates.md`](files/sistema-rescates.md) — lógica completa del sistema adaptativo.
