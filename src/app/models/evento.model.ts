import { SyncableEntity } from './sync.model';

export interface Evento extends SyncableEntity {
  id?: number;
  syncId?: string;
  syncPending?: boolean;
  deletedAt?: string | null;
  titulo: string;
  descripcion?: string;
  categoria?: string;
  fechaInicio: string;
  fechaFin: string;
  espacioId: number | null;
  fechaCreacion: string;
  fechaActualizacion?: string;
}
