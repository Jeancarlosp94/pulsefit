import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { Toaster, toast } from 'sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useTheme } from '@/hooks/useTheme'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { initPWAInstallTracking, startSyncManager } from '@/lib'

interface Props {
   children: ReactNode
}

/**
 * Providers globales: react-query, error boundary, sonner toaster integrado al
 * tema, hook de tema, online-status, sync-manager y tracking de instalación PWA.
 */
export const AppWithCustomization = ({ children }: Props) => {
   const [queryClient] = useState(
      () =>
         new QueryClient({
            defaultOptions: {
               queries: {
                  staleTime: 1000 * 60 * 5,
                  retry: (failureCount, error) => {
                     const status = (error as { status?: number })?.status
                     if (status && [401, 403, 404].includes(status)) return false
                     return failureCount < 2
                  },
                  refetchOnWindowFocus: false,
                  networkMode: 'offlineFirst'
               },
               mutations: {
                  networkMode: 'offlineFirst'
               }
            }
         })
   )

   const { theme } = useTheme()
   const { isOnline, justReconnected } = useOnlineStatus()

   useEffect(() => {
      const stopSync = startSyncManager()
      const stopInstall = initPWAInstallTracking()
      return () => {
         stopSync()
         stopInstall()
      }
   }, [])

   /* Avisos compasivos de conexión. */
   useEffect(() => {
      if (!isOnline) {
         toast('Sin conexión, guardamos local y sincronizamos después 📡', {
            id: 'offline-toast',
            duration: Infinity
         })
      } else {
         toast.dismiss('offline-toast')
         if (justReconnected) {
            toast.success('Volvimos en línea 🌿', { id: 'online-toast' })
         }
      }
   }, [isOnline, justReconnected])

   return (
      <ErrorBoundary>
         <QueryClientProvider client={queryClient}>
            {children}
            <Toaster
               position='top-center'
               theme={theme === 'system' ? 'system' : theme}
               richColors={false}
               closeButton
               toastOptions={{
                  classNames: {
                     toast: 'rounded-lg border border-border bg-card text-card-foreground shadow-md',
                     description: 'text-muted-foreground',
                     success: '!text-primary',
                     error: '!text-accent',
                     warning: '!text-secondary'
                  }
               }}
            />
         </QueryClientProvider>
      </ErrorBoundary>
   )
}
