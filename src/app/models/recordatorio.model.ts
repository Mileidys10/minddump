import { SyncableEntity } from './sync.model';

export interface Recordatorio extends SyncableEntity {
  id?: number;
  syncId?: string;
  syncPending?: boolean;
  deletedAt?: string | null;
  titulo?: string;
  descripcion?: string;
  fechaHora: string;
  tareaId?: number | null;
  eventoId?: number | null;
  notificado?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}
