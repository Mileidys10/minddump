import { Injectable, inject } from '@angular/core';
import { DatabaseService, generateSyncId } from './database.service';
import { Recordatorio } from '../models';
import { FirestoreSyncService } from '../services/firestore-sync.service';

export type RecordatorioCreateDto = Omit<Recordatorio, 'id'>;

@Injectable({
  providedIn: 'root'
})
export class RecordatorioRepository {
  private readonly dbService = inject(DatabaseService);
  private readonly syncService = inject(FirestoreSyncService);

  /**
   * Valida que exactamente uno de tareaId o eventoId esté presente (no ambos, no ninguno).
   */
  validarExclusividad(tareaId?: number | null, eventoId?: number | null): void {
    const hasTarea = tareaId !== undefined && tareaId !== null;
    const hasEvento = eventoId !== undefined && eventoId !== null;

    if (!hasTarea && !hasEvento) {
      throw new Error('Un recordatorio debe estar asociado a una tarea o a un evento (ninguno especificado)');
    }

    if (hasTarea && hasEvento) {
      throw new Error('Un recordatorio no puede estar asociado simultáneamente a una tarea y a un evento (exclusividad)');
    }
  }

  /**
   * Valida la validez de fechaHora.
   */
  validarFechaHora(fechaHora: unknown): asserts fechaHora is string {
    if (!fechaHora || typeof fechaHora !== 'string' || fechaHora.trim().length === 0) {
      throw new Error('La fecha y hora del recordatorio es requerida');
    }
    const timestamp = new Date(fechaHora).getTime();
    if (isNaN(timestamp)) {
      throw new Error(`Fecha y hora inválida: "${String(fechaHora)}"`);
    }
  }

  async getAll(): Promise<Recordatorio[]> {
    const todos = await this.dbService.recordatorios.toArray();
    return todos
      .filter(r => !r.deletedAt)
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  }

  async getById(id: number): Promise<Recordatorio | undefined> {
    const item = await this.dbService.recordatorios.get(id);
    return item && !item.deletedAt ? item : undefined;
  }

  async getByTarea(tareaId: number): Promise<Recordatorio[]> {
    const items = await this.dbService.recordatorios.where('tareaId').equals(tareaId).toArray();
    return items
      .filter(r => !r.deletedAt)
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  }

  async getByEvento(eventoId: number): Promise<Recordatorio[]> {
    const items = await this.dbService.recordatorios.where('eventoId').equals(eventoId).toArray();
    return items
      .filter(r => !r.deletedAt)
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  }

  async getAnterioresAHora(fechaReferencia?: string): Promise<Recordatorio[]> {
    const limite = fechaReferencia ? new Date(fechaReferencia).getTime() : Date.now();
    const todos = await this.dbService.recordatorios.toArray();
    return todos
      .filter(r => {
        if (r.deletedAt) return false;
        const t = new Date(r.fechaHora).getTime();
        return !isNaN(t) && t <= limite;
      })
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  }

  async getPendientesNotificar(fechaReferencia?: string): Promise<Recordatorio[]> {
    const limite = fechaReferencia ? new Date(fechaReferencia).getTime() : Date.now();
    const todos = await this.dbService.recordatorios.toArray();
    return todos
      .filter(r => {
        if (r.deletedAt) return false;
        const t = new Date(r.fechaHora).getTime();
        return !isNaN(t) && t <= limite && !r.notificado;
      })
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  }

  async create(recordatorio: RecordatorioCreateDto | Recordatorio): Promise<Recordatorio> {
    this.validarExclusividad(recordatorio.tareaId, recordatorio.eventoId);
    this.validarFechaHora(recordatorio.fechaHora);

    const ahora = new Date().toISOString();
    const recordatorioParaGuardar: Omit<Recordatorio, 'id'> = {
      syncId: (recordatorio as any).syncId || generateSyncId(),
      syncPending: true,
      deletedAt: null,
      titulo: recordatorio.titulo?.trim(),
      descripcion: recordatorio.descripcion?.trim(),
      fechaHora: recordatorio.fechaHora,
      tareaId: recordatorio.tareaId ?? null,
      eventoId: recordatorio.eventoId ?? null,
      notificado: recordatorio.notificado ?? false,
      fechaCreacion: ahora,
      fechaActualizacion: ahora
    };

    const newId = await this.dbService.recordatorios.add(recordatorioParaGuardar as Recordatorio);
    const itemGuardado = {
      ...recordatorioParaGuardar,
      id: newId
    };

    this.syncService.pushToCloud('recordatorios', itemGuardado).catch(err => {
      console.warn('[RecordatorioRepo] Fallback sync:', err);
    });

    return itemGuardado;
  }

  async update(id: number, cambios: Partial<Recordatorio>): Promise<Recordatorio> {
    const actual = await this.dbService.recordatorios.get(id);
    if (!actual) {
      throw new Error(`No se encontró el recordatorio con id ${id}`);
    }

    const nuevaTareaId = cambios.tareaId !== undefined ? cambios.tareaId : actual.tareaId;
    const nuevoEventoId = cambios.eventoId !== undefined ? cambios.eventoId : actual.eventoId;
    this.validarExclusividad(nuevaTareaId, nuevoEventoId);

    if (cambios.fechaHora !== undefined) {
      this.validarFechaHora(cambios.fechaHora);
    }

    const actualizado: Partial<Recordatorio> = {
      ...cambios,
      syncPending: true,
      fechaActualizacion: new Date().toISOString()
    };
    if (cambios.titulo !== undefined) {
      actualizado.titulo = cambios.titulo?.trim();
    }
    if (cambios.descripcion !== undefined) {
      actualizado.descripcion = cambios.descripcion?.trim();
    }

    await this.dbService.recordatorios.update(id, actualizado);
    const itemActualizado = {
      ...actual,
      ...actualizado
    };

    this.syncService.pushToCloud('recordatorios', itemActualizado).catch(() => {});
    return itemActualizado;
  }

  async delete(id: number): Promise<void> {
    const actual = await this.dbService.recordatorios.get(id);
    if (actual) {
      await this.syncService.handleDelete('recordatorios', actual);
    }
  }
}
