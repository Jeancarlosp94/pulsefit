/* Wrappers de librerías externas. */
export { db, type PendingOp } from './dexie-db'
export { enqueueOp, flushQueue, onSyncStateChange, startSyncManager } from './sync-manager'
export {
   initPWAInstallTracking,
   promptInstall,
   isStandalone,
   onInstallabilityChange,
   subscribeServiceWorkerUpdates
} from './pwa'
