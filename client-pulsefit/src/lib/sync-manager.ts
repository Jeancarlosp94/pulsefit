import { supabase } from '@/api/supabaseConf'
import { db, type PendingOp } from './dexie-db'

/**
 * Cola de operaciones offline: insertar, actualizar o borrar contra Supabase.
 *
 * Estrategia mínima viable (Fase 3.5): cuando estás offline, la app encola
 * la operación en `pending_ops`. Cuando se recupera la conexión, el manager
 * itera y reintenta. Si falla, mantiene la operación en cola con
 * `attempts++`. En Fase 8+ podemos implementar backoff exponencial.
 */

const MAX_ATTEMPTS = 5

let flushing = false
const listeners: Set<(state: { pending: number; running: boolean }) => void> = new Set()

const notify = async () => {
   const pending = await db.pending_ops.count().catch(() => 0)
   const state = { pending, running: flushing }
   listeners.forEach((l) => l(state))
}

export const onSyncStateChange = (
   listener: (state: { pending: number; running: boolean }) => void
) => {
   listeners.add(listener)
   void notify()
   return () => {
      listeners.delete(listener)
   }
}

const newId = (): string => {
   if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
   }
   return `op_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/** Encola una operación para ejecutar en cuanto haya conexión. */
export const enqueueOp = async (op: Omit<PendingOp, 'id' | 'created_at' | 'attempts'>) => {
   const full: PendingOp = {
      ...op,
      id: newId(),
      created_at: Date.now(),
      attempts: 0
   }
   await db.pending_ops.add(full)
   await notify()
   if (typeof navigator !== 'undefined' && navigator.onLine) {
      void flushQueue()
   }
}

const runOp = async (op: PendingOp): Promise<void> => {
   const builder = supabase.from(op.table)
   if (op.operation === 'insert') {
      const { error } = await builder.insert(op.payload as never)
      if (error) throw error
      return
   }
   if (op.operation === 'update') {
      const { id, patch } = op.payload as { id: string; patch: Record<string, unknown> }
      const { error } = await builder.update(patch as never).eq('id', id)
      if (error) throw error
      return
   }
   if (op.operation === 'delete') {
      const { id } = op.payload as { id: string }
      const { error } = await builder.delete().eq('id', id)
      if (error) throw error
      return
   }
}

/** Drena la cola completa. Se invoca en `online` event y cuando se llama explícitamente. */
export const flushQueue = async (): Promise<void> => {
   if (flushing) return
   flushing = true
   await notify()
   try {
      const ops = await db.pending_ops.orderBy('created_at').toArray()
      for (const op of ops) {
         try {
            await runOp(op)
            await db.pending_ops.delete(op.id)
         } catch (e) {
            const attempts = (op.attempts ?? 0) + 1
            const last_error = e instanceof Error ? e.message : 'unknown'
            if (attempts >= MAX_ATTEMPTS) {
               console.error('[sync-manager] descartando op tras 5 intentos', op, last_error)
               await db.pending_ops.delete(op.id)
            } else {
               await db.pending_ops.update(op.id, { attempts, last_error })
            }
         }
      }
   } finally {
      flushing = false
      await notify()
   }
}

/** Conecta la cola al ciclo online/offline del navegador. Llamar UNA vez al iniciar la app. */
export const startSyncManager = (): (() => void) => {
   const onOnline = () => {
      void flushQueue()
   }
   if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline)
      if (navigator.onLine) void flushQueue()
   }
   return () => {
      if (typeof window !== 'undefined') {
         window.removeEventListener('online', onOnline)
      }
   }
}
