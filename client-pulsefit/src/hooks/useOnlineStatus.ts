import { useEffect, useState } from 'react'
import { flushQueue } from '@/lib/sync-manager'

interface OnlineState {
   isOnline: boolean
   /** True el primer instante en que recuperamos conexión: útil para mostrar "sincronizando…". */
   justReconnected: boolean
}

/**
 * Estado de conexión + dispara `flushQueue` al recuperarse la red. Este hook
 * NO debe duplicar el listener: lo recomendable es montarlo solo en
 * `AppWithCustomization` o un componente cercano al root.
 */
export const useOnlineStatus = (): OnlineState => {
   const [isOnline, setIsOnline] = useState<boolean>(
      typeof navigator !== 'undefined' ? navigator.onLine : true
   )
   const [justReconnected, setJustReconnected] = useState(false)

   useEffect(() => {
      const onOnline = () => {
         setIsOnline(true)
         setJustReconnected(true)
         void flushQueue()
         /* La marca "justReconnected" dura 5s para mostrar el aviso. */
         window.setTimeout(() => setJustReconnected(false), 5000)
      }
      const onOffline = () => setIsOnline(false)
      window.addEventListener('online', onOnline)
      window.addEventListener('offline', onOffline)
      return () => {
         window.removeEventListener('online', onOnline)
         window.removeEventListener('offline', onOffline)
      }
   }, [])

   return { isOnline, justReconnected }
}
