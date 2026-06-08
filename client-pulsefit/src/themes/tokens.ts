/**
 * Tokens de diseño PulseFit. Los valores HSL completos viven en
 * `src/styles/globals.css` como CSS variables. Acá solo exponemos
 * referencias semánticas para que el código TS pueda razonar sobre la paleta
 * sin acoplarse a hex específicos.
 */

export const palette = {
   light: {
      background: 'hsl(60 33% 97%)',
      foreground: 'hsl(132 11% 11%)',
      primary: 'hsl(98 22% 45%)',
      secondary: 'hsl(41 62% 56%)',
      accent: 'hsl(13 75% 63%)'
   },
   dark: {
      background: 'hsl(199 13% 9%)',
      foreground: 'hsl(45 18% 89%)',
      primary: 'hsl(102 22% 59%)',
      secondary: 'hsl(41 62% 56%)',
      accent: 'hsl(13 80% 70%)'
   }
} as const

export type ThemeMode = 'light' | 'dark' | 'system'

/** Mensajes rotativos que muestra el LoaderUI mientras espera. Cero ansiedad. */
export const loaderMessages = [
   'Preparando tu día…',
   'Acomodando las cosas con calma…',
   'Un momento, ya casi está…',
   'Buscando el plan que mejor te queda…',
   'Respirando profundo contigo 🌿'
] as const
