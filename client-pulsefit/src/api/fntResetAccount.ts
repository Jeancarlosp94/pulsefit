import { supabase } from './supabaseConf'

/**
 * Marca el onboarding como NO completado para forzar al usuario a rehacer
 * el cuestionario. No borra logs, planes ni preferencias persistidas — solo
 * resetea el flag.
 *
 * Por seguridad RLS solo afecta al propio perfil del usuario autenticado.
 */
export const fntResetOnboardingOnly = async (): Promise<void> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: false } as never)
      .eq('id', userId)

   if (error) throw new Error(`No pudimos resetear: ${error.message.slice(0, 100)} 🌿`)
}

/**
 * Borra TODOS los datos del usuario: meal_plans, workout_logs y resetea
 * el onboarding. Conserva la cuenta de auth (signOut/signUp separado).
 *
 * Las foreign keys con ON DELETE CASCADE garantizan limpieza atómica;
 * acá las borramos explícitas porque no todas las tablas tienen
 * cascade desde profiles.
 */
export const fntResetAllData = async (): Promise<void> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   /* Borrar planes de comidas. */
   const { error: plansError } = await supabase.from('meal_plans').delete().eq('user_id', userId)
   if (plansError) throw new Error(`Error borrando planes: ${plansError.message.slice(0, 80)} 🌿`)

   /* Borrar logs de entrenamiento. */
   const { error: logsError } = await supabase.from('workout_logs').delete().eq('user_id', userId)
   if (logsError) throw new Error(`Error borrando logs: ${logsError.message.slice(0, 80)} 🌿`)

   /* Resetear flags + preferencias del perfil. */
   const { error: profileError } = await supabase
      .from('profiles')
      .update({
         onboarding_completed: false,
         favorite_cuisines: [],
         favorite_ingredient_ids: [],
         family_size: 1
      } as never)
      .eq('id', userId)
   if (profileError) {
      throw new Error(`Error reseteando perfil: ${profileError.message.slice(0, 80)} 🌿`)
   }
}
