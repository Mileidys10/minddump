import { SyncableEntity } from './sync.model';

export interface Espacio extends SyncableEntity {
  id?: number;
  syncId?: string;
  syncPending?: boolean;
  deletedAt?: string | null;
  nombre: string;
  titulo?: string; // Compatibilidad con referencias de especificación
  descripcion?: string;
  color: string;
  esSistema: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
}
