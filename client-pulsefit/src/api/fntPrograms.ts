import { supabase } from './supabaseConf'
import type {
   ItfCreateProgramInput,
   ItfTrainingPhase,
   ItfTrainingProgram
} from '@/interface/itfPrograms'

/** Lee el programa activo del usuario (o null si no tiene). */
export const fntGetActiveProgram = async (): Promise<ItfTrainingProgram | null> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return null

   const { data, error } = await supabase
      .from('training_programs')
      .select('*, phases:training_phases(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

   if (error) throw new Error(error.message)
   if (!data) return null
   return data as unknown as ItfTrainingProgram
}

/** Crea un programa nuevo con sus fases. Transaccional al nivel del cliente. */
export const fntCreateProgram = async (
   input: ItfCreateProgramInput
): Promise<ItfTrainingProgram> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) throw new Error('Sesión inválida, vuelve a entrar 🌱')

   /* Marcar programas activos previos como pausados. */
   await supabase
      .from('training_programs')
      .update({ status: 'paused', updated_at: new Date().toISOString() } as never)
      .eq('user_id', userId)
      .eq('status', 'active')

   /* Crear el program. */
   const { data: created, error: insertErr } = await supabase
      .from('training_programs')
      .insert({
         user_id: userId,
         name: input.name,
         goal_type: input.goal_type,
         target_weight_kg: input.target_weight_kg ?? null,
         target_date: input.target_date ?? null,
         total_weeks: input.total_weeks,
         start_date: input.start_date ?? new Date().toISOString().slice(0, 10),
         status: 'active',
         notes: input.notes ?? null
      } as never)
      .select('*')
      .single()

   if (insertErr || !created) {
      throw new Error(`No pudimos crear tu programa: ${insertErr?.message ?? 'error'} 🌿`)
   }

   const programId = (created as { id: string }).id

   /* Insertar las fases. */
   const phasesRows = input.phases.map((p) => ({
      program_id: programId,
      phase_order: p.phase_order,
      phase_name: p.phase_name,
      modality: p.modality,
      weeks: p.weeks,
      sessions_per_week: p.sessions_per_week,
      intensity_target: p.intensity_target,
      focus: p.focus,
      description: p.description ?? null
   }))

   const { data: phasesData, error: phasesErr } = await supabase
      .from('training_phases')
      .insert(phasesRows as never)
      .select('*')

   if (phasesErr) {
      /* Rollback manual: borrar el program. */
      await supabase.from('training_programs').delete().eq('id', programId)
      throw new Error(`No pudimos crear las fases: ${phasesErr.message} 🌿`)
   }

   return {
      ...(created as unknown as ItfTrainingProgram),
      phases: (phasesData as unknown as ItfTrainingPhase[]) ?? []
   }
}

/** Cancela el programa activo (no lo borra: queda en historial). */
export const fntCancelActiveProgram = async (): Promise<void> => {
   const { data: auth } = await supabase.auth.getUser()
   const userId = auth.user?.id
   if (!userId) return

   await supabase
      .from('training_programs')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() } as never)
      .eq('user_id', userId)
      .eq('status', 'active')
}
