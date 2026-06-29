import { supabase } from './supabaseConf'
import type {
   ItfProfile,
   ItfSignInPayload,
   ItfSignUpPayload,
   ItfForgotPasswordPayload
} from '@/interface'

/**
 * Capa fntAuth: envuelve los métodos del SDK de Supabase y normaliza errores.
 * Cualquier `error` no-nulo se lanza para que `useErrorHandling` lo capture.
 */

export const fntSignIn = async ({ email, password }: ItfSignInPayload) => {
   const { data, error } = await supabase.auth.signInWithPassword({ email, password })
   if (error) throw error
   return data
}

export const fntSignUp = async ({ email, password, name, acceptedTerms }: ItfSignUpPayload) => {
   if (!acceptedTerms) {
      throw new Error('Necesitamos que aceptes los términos para continuar 🌱')
   }
   const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
         data: name ? { name } : undefined,
         emailRedirectTo:
            typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
      }
   })
   if (error) throw error
   return data
}

export const fntSignOut = async () => {
   const { error } = await supabase.auth.signOut()
   if (error) throw error
}

export const fntSignInWithGoogle = async () => {
   const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
         redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/home` : undefined
      }
   })
   if (error) throw error
   return data
}

export const fntForgotPassword = async ({ email }: ItfForgotPasswordPayload) => {
   const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
   })
   if (error) throw error
   return data
}

export const fntGetProfile = async (userId: string): Promise<ItfProfile | null> => {
   const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
   if (error) throw error
   return (data as ItfProfile | null) ?? null
}

export const fntUpdateProfile = async (
   userId: string,
   patch: Partial<ItfProfile>
): Promise<ItfProfile> => {
   /* Defensive: si el trigger `handle_new_user` falló o se ejecutó parcialmente
    * (Google OAuth sin raw_user_meta_data, race conditions con RLS, etc.),
    * la fila profiles puede no existir y un UPDATE puro retorna 0 filas →
    * `.single()` explota con "Cannot coerce the result to a single JSON object".
    *
    * Solución: 1) intentar UPDATE, 2) si retorna null, hacer UPSERT con id+email
    *  como base. Usamos `.maybeSingle()` para no fallar si no encuentra.
    */
   const updateRes = await supabase
      .from('profiles')
      .update(patch as never)
      .eq('id', userId)
      .select('*')
      .maybeSingle()

   if (updateRes.error) throw updateRes.error
   if (updateRes.data) return updateRes.data as ItfProfile

   /* No existe la fila → upsert defensivo. */
   const { data: auth } = await supabase.auth.getUser()
   const fallbackEmail = auth.user?.email ?? ''
   const upsertRes = await supabase
      .from('profiles')
      .upsert({ id: userId, email: fallbackEmail, ...patch } as never, {
         onConflict: 'id'
      })
      .select('*')
      .maybeSingle()

   if (upsertRes.error) throw upsertRes.error
   if (!upsertRes.data) {
      throw new Error('No pudimos guardar tu perfil. Vuelve a intentarlo 🌱')
   }
   return upsertRes.data as ItfProfile
}
