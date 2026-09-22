import { SyncableEntity } from './sync.model';

export type PrioridadTarea = 'Urgente' | 'Normal' | 'Baja';
export type EstadoTarea = 'Pendiente' | 'En progreso' | 'Completada' | 'Cancelada';

export interface Tarea extends SyncableEntity {
  id?: number;
  syncId?: string;
  syncPending?: boolean;
  deletedAt?: string | null;
  titulo: string;
  descripcion?: string;
  prioridad: PrioridadTarea;
  estado: EstadoTarea;
  fechaLimite?: string | null;
  fechaLímite?: string | null; // Alias para compatibilidad con la especificación
  espacioId: number | null;
  categoria?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}
