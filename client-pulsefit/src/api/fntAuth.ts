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
   /* `update` con types placeholder se queja por la unión interna de
    * supabase-js. El cast a TablesUpdate<'profiles'> (alias del propio
    * placeholder) se resuelve en cuanto regeneramos con `pnpm types:db`. */
   const { data, error } = await supabase
      .from('profiles')
      .update(patch as never)
      .eq('id', userId)
      .select('*')
      .single()
   if (error) throw error
   return data as ItfProfile
}
