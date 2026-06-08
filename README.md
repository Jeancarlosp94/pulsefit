# 🌱 PulseFit

> **PWA gratuita de fitness y nutrición adaptativa.** Tu coach compasivo, no tu jefe.
> A tu ritmo, sin juicios, con un sistema único de "rescates" cuando el plan original no se puede cumplir.

[![CI](https://github.com/<org>/pulsefit/actions/workflows/ci.yml/badge.svg)](https://github.com/<org>/pulsefit/actions/workflows/ci.yml)

---

## ⚡ Setup local en menos de 10 minutos

### Requisitos previos
- Node 20+ (probado con 24)
- [pnpm](https://pnpm.io) 10+
- Docker Desktop (para Supabase local)
- Git

### Pasos

```bash
# 1. Clonar
git clone <repo-url> pulsefit
cd pulsefit

# 2. Instalar deps del frontend
cd client-pulsefit
pnpm install

# 3. Variables de entorno
cp .env.example .env.local
# Si vas a usar Supabase local (paso 5), los defaults de .env.local ya funcionan.
# Si vas a producción, pega tu URL y ANON_KEY del dashboard de Supabase.

# 4. Volver a la raíz y arrancar Supabase local (requiere Docker corriendo)
cd ..
npx supabase start          # primera vez tarda ~5 min descargando imágenes
npx supabase db reset       # aplica la migración 20260101000000_initial_schema.sql

# 5. (Opcional) Regenerar tipos TS desde el esquema local
cd client-pulsefit
pnpm types:db

# 6. Arrancar el dev server
pnpm dev                    # http://localhost:5173
```

> ⚠️ **¿No tienes Docker?** El proyecto trae un `database.ts` placeholder y arranca igual con `pnpm dev`. Solo necesitas Docker para que Auth/RLS funcionen contra una DB real localmente.

---

## 🧰 Comandos disponibles

```bash
# Frontend (en client-pulsefit/)
pnpm dev                    # vite dev server (--host, puerto 5173)
pnpm build                  # build de producción + service worker
pnpm preview                # preview local del build
pnpm lint                   # eslint
pnpm format                 # eslint --fix + prettier --write
pnpm type-check             # tsc -b --noEmit
pnpm test                   # vitest run
pnpm test:watch             # vitest --watch
pnpm test:e2e               # playwright test
pnpm types:db               # regenera src/interface/database.ts desde Supabase local

# Supabase (en raíz del repo)
npx supabase start          # arranca Postgres + Auth + Studio en Docker
npx supabase stop           # apaga
npx supabase db reset       # aplica todas las migraciones desde cero
npx supabase functions serve  # corre Edge Functions localmente
```

---

## 🏗️ Estructura

```
pulsefit/
├── client-pulsefit/        # Frontend PWA (React 18 + Vite 5)
│   ├── src/
│   │   ├── api/            # Cliente Supabase + funciones fnt*
│   │   ├── components/     # Reusables + shadcn/ui personalizado
│   │   ├── features/       # Motores de dominio (lógica pura, testeable)
│   │   ├── hooks/          # useAuth, useTheme, useErrorHandling, useOnlineStatus
│   │   ├── interface/      # Tipos Itf* + database.ts (auto-generado)
│   │   ├── layout/         # AppShell, BottomNav, TopBar
│   │   ├── lib/            # dexie-db, sync-manager, pwa
│   │   ├── pages/          # Páginas por dominio
│   │   ├── routes/         # AuthRoute, NotAuthRoute
│   │   ├── store/          # Zustand (auth, ui)
│   │   ├── styles/         # globals.css con paleta PulseFit
│   │   ├── themes/         # tokens
│   │   ├── utils/          # cn, greeting, …
│   │   └── validations/    # Esquemas zod
│   └── tests/e2e/          # Playwright
├── supabase/
│   ├── config.toml
│   ├── migrations/         # 20260101000000_initial_schema.sql (tablas + RLS + triggers)
│   └── functions/          # Edge Functions (Fase 5+)
├── files/                  # Skill docs (SKILL.md, MEMORY.md, references/)
└── .github/workflows/ci.yml
```

---

## 🎨 Identidad

- **Paleta:** verde salvia + mostaza suave + coral cálido. **Cero rojo punitivo.**
- **Tipografía:** Inter (UI) + DM Serif Display (titulares).
- **Iconos:** lucide-react exclusivamente.
- **Modo oscuro nativo** desde el día 1, conmutable desde `/perfil`.
- **Mobile-first 375px**.
- **Lenguaje compasivo** obligatorio: nunca "fallaste", siempre "ajustemos".

---

## 🚀 Deploy

### Frontend → Vercel

1. Importar el repo en Vercel.
2. **Root directory:** `client-pulsefit`.
3. **Framework preset:** Vite.
4. Vars de entorno (Settings → Environment Variables):
   - `VITE_SUPABASE_URL` (URL del proyecto Supabase de producción)
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_ENV=production`
5. Deploy. La config en [`vercel.json`](client-pulsefit/vercel.json) ya configura el SPA fallback y los headers del SW.

### Backend → Supabase

1. Crear proyecto en [supabase.com](https://supabase.com).
2. En el dashboard, **Authentication → Providers**: activar Email + Google OAuth (con credenciales reales).
3. Aplicar la migración:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
4. Configurar secrets para Edge Functions (Fase 5+):
   ```bash
   npx supabase secrets set GROQ_API_KEY=...
   ```

---

## 📐 Decisiones arquitectónicas clave

- **Sin backend Express.** Supabase actúa como BaaS (Postgres + Auth + Storage + Edge Functions Deno).
- **Sin roles múltiples.** Solo dos estados: autenticado / no autenticado, con un sub-flag `onboarding_completed`.
- **RLS activo en TODAS las tablas con `user_id`.** No hay middleware adicional necesario.
- **State management dividido:** servidor → react-query, UI/auth → Zustand, offline → Dexie.
- **Offline-first** en lo crítico: registrar comida/entrenamiento funciona sin conexión, se encola en `pending_ops` (IndexedDB) y se sincroniza al recuperar la red.
- **Cero costos operativos en MVP** — todo en free tiers.

Más detalle en [`files/SKILL.md`](files/SKILL.md), [`files/MEMORY.md`](files/MEMORY.md) y la guía completa en [`files/guia-completa.md`](files/guia-completa.md).

---

## 🧪 CI

GitHub Actions corre en cada push a `main`/`develop` y en cada PR:
- `pnpm lint`
- `pnpm type-check`
- `pnpm test` (vitest)
- `pnpm build`
- E2E con Playwright (mobile-chrome)

Ver [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## 🌍 Roadmap

| Fase | Descripción | Estado |
|------|-------------|--------|
| **1** | Setup base | ✅ |
| **2** | Diseño y componentes base | ✅ |
| **3** | Auth + Estructura + PWA operativa | ✅ |
| 4 | Onboarding completo + cálculos nutricionales | Próxima |
| 5 | Motor de plan de comidas (Open Food Facts) | Pendiente |
| 6 | Motor de plan de entrenamiento (wger) | Pendiente |
| 7 | Home dinámico + registro rápido (3 taps) | Pendiente |
| 8 | Sistema de rescates adaptativos | Pendiente |
| 9 | Progreso, gráficas, logros | Pendiente |
| 10 | Revisión semanal + IA Groq | Pendiente |
| 11 | Detección de patrones | Pendiente |
| 12 | Beta cerrada (30 usuarios) | Pendiente |

Ver el plan detallado en [`PHASE_3_REPORT.md`](PHASE_3_REPORT.md).

---

## 🤝 Contribuir

- Indentación 3 espacios, comillas simples, sin punto y coma.
- Funciones API con prefijo `fnt`.
- Interfaces TS con prefijo `Itf`/`itf`.
- Toasts compasivos con emoji al final.
- Commits en español (pasado/imperativo): "Agregado motor de cálculo nutricional".

Lee [`files/SKILL.md`](files/SKILL.md) antes de proponer cambios — es la fuente única de verdad del proyecto.

---

## 📄 Licencia

Pendiente (probablemente AGPL-3.0 o MIT). El proyecto es 100% gratuito para usuarios finales.
