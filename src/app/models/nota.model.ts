import { SyncableEntity } from './sync.model';

export interface Nota extends SyncableEntity {
  id?: number;
  syncId?: string;
  syncPending?: boolean;
  deletedAt?: string | null;
  titulo: string;
  contenido?: string;
  categoria?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  espacioId: number | null;
}
