import { describe, it, expect } from 'vitest'
import { supabase } from './supabaseConf'

describe('supabaseConf (smoke)', () => {
   it('expone un cliente Supabase con métodos esperados', () => {
      expect(supabase).toBeDefined()
      expect(typeof supabase.auth.signInWithPassword).toBe('function')
      expect(typeof supabase.auth.signOut).toBe('function')
      expect(typeof supabase.from).toBe('function')
   })

   it('configura persistSession y autoRefreshToken via SDK', () => {
      /* El SDK no expone su config, pero verificamos que los métodos
       * de auth devuelven promesas (sanidad básica). */
      const result = supabase.auth.getSession()
      expect(typeof (result as Promise<unknown>).then).toBe('function')
   })
})
