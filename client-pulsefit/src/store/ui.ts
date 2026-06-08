import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ThemeMode } from '@/themes'

interface UIState {
   theme: ThemeMode
   setTheme: (theme: ThemeMode) => void
}

/**
 * Estado de UI persistente: tema (claro / oscuro / sistema).
 * Persistimos en localStorage para que la PWA recuerde la preferencia entre sesiones.
 */
export const useUIStore = create<UIState>()(
   persist(
      (set) => ({
         theme: 'system',
         setTheme: (theme) => set({ theme })
      }),
      {
         name: 'pulsefit-ui',
         storage: createJSONStorage(() => localStorage),
         version: 1
      }
   )
)
