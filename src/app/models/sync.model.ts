export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export type SyncableTableName = 'espacios' | 'inbox' | 'notas' | 'tareas' | 'eventos' | 'recordatorios';

export interface SyncableEntity {
  id?: number;
  syncId?: string;
  syncPending?: boolean;
  deletedAt?: string | null;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface SyncStats {
  totalPending: number;
  lastSyncTime: string | null;
  status: SyncStatus;
  errorMessage?: string | null;
}
