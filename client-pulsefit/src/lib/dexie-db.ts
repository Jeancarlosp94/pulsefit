import Dexie, { type Table } from 'dexie'
import type {
   ProfileRow,
   DailyLogRow,
   MealLogRow,
   WorkoutLogRow,
   RescueEventRow
} from '@/interface/database'

/**
 * Operación pendiente en cola: cuando el dispositivo recupera conexión, el
 * `sync-manager` la lee, la ejecuta contra Supabase y la elimina.
 */
export interface PendingOp {
   /** UUID local para deduplicar entre reintentos. */
   id: string
   table: 'daily_logs' | 'meal_logs' | 'workout_logs' | 'rescue_events'
   operation: 'insert' | 'update' | 'delete'
   payload: unknown
   created_at: number
   attempts: number
   last_error?: string
}

class PulseFitDexie extends Dexie {
   profiles!: Table<ProfileRow, string>
   daily_logs!: Table<DailyLogRow, string>
   meal_logs!: Table<MealLogRow, string>
   workout_logs!: Table<WorkoutLogRow, string>
   rescue_events!: Table<RescueEventRow, string>
   pending_ops!: Table<PendingOp, string>

   constructor() {
      super('pulsefit')
      /* Mirroreamos solo las tablas críticas para offline. Catálogos y planes
       * llegan por la cache del SW; lo que necesitamos en IDB es lo que el
       * usuario ESCRIBE estando offline. */
      this.version(1).stores({
         profiles: 'id, email',
         daily_logs: 'id, user_id, log_date, [user_id+log_date]',
         meal_logs: 'id, user_id, log_date, [user_id+log_date]',
         workout_logs: 'id, user_id, log_date, [user_id+log_date]',
         rescue_events: 'id, user_id, event_date',
         pending_ops: 'id, table, created_at'
      })
   }
}

export const db = new PulseFitDexie()
