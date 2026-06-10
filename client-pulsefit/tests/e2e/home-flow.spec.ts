import { test, expect } from '@playwright/test'

/**
 * E2E del flujo del Home dinámico de Fase 7.
 *
 * Sin Supabase corriendo no podemos generar un plan real, así que validamos
 * la UI mostrando el camino del usuario NO autenticado y los guards. Cuando
 * el dev tenga Supabase local con `npx supabase start`, este test se puede
 * extender para hacer el flujo completo onboarding → home → generar plan →
 * registrar comida → registrar peso → registrar mood.
 *
 * Lo que sí podemos validar sin auth:
 *   - Rutas privadas redirigen a /login (guard de AuthRoute).
 *   - Componentes que llegan al render hidratan con shadcn (no crashea).
 *   - El FAB Quick Actions no se renderiza fuera del home (no leak global).
 */

test.describe('flujo Home — Fase 7 (sin auth)', () => {
   test('rutas privadas redirigen a /login', async ({ page }) => {
      const privateRoutes = ['/home', '/plan', '/registrar', '/perfil']
      for (const route of privateRoutes) {
         await page.goto(route)
         await expect(page).toHaveURL(/\/login$/, { timeout: 5000 })
      }
   })

   test('login renderiza sin crashear y muestra CTAs', async ({ page }) => {
      await page.goto('/login')
      await expect(page.getByRole('heading', { name: /bienvenid/i })).toBeVisible()
      /* CTA "no tengo cuenta" lleva a register */
      await page.getByRole('link', { name: /no tengo cuenta/i }).click()
      await expect(page).toHaveURL(/\/register$/)
   })

   test('formulario de register valida campos compasivamente', async ({ page }) => {
      await page.goto('/register')
      await page.getByRole('button', { name: /crear cuenta/i }).click()
      /* Mensajes inline (zod) — sin palabras punitivas. */
      const body = await page.textContent('body')
      expect(body).not.toContain('fallaste')
      expect(body).not.toContain('error')
   })

   test('landing tiene tono compasivo (no punitivismo)', async ({ page }) => {
      await page.goto('/')
      const body = await page.textContent('body')
      /* Reglas inviolables del producto: nunca aparece lenguaje punitivo. */
      expect(body?.toLowerCase()).not.toContain('fallaste')
      expect(body?.toLowerCase()).not.toContain('régimen estricto')
      expect(body?.toLowerCase()).not.toContain('debes')
   })
})

/**
 * Test del español neutro (no voseo) — feature del Sprint 4.
 * Validamos que la UI pública no tenga voseo.
 */
test.describe('UI pública — español neutro LATAM', () => {
   test('login/register usan tuteo, no voseo', async ({ page }) => {
      const pages = ['/', '/login', '/register']
      for (const route of pages) {
         await page.goto(route)
         const body = await page.textContent('body')
         /* Patrones de voseo que NO deben aparecer en la UI. */
         expect(body).not.toContain('tocá')
         expect(body).not.toContain('podés')
         expect(body).not.toContain('cocinás')
         expect(body).not.toContain('querés')
      }
   })
})
