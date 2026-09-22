import { Injectable, inject } from '@angular/core';
import { DatabaseService, generateSyncId } from './database.service';
import { Espacio } from '../models';
import { FirestoreSyncService } from '../services/firestore-sync.service';

@Injectable({
  providedIn: 'root'
})
export class EspacioRepository {
  private readonly dbService = inject(DatabaseService);
  private readonly syncService = inject(FirestoreSyncService);

  async getAll(): Promise<Espacio[]> {
    const list = await this.dbService.espacios.toArray();
    return list.filter(e => !e.deletedAt);
  }

  async getById(id: number): Promise<Espacio | undefined> {
    const item = await this.dbService.espacios.get(id);
    return item && !item.deletedAt ? item : undefined;
  }

  async create(espacio: Omit<Espacio, 'id'>): Promise<Espacio> {
    const ahora = new Date().toISOString();
    const nuevoEspacio: Espacio = {
      ...espacio,
      syncId: espacio.syncId || generateSyncId(),
      syncPending: true,
      deletedAt: null,
      fechaCreacion: espacio.fechaCreacion || ahora,
      fechaActualizacion: ahora
    };

    const id = await this.dbService.espacios.add(nuevoEspacio);
    const itemGuardado = { ...nuevoEspacio, id };

    // Sincronización en segundo plano sin bloquear UI
    this.syncService.pushToCloud('espacios', itemGuardado).catch(err => {
      console.warn('[EspacioRepo] Fallback sync:', err);
    });

    return itemGuardado;
  }

  async update(id: number, cambios: Partial<Espacio>): Promise<void> {
    const actual = await this.dbService.espacios.get(id);
    if (!actual) return;

    const actualizacion: Partial<Espacio> = {
      ...cambios,
      syncPending: true,
      fechaActualizacion: new Date().toISOString()
    };

    await this.dbService.espacios.update(id, actualizacion);
    const itemActualizado = await this.dbService.espacios.get(id);
    if (itemActualizado) {
      this.syncService.pushToCloud('espacios', itemActualizado).catch(err => {
        console.warn('[EspacioRepo] Fallback sync:', err);
      });
    }
  }

  async delete(id: number): Promise<void> {
    const actual = await this.dbService.espacios.get(id);
    if (actual) {
      await this.syncService.handleDelete('espacios', actual);
    }
  }

  async detachElements(espacioId: number): Promise<void> {
    // Desvincular notas, tareas y eventos asignándoles espacioId: null
    await this.dbService.notas.where('espacioId').equals(espacioId).modify(nota => {
      nota.espacioId = null;
      nota.syncPending = true;
      nota.fechaActualizacion = new Date().toISOString();
    });
    await this.dbService.tareas.where('espacioId').equals(espacioId).modify(tarea => {
      tarea.espacioId = null;
      tarea.syncPending = true;
      tarea.fechaActualizacion = new Date().toISOString();
    });
    await this.dbService.eventos.where('espacioId').equals(espacioId).modify(evento => {
      evento.espacioId = null;
      evento.syncPending = true;
      evento.fechaActualizacion = new Date().toISOString();
    });
    this.syncService.pushPending().catch(() => {});
  }
}
