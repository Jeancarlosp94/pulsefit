import { test, expect } from '@playwright/test'

/**
 * E2E del flujo de auth (placeholder funcional para Fase 3.6).
 *
 * Sin Supabase corriendo no podemos ejercer un signup real, así que validamos
 * la UI compasiva, las validaciones zod inline y la navegación. Cuando el
 * dev tenga Supabase local con `npx supabase start`, este test se puede
 * extender para hacer el flujo completo register → confirm → login → home.
 */

test.describe('flujo de auth — UI y guards', () => {
   test('landing pública renderiza CTAs principales', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('heading', { name: 'PulseFit' })).toBeVisible()
      await expect(page.getByRole('link', { name: /empezar mi pulsefit/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /ya tengo cuenta/i })).toBeVisible()
   })

   test('navegar de landing a /register y rellenar formulario', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('link', { name: /empezar mi pulsefit/i }).click()
      await expect(page).toHaveURL(/\/register$/)
      await expect(page.getByRole('heading', { name: /empecemos juntos/i })).toBeVisible()
   })

   test('login muestra mensajes compasivos en validación', async ({ page }) => {
      await page.goto('/login')
      await page.getByRole('button', { name: /^entrar$/i }).click()
      /* Mensajes inline (zod) — nunca toast para validaciones de form. */
      await expect(page.getByText(/necesitamos tu correo/i)).toBeVisible()
      await expect(page.getByText(/falta tu contraseña/i)).toBeVisible()
   })

   test('rutas privadas redirigen a /login cuando no hay sesión', async ({ page }) => {
      await page.goto('/home')
      await expect(page).toHaveURL(/\/login$/)
   })

   test('forgot-password navega de vuelta a login', async ({ page }) => {
      await page.goto('/forgot-password')
      await expect(page.getByRole('heading', { name: /recuperar acceso/i })).toBeVisible()
      await page.getByRole('link', { name: /volver al inicio/i }).click()
      await expect(page).toHaveURL(/\/login$/)
   })

   test('404 muestra mensaje compasivo', async ({ page }) => {
      await page.goto('/ruta-que-no-existe')
      await expect(page.getByRole('heading', { name: /no encontramos esto/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /volver al inicio/i })).toBeVisible()
   })

   test('register valida que las contraseñas coincidan', async ({ page }) => {
      await page.goto('/register')
      await page.getByLabel('Correo').fill('test@example.com')
      await page.getByLabel('Contraseña').fill('passwordlong')
      await page.getByLabel('Confírmala').fill('otra-distinta')
      await page.getByRole('button', { name: /crear mi cuenta/i }).click()
      await expect(page.getByText(/no coinciden/i)).toBeVisible()
   })
})
