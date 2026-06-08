/**
 * Helpers PWA: detección de instalabilidad, prompt nativo y manejo de updates
 * del service worker (registrado por vite-plugin-pwa con `registerType: 'autoUpdate'`).
 */

interface BeforeInstallPromptEvent extends Event {
   readonly platforms: string[]
   prompt: () => Promise<void>
   userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const installListeners: Set<(canInstall: boolean) => void> = new Set()

const notifyInstallable = (canInstall: boolean) => {
   installListeners.forEach((l) => l(canInstall))
}

/**
 * Suscríbete a cambios de instalabilidad. Devuelve unsubscribe.
 * El callback se invoca con `true` si hay un prompt nativo disponible.
 */
export const onInstallabilityChange = (cb: (canInstall: boolean) => void): (() => void) => {
   installListeners.add(cb)
   cb(deferredPrompt !== null)
   return () => {
      installListeners.delete(cb)
   }
}

/** Llamar UNA vez al inicio de la app para capturar el evento `beforeinstallprompt`. */
export const initPWAInstallTracking = (): (() => void) => {
   if (typeof window === 'undefined') return () => {}

   const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      notifyInstallable(true)
   }
   const onInstalled = () => {
      deferredPrompt = null
      notifyInstallable(false)
   }

   window.addEventListener('beforeinstallprompt', onBeforeInstall)
   window.addEventListener('appinstalled', onInstalled)
   return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
   }
}

/** Lanza el prompt nativo de instalación. Devuelve true si el usuario aceptó. */
export const promptInstall = async (): Promise<boolean> => {
   if (!deferredPrompt) return false
   await deferredPrompt.prompt()
   const choice = await deferredPrompt.userChoice
   deferredPrompt = null
   notifyInstallable(false)
   return choice.outcome === 'accepted'
}

/** Detecta si la app está corriendo en modo standalone (instalada). */
export const isStandalone = (): boolean => {
   if (typeof window === 'undefined') return false
   /* iOS Safari */
   const navWithStandalone = window.navigator as Navigator & { standalone?: boolean }
   if (navWithStandalone.standalone) return true
   return window.matchMedia('(display-mode: standalone)').matches
}

/**
 * Suscribirse a cambios del service worker para mostrar el toast
 * "hay una versión nueva 🌱" en el futuro. Por ahora `registerType: 'autoUpdate'`
 * recarga solo, así que esto queda preparado para Fase 4+.
 */
export const subscribeServiceWorkerUpdates = (onUpdate: () => void): (() => void) => {
   if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return () => {}
   }
   const handler = () => onUpdate()
   navigator.serviceWorker.addEventListener('controllerchange', handler)
   return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handler)
   }
}
