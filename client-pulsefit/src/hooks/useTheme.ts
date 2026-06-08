import { useEffect } from 'react'
import { useUIStore } from '@/store/ui'
import type { ThemeMode } from '@/themes'

/**
 * Sincroniza el store con `<html class='dark'>` y respeta la preferencia del SO
 * cuando el usuario eligió 'system'. Único lugar que toca el DOM para temas.
 */
export const useTheme = () => {
   const theme = useUIStore((s) => s.theme)
   const setTheme = useUIStore((s) => s.setTheme)

   useEffect(() => {
      const root = document.documentElement
      const apply = (mode: ThemeMode) => {
         const isDark =
            mode === 'dark' ||
            (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
         root.classList.toggle('dark', isDark)
         /* Sincronizamos también la meta theme-color para la status bar móvil. */
         const meta = document.querySelector('meta[name="theme-color"]:not([media])')
         if (meta) meta.setAttribute('content', isDark ? '#14181A' : '#6B8E5A')
      }

      apply(theme)

      if (theme === 'system') {
         const mql = window.matchMedia('(prefers-color-scheme: dark)')
         const listener = () => apply('system')
         mql.addEventListener('change', listener)
         return () => mql.removeEventListener('change', listener)
      }

      return undefined
   }, [theme])

   return { theme, setTheme }
}
