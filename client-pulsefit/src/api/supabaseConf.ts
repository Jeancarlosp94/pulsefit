import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/interface/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
   /* No tirar error en producción para evitar pantalla blanca; los toasts
    * compasivos se encargan después. Sí avisamos en consola. */
   console.warn('[supabaseConf] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local')
}

/**
 * Cliente Supabase singleton. Toda la app importa desde aquí — nunca
 * instanciar otro cliente o se rompería la persistencia de sesión.
 */
export const supabase = createClient<Database>(
   supabaseUrl ?? 'http://127.0.0.1:54321',
   supabaseAnonKey ?? 'placeholder-anon-key',
   {
      auth: {
         persistSession: true,
         autoRefreshToken: true,
         detectSessionInUrl: true,
         storage: typeof window !== 'undefined' ? window.localStorage : undefined,
         storageKey: 'pulsefit-auth'
      },
      global: {
         headers: {
            'X-Client-Info': 'pulsefit-pwa@0.1.0'
         }
      }
   }
)
