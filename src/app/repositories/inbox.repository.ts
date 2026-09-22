import { Injectable, inject } from '@angular/core';
import { DatabaseService, generateSyncId } from './database.service';
import { InboxItem } from '../models';
import { FirestoreSyncService } from '../services/firestore-sync.service';

export interface InboxCreateDto {
  titulo: string;
  descripcion?: string;
  tipo?: string;
  organizado?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InboxRepository {
  private readonly dbService = inject(DatabaseService);
  private readonly syncService = inject(FirestoreSyncService);

  async getPendientes(): Promise<InboxItem[]> {
    const items = await this.dbService.inbox
      .filter(item => item.organizado === false && !item.deletedAt)
      .toArray();

    return items.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }

  async getAll(): Promise<InboxItem[]> {
    const items = await this.dbService.inbox
      .filter(item => !item.deletedAt)
      .toArray();
    return items.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  }

  async getById(id: number): Promise<InboxItem | undefined> {
    const item = await this.dbService.inbox.get(id);
    return item && !item.deletedAt ? item : undefined;
  }

  async create(data: InboxCreateDto): Promise<InboxItem> {
    const ahora = new Date().toISOString();
    const nuevoItem: InboxItem = {
      syncId: generateSyncId(),
      syncPending: true,
      deletedAt: null,
      titulo: data.titulo.trim(),
      descripcion: (data.descripcion || '').trim(),
      fechaCreacion: ahora,
      fechaActualizacion: ahora,
      organizado: data.organizado ?? false,
      tipo: data.tipo
    };

    const id = await this.dbService.inbox.add(nuevoItem);
    const itemGuardado = { ...nuevoItem, id };

    this.syncService.pushToCloud('inbox', itemGuardado).catch(err => {
      console.warn('[InboxRepo] Fallback sync:', err);
    });

    return itemGuardado;
  }

  async update(id: number, cambios: Partial<InboxItem>): Promise<void> {
    const actual = await this.dbService.inbox.get(id);
    if (!actual) {
      throw new Error(`Captura de Inbox con id ${id} no encontrada`);
    }

    const actualizacion: Partial<InboxItem> = {
      ...cambios,
      syncPending: true,
      fechaActualizacion: new Date().toISOString()
    };

    if (cambios.titulo !== undefined) {
      actualizacion.titulo = cambios.titulo.trim();
    }
    if (cambios.descripcion !== undefined) {
      actualizacion.descripcion = cambios.descripcion.trim();
    }

    await this.dbService.inbox.update(id, actualizacion);
    const itemActualizado = await this.dbService.inbox.get(id);
    if (itemActualizado) {
      this.syncService.pushToCloud('inbox', itemActualizado).catch(() => {});
    }
  }

  async delete(id: number): Promise<void> {
    const actual = await this.dbService.inbox.get(id);
    if (actual) {
      await this.syncService.handleDelete('inbox', actual);
    }
  }

  async marcarOrganizado(id: number): Promise<void> {
    const actual = await this.dbService.inbox.get(id);
    if (!actual) {
      throw new Error(`Captura de Inbox con id ${id} no encontrada`);
    }
    await this.update(id, { organizado: true });
  }
}
