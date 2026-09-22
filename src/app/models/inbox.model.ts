import { SyncableEntity } from './sync.model';

export interface InboxItem extends SyncableEntity {
  id?: number;
  syncId?: string;
  syncPending?: boolean;
  deletedAt?: string | null;
  titulo: string;
  descripcion?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
  organizado: boolean;
  tipo?: string;
}
